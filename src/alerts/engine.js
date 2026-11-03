import { ALERT_RULES } from './ruleRegistry.js';
import { ALERT_SOURCE_FIELD_SCHEMA, ALERT_HISTORY_SCHEMA } from './sourceSchema.js';

const CONFIDENCE_RANK = { none: 0, low: 1, medium: 2, high: 3 };
const KNOWN_OPS = new Set(['>', '>=', '<', '<=', '=', '≠', '!=']);
const getPath = (obj, path) => String(path).split('.').reduce((v, key) => v == null ? undefined : v[key], obj);

function compare(actual, operator, expected) {
  if (actual === undefined || actual === null) return null;
  if (actual === '' && String(expected).toLowerCase() === 'vide') return operator === '=' || operator === '==';
  if (typeof actual === 'boolean' && typeof expected === 'string') {
    if (expected.toLowerCase() === 'oui') actual = actual ? 'Oui' : 'Non';
    if (expected.toLowerCase() === 'non') actual = actual ? 'Oui' : 'Non';
  }
  switch (operator) {
    case '>': return Number(actual) > Number(expected);
    case '>=': return Number(actual) >= Number(expected);
    case '<': return Number(actual) < Number(expected);
    case '<=': return Number(actual) <= Number(expected);
    case '=': return typeof expected === 'number' ? Number(actual) === expected : String(actual).toLowerCase() === String(expected).toLowerCase();
    case '≠': case '!=': return typeof expected === 'number' ? Number(actual) !== expected : String(actual).toLowerCase() !== String(expected).toLowerCase();
    default: throw new Error(`Unsupported alert operator: ${operator}`);
  }
}

function resolveCondition(condition, context) {
  const { field, temporal } = condition;
  const kpiId = field.match(/^([A-Z]{2}\d)/)?.[1];
  let actual;
  let sourceType = 'auxiliary';
  let confidence = null;
  let sourceValue = null;
  let invalid = false;

  if (temporal?.temporal === 'variation') {
    sourceType = 'history';
    confidence = context.kpis?.[kpiId]?.confidence ?? 'none';
    const series = context.history?.[kpiId];
    if (!Array.isArray(series) || series.length < 2) actual = undefined;
    else actual = Number(series.at(-1)) - Number(series.at(-2));
    sourceValue = series ?? null;
    if (!Array.isArray(series) || series.some((value) => !Number.isFinite(Number(value)))) {
      actual = undefined;
      invalid = series !== undefined && series !== null;
    }
  } else if (temporal?.temporal === 'consecutive_periods') {
    sourceType = 'history';
    confidence = context.kpis?.[kpiId]?.confidence ?? 'none';
    const series = context.history?.[kpiId];
    sourceValue = series ?? null;
    if (!Array.isArray(series) || series.length < temporal.minimumPeriods || series.some((value) => !Number.isFinite(Number(value)))) {
      actual = undefined;
      invalid = series !== undefined && series !== null;
    } else actual = series.slice(-temporal.minimumPeriods);
  } else if (kpiId && context.kpis?.[kpiId]) {
    sourceType = 'kpi';
    const result = context.kpis[kpiId];
    actual = result.value;
    confidence = result.confidence ?? 'none';
    sourceValue = { value: result.value, state: result.state, confidence: result.confidence, asOf: result.asOf };
  } else {
    const normalized = field.startsWith('Projet.') && field === 'Projet.Statut'
      ? 'project.status'
      : field;
    actual = normalized === 'project.status'
      ? (context.project?.status === 'completed' ? 'Achevé' : (context.project?.status ? 'En cours' : undefined))
      : getPath(context.sourceFields ?? {}, normalized);
    sourceValue = actual;
    const schema = ALERT_SOURCE_FIELD_SCHEMA[field];
    if (schema && actual !== undefined && actual !== null) {
      const valid = schema.type === 'number'
        ? typeof actual === 'number' && Number.isFinite(actual)
        : schema.type === 'boolean-or-label'
          ? [true, false, 'Oui', 'Non'].includes(actual)
          : typeof actual === 'string' && (schema.emptyAllowed || actual.trim() !== '')
            && (!schema.accepted || schema.accepted.includes(actual));
      if (!valid) { invalid = true; actual = undefined; }
    }
  }

  if (Array.isArray(actual)) {
    const booleans = actual.map((value) => compare(value, condition.operator, condition.value));
    const result = booleans.every((value) => value === true);
    return { id: condition.id, field, actual, expected: condition.value, operator: condition.operator, result, missing: actual.length < (temporal?.minimumPeriods ?? 1) || booleans.some((value) => value === null), invalid, confidence, sourceType, sourceValue };
  }
  const result = compare(actual, condition.operator, condition.value);
  return { id: condition.id, field, actual: actual ?? null, expected: condition.value, operator: condition.operator, result, missing: result === null, invalid, confidence, sourceType, sourceValue };
}

function evaluateExpression(node, byId) {
  if (node.condition) return byId[node.condition]?.result ?? null;
  if (node.all) {
    const values = node.all.map((child) => evaluateExpression(child, byId));
    if (values.includes(false)) return false;
    return values.every((value) => value === true) ? true : null;
  }
  if (node.any) {
    const values = node.any.map((child) => evaluateExpression(child, byId));
    if (values.includes(true)) return true;
    return values.every((value) => value === false) ? false : null;
  }
  return null;
}

function assessQualityGate(rule, context) {
  if (rule.id === 'AL16') return { ok: true, reasons: [] };
  const quality = context.quality ?? {};
  const reasons = [];
  for (const id of ['DO1', 'DO2', 'DO3']) {
    const item = quality[id] ?? context.kpis?.[id];
    if (!item || item.value === null || item.value === undefined) {
      reasons.push(`${id}: qualité non vérifiable`);
      continue;
    }
    if ((CONFIDENCE_RANK[item.confidence ?? 'none'] ?? 0) < CONFIDENCE_RANK.medium) {
      reasons.push(`${id}: confiance ${item.confidence ?? 'none'} insuffisante`);
    }
    if (id === 'DO1' && Number(item.value) > 2) reasons.push('DO1: données trop anciennes (> 2 périodes)');
    if (id === 'DO2' && Number(item.value) < 70) reasons.push('DO2: complétude inférieure à 70 %');
    if (id === 'DO3' && Number(item.value) > 20) reasons.push('DO3: taux d’incohérence supérieur à 20 %');
  }
  return { ok: reasons.length === 0, reasons };
}

/** Evaluate one workbook rule against one project/contract/portfolio context. */
export function evaluateAlertRule(rule, context, evaluatedAt = new Date().toISOString()) {
  const conditions = rule.conditions.map((condition) => resolveCondition(condition, context));
  const byId = Object.fromEntries(conditions.map((condition) => [condition.id, condition]));
  const expressionResult = evaluateExpression(rule.expression, byId);
  const missingConditions = conditions.filter((condition) => condition.missing).map((condition) => condition.id);
  const invalidConditions = conditions.filter((condition) => condition.invalid).map((condition) => condition.id);
  const lowConfidence = conditions.filter((condition) => ['kpi', 'history'].includes(condition.sourceType)
    && (CONFIDENCE_RANK[condition.confidence ?? 'none'] ?? 0) < CONFIDENCE_RANK.medium);
  const qualityGate = assessQualityGate(rule, context);

  let evaluationStatus = 'evaluable';
  let triggered = false;
  let reason = '';
  if (expressionResult === null) {
    evaluationStatus = 'not_evaluable';
    reason = `Données requises absentes ou incomplètes : ${missingConditions.join(', ') || 'expression indéterminée'}.`;
  } else if (lowConfidence.length) {
    evaluationStatus = 'insufficient_data';
    reason = `Confiance insuffisante pour ${lowConfidence.map((item) => item.id).join(', ')}.`;
  } else if (expressionResult === true && !qualityGate.ok) {
    evaluationStatus = 'insufficient_data';
    reason = `Garde-fou qualité bloquant : ${qualityGate.reasons.join('; ')}.`;
  } else {
    triggered = expressionResult === true;
    reason = triggered ? 'Toutes les conditions de la règle sont satisfaites.' : 'Au moins une condition requise n’est pas satisfaite.';
  }

  const entityRoot = rule.conditions.map((condition) => condition.field.split('.')[0])
    .find((root) => ['Blocage', 'NC', 'Situation', 'Avenant'].includes(root));
  const entityId = context.entityId ?? context.sourceFields?.[entityRoot]?.id ?? context.sourceFields?.contractId ?? null;
  return {
    ruleId: rule.id,
    projectId: context.project?.id ?? context.projectId ?? null,
    entityId,
    status: evaluationStatus,
    triggered: evaluationStatus === 'evaluable' && triggered,
    severity: rule.severity,
    values: conditions,
    requiredSourceValues: conditions.map(({ id, field, sourceType, sourceValue }) => ({ id, field, sourceType, value: sourceValue })),
    missingConditions,
    invalidConditions,
    dataConfidence: lowConfidence.length || !qualityGate.ok ? 'low' : (conditions.some((item) => item.missing)
      ? 'none'
      : conditions.reduce((min, item) => {
        if (item.confidence && (CONFIDENCE_RANK[item.confidence] ?? 0) < (CONFIDENCE_RANK[min] ?? 0)) return item.confidence;
        return min;
      }, 'high')),
    qualityGate,
    evaluatedAt,
    reason
  };
}

/** Evaluate all 17 registered rules; source fields remain explicitly absent unless supplied. */
export function evaluateAlertRules(context, evaluatedAt = new Date().toISOString()) {
  return ALERT_RULES.map((rule) => evaluateAlertRule(rule, context, evaluatedAt));
}

export function assertAlertRegistry(registry = ALERT_RULES) {
  const expected = Array.from({ length: 17 }, (_, i) => `AL${String(i + 1).padStart(2, '0')}`);
  const ids = registry.map((rule) => rule.id);
  if (ids.length !== 17 || new Set(ids).size !== 17 || expected.some((id) => !ids.includes(id))) {
    throw new Error(`Alert registry must contain exactly AL01–AL17; received ${ids.join(', ')}`);
  }
  registry.forEach((rule) => rule.conditions.forEach((condition) => {
    if (!KNOWN_OPS.has(condition.operator)) throw new Error(`${rule.id}: unsupported operator ${condition.operator}`);
  }));
  return true;
}
assertAlertRegistry();
