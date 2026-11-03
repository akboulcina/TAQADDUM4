import { CALC_STATE, STATUS, AGGREGATION } from './constants.js';
import { calculated, missingData, needsValidation, notApplicable, notImplemented, partial, reason } from './results.js';
import { isNum, median, ratio, sum, weightedMean } from './primitives.js';
import { isActiveProject } from './validation.js';
import { evaluateKpi, statusDistribution } from './thresholds.js';
import { getKpi } from './registry.js';

/*
 * Portfolio aggregation. One function per method, each documented in
 * AGGREGATION_DOC (shown in the catalogue). Rules common to all methods:
 *
 *  - the population is the active projects, or all projects, as the KPI declares;
 *  - a project whose result is not_applicable leaves both numerator and
 *    denominator (nothing to measure), it is not "missing";
 *  - a project with missing / invalid inputs is EXCLUDED and listed — the
 *    portfolio value is then « partial », never silently computed on less;
 *  - nothing is averaged unless the method says so; medians are taken over the
 *    pooled items, never as a median of per-project medians.
 */

export const AGGREGATION_DOC = Object.freeze({
  [AGGREGATION.POOLED_RATIO]: 'Σ numerators ÷ Σ denominators over the projects in scope (weights the projects by their own amounts / counts).',
  [AGGREGATION.WEIGHTED_MEAN_AE]: 'Mean of project values weighted by AE actuelle (AE de référence). Projects without an AE are excluded.',
  [AGGREGATION.MEDIAN_POOLED]: 'Median over all underlying items of the scope (e.g. every open blocker), not a median of project medians.',
  [AGGREGATION.OLDEST_ITEM]: 'Age of the oldest pending item in the whole scope; counts are summed.',
  [AGGREGATION.PROPORTION_OF_ACTIVE]: 'Projects meeting the condition ÷ active projects × 100 (AE-weighted for CO3). Unclassifiable projects are excluded and listed.',
  [AGGREGATION.PROPORTION_OF_ALL]: 'Projects meeting the condition ÷ all projects × 100.',
  [AGGREGATION.MEDIAN_OF_PROJECTS]: 'Median of the project values (specified by the workbook for DL3). Completed projects are excluded.',
  [AGGREGATION.COUNT_POOLED]: 'Sum of the project counts.',
  [AGGREGATION.MAX_OF_UNITS]: 'Worst market / unit of the scope — values of different markets are never averaged.',
  [AGGREGATION.DISTRIBUTION]: 'No portfolio scalar: number of projects per status. A mean of this project indicator would mix incomparable values.',
  [AGGREGATION.NOT_AGGREGATED]: 'Meaningful per project or contractor only.'
});

const OK = new Set([CALC_STATE.CALCULATED, CALC_STATE.PARTIAL]);
const isMethodValidation = (r) => r.state === CALC_STATE.REQUIRES_VALIDATION && r.detail?.validationKind === 'method' && r.value !== null;
const hasValue = (r) => (OK.has(r.state) || isMethodValidation(r)) && r.value !== null && r.value !== undefined;

const unique = (list) => [...new Set(list)];

/** Split entries into used / not applicable / excluded and compute the shared coverage block. */
function partition(entries) {
  const used = [];
  const notApplicableEntries = [];
  const excluded = [];
  entries.forEach((entry) => {
    if (hasValue(entry.result)) used.push(entry);
    else if (entry.result.state === CALC_STATE.NOT_APPLICABLE) notApplicableEntries.push(entry);
    else excluded.push({ projectId: entry.project.id, state: entry.result.state, missing: entry.result.missing, reasons: entry.result.reasons });
  });
  return { used, notApplicableEntries, excluded };
}

function emptyOutcome(id, population, parts) {
  const { used, notApplicableEntries, excluded } = parts;
  const coverage = { population: population.length, used: 0, notApplicable: notApplicableEntries.length, excluded };
  if (!population.length) return notApplicable('no_projects_in_scope', null, { detail: { coverage } });
  if (!excluded.length) return notApplicable(notApplicableEntries[0]?.result.reasons[0]?.code ?? 'nothing_to_measure', notApplicableEntries[0]?.result.reasons[0]?.params, { detail: { coverage } });
  const methodOnly = excluded.every((entry) => entry.state === CALC_STATE.REQUIRES_VALIDATION);
  const missing = unique(excluded.flatMap((entry) => entry.missing));
  return methodOnly
    ? needsValidation('invalid_inputs', { kind: 'inputs', fields: unique(excluded.flatMap((entry) => entry.reasons.flatMap((r) => r.params?.fields ?? []))), detail: { coverage } })
    : missingData(missing, { detail: { coverage } });
}

function finishState(value, parts, population, extra) {
  const { used, notApplicableEntries, excluded } = parts;
  const coverage = { population: population.length, used: used.length, notApplicable: notApplicableEntries.length, excluded };
  const proxy = used.some((entry) => entry.result.basis === 'proxy' || entry.result.state === CALC_STATE.PARTIAL);
  const methodValidation = used.some((entry) => isMethodValidation(entry.result));
  const detail = { ...(extra.detail ?? {}), coverage };
  const base = { ...extra, detail };
  if (methodValidation) return needsValidation('required_fields_not_validated', { kind: 'method', value, ...base });
  if (excluded.length || proxy) {
    const reasons = [];
    if (excluded.length) reasons.push(reason('coverage_partial', { used: used.length, total: used.length + excluded.length }));
    if (proxy) reasons.push(reason('includes_partial_projects'));
    return partial(value, reasons, { ...base, basis: used.some((e) => e.result.basis === 'proxy') ? 'proxy' : 'derived' });
  }
  return calculated(value, base);
}

/**
 * Aggregate project-level results of one KPI.
 * entries: [{ project, result, weight }] already restricted to the KPI's population.
 */
export function aggregateProjectResults(id, aggregation, population, entries, { overrides } = {}) {
  const kpi = getKpi(id);
  const parts = partition(entries);
  const { used } = parts;
  if (!used.length) return emptyOutcome(id, population, parts);
  const finish = (value, extra = {}) => finishState(value, parts, population, extra);

  switch (aggregation) {
    case AGGREGATION.POOLED_RATIO: {
      const num = sum(used.map((e) => e.result.parts.num));
      const den = sum(used.map((e) => e.result.parts.den));
      const value = ratio(num, den, 100);
      if (value === null) return notApplicable('zero_denominator', null, { detail: { coverage: { population: population.length, used: used.length, notApplicable: parts.notApplicableEntries.length, excluded: parts.excluded } } });
      return finish(value, { parts: { num, den }, detail: { markets: used.flatMap((e) => e.result.detail?.markets ?? []).length ? used.flatMap((e) => (e.result.detail?.markets ?? []).map((m) => ({ ...m, projectId: e.project.id }))) : undefined, pooled: { projects: used.length } } });
    }
    case AGGREGATION.WEIGHTED_MEAN_AE: {
      const weighted = weightedMean(used.map((e) => ({ value: e.result.parts?.value ?? e.result.value, weight: e.weight })));
      if (weighted.value === null) return missingData(['aeCurrent'], { detail: { coverage: { population: population.length, used: 0, notApplicable: parts.notApplicableEntries.length, excluded: [...parts.excluded, ...used.map((e) => ({ projectId: e.project.id, state: 'missing_data', missing: ['aeCurrent'], reasons: [] }))] } } });
      const lost = used.filter((e) => !(isNum(e.weight) && e.weight > 0)).map((e) => ({ projectId: e.project.id, state: 'missing_data', missing: ['aeCurrent'], reasons: [reason('missing_fields', { fields: ['aeCurrent'] })] }));
      const adjusted = { ...parts, used: used.filter((e) => isNum(e.weight) && e.weight > 0), excluded: [...parts.excluded, ...lost] };
      return finishState(weighted.value, adjusted, population, { detail: { weightedBy: 'aeCurrent', totalWeight: weighted.weight } });
    }
    case AGGREGATION.MEDIAN_POOLED: {
      const items = used.flatMap((e) => e.result.items ?? []);
      return finish(median(items), { items, detail: { count: items.length } });
    }
    case AGGREGATION.OLDEST_ITEM: {
      const oldest = used.reduce((best, e) => (e.result.parts.value > best.value ? { value: e.result.parts.value, projectId: e.project.id } : best), { value: -Infinity, projectId: null });
      return finish(oldest.value, { parts: { value: oldest.value }, detail: { count: sum(used.map((e) => e.result.detail?.count ?? 0)), amount: sum(used.map((e) => e.result.detail?.amount ?? 0)), oldestProjectId: oldest.projectId } });
    }
    case AGGREGATION.MEDIAN_OF_PROJECTS:
      return finish(median(used.map((e) => e.result.parts.value)), { detail: { projects: used.length } });
    case AGGREGATION.COUNT_POOLED: {
      const total = sum(used.map((e) => e.result.parts?.value ?? e.result.parts?.num ?? 0));
      const withoutSolution = sum(used.map((e) => e.result.detail?.withoutSolution ?? 0));
      const detail = id === 'PP3' ? { external: sum(used.map((e) => e.result.parts.num)), total: sum(used.map((e) => e.result.parts.den)) } : { withoutSolution };
      if (id === 'PP3') {
        const byCause = {};
        used.forEach((e) => Object.entries(e.result.detail.byCause).forEach(([cause, n]) => { byCause[cause] = (byCause[cause] ?? 0) + n; }));
        const value = ratio(detail.external, detail.total, 100);
        return finish(value, { parts: { num: detail.external, den: detail.total }, detail: { ...detail, byCause, byCausePct: Object.fromEntries(Object.entries(byCause).map(([cause, n]) => [cause, ratio(n, detail.total, 100)])) } });
      }
      return finish(total, { parts: { value: total }, detail });
    }
    case AGGREGATION.MAX_OF_UNITS: {
      const worst = used.reduce((best, e) => (e.result.parts.value > best.value ? { value: e.result.parts.value, projectId: e.project.id } : best), { value: -Infinity, projectId: null });
      return finish(worst.value, { parts: { value: worst.value }, detail: { worstProjectId: worst.projectId, markets: used.flatMap((e) => (e.result.detail?.markets ?? []).map((m) => ({ ...m, projectId: e.project.id }))) } });
    }
    case AGGREGATION.DISTRIBUTION: {
      const evaluated = used.map((e) => ({ status: e.status ?? evaluateKpi(kpi, e.result.value, { overrides, detail: e.result.detail }).status }));
      return finish(null, { detail: { distribution: statusDistribution(evaluated), projects: used.length }, valueKind: 'distribution' });
    }
    default:
      return notImplemented('aggregation_undefined');
  }
}

/** Proportion KPIs (CO3–CO5, GV3, DO3): flags per project → % with the right denominator. */
export function aggregateProportion(id, aggregation, population, entries) {
  const known = entries.filter((e) => e.flag !== null);
  const excluded = entries.filter((e) => e.flag === null).map((e) => ({ projectId: e.project.id, state: CALC_STATE.MISSING_DATA, missing: e.missing, reasons: e.reasons }));
  const coverage = { population: population.length, used: known.length, notApplicable: 0, excluded };
  if (!population.length) return notApplicable('no_projects_in_scope', null, { detail: { coverage } });
  if (!known.length) return missingData(unique(excluded.flatMap((e) => e.missing)), { detail: { coverage } });
  const weighted = known.some((e) => isNum(e.weight));
  const num = weighted ? sum(known.filter((e) => e.flag).map((e) => e.weight)) : known.filter((e) => e.flag).length;
  const den = weighted ? sum(known.map((e) => e.weight)) : known.length;
  const value = ratio(num, den, 100);
  if (value === null) return notApplicable('zero_denominator', null, { detail: { coverage } });
  const detail = { coverage, flagged: known.filter((e) => e.flag).length, classified: known.length, flaggedProjectIds: known.filter((e) => e.flag).map((e) => e.project.id), weightedBy: weighted ? 'aeCurrent' : null };
  const extra = { parts: { num, den }, detail };
  return excluded.length ? partial(value, [reason('coverage_partial', { used: known.length, total: population.length })], { ...extra, basis: 'derived' }) : calculated(value, extra);
}

export { STATUS };
