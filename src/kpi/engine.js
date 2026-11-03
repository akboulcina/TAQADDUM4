import { CALCULATORS } from './calculators.js';
import { CALCULATORS_FIELD } from './calculators.field.js';
import { CLASSIFIERS } from './classifiers.js';
import { STRATEGIC, computeCO1, computeCO2, computeCO6 } from './strategic.js';
import { aggregateProjectResults, aggregateProportion } from './aggregate.js';
import { mergeConfig } from './config.js';
import { AGGREGATION, CALC_STATE, CONFIDENCE, STATUS } from './constants.js';
import { KPI_REGISTRY, getKpi } from './registry.js';
import { evaluateKpi } from './thresholds.js';
import { isNum, isValidDate, toTime } from './primitives.js';
import { isActiveProject, validatePortfolio } from './validation.js';
import { needsValidation } from './results.js';

/*
 * The KPI engine — the ONLY place KPI values are computed.
 *
 *   calculateKpis(projects, { referenceDate, config?, overrides?, contractors? })
 *
 * is a pure function: same inputs, same output, no clock, no I/O. The role
 * dashboards, the catalogue and the tests all call it; nothing else computes a
 * KPI of the referentiel.
 *
 * Order of work (a DAG, no circularity):
 *   1. validation      ← source data only
 *   2. project KPIs    ← source data + validation (invalid fields are refused)
 *   3. portfolio KPIs  ← project results (CO4 reads DL1 / AV2; CO6 reads the rest)
 *   4. data-quality    ← DO1 (dates), DO2 (fields), DO3 (validation) summarised; they never read other KPIs
 */

const PROJECT_CALCULATORS = { ...CALCULATORS, ...CALCULATORS_FIELD };

/** What the engine knows about each KPI's shape (level, aggregation, population). Used by the catalogue filters. */
export const KPI_ENGINE_META = Object.freeze(Object.fromEntries(KPI_REGISTRY.map((kpi) => {
  const calc = PROJECT_CALCULATORS[kpi.id] ?? CLASSIFIERS[kpi.id] ?? STRATEGIC[kpi.id];
  return [kpi.id, Object.freeze({ level: calc.level, aggregation: calc.aggregation, population: calc.population ?? 'active', hasProjectValue: Boolean(PROJECT_CALCULATORS[kpi.id]) })];
})));

const toIso = (date) => (date instanceof Date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : String(date).slice(0, 10));
const hasValue = (raw) => raw.value !== null && raw.value !== undefined
  && (raw.state === CALC_STATE.CALCULATED || raw.state === CALC_STATE.PARTIAL || (raw.state === CALC_STATE.REQUIRES_VALIDATION && raw.detail?.validationKind === 'method'));

/** Data confidence: how far the value can be trusted, from how it was obtained. Never raised by thresholds. */
export function assessConfidence(raw, { qualityFlag = false } = {}) {
  if (!hasValue(raw) && raw.valueKind !== 'distribution') return CONFIDENCE.NONE;
  if (raw.state === CALC_STATE.REQUIRES_VALIDATION) return CONFIDENCE.LOW;
  const coverage = raw.detail?.coverage;
  const ratio = coverage && coverage.population - coverage.notApplicable > 0 ? coverage.used / (coverage.population - coverage.notApplicable) : 1;
  if (raw.state === CALC_STATE.PARTIAL) return raw.basis === 'proxy' || ratio < 0.5 ? CONFIDENCE.LOW : CONFIDENCE.MEDIUM;
  return raw.basis !== 'exact' || ratio < 1 || qualityFlag ? CONFIDENCE.MEDIUM : CONFIDENCE.HIGH;
}

/**
 * Readiness: how operational the indicator is, from the workbook's PHASE and the
 * real state. A V2 / Vision KPI is never « operational », even when the formula
 * runs on supplied data.
 */
export function assessReadiness(kpi, raw) {
  if (raw.state === CALC_STATE.NOT_IMPLEMENTED) return 'not_implemented';
  const value = hasValue(raw) || raw.valueKind === 'distribution';
  if (kpi.phase === 'V2') return value ? 'v2_preview' : 'v2_pending';
  if (kpi.phase === 'Vision') return value ? 'vision_preview' : 'vision_pending';
  if (raw.state === CALC_STATE.CALCULATED || (raw.valueKind === 'distribution' && raw.state === CALC_STATE.CALCULATED)) return 'operational';
  if (raw.state === CALC_STATE.PARTIAL) return 'limited';
  if (raw.state === CALC_STATE.REQUIRES_VALIDATION) return 'to_validate';
  return 'unavailable';
}

function finalize(kpi, raw, { scope, subjectId, overrides, ref, qualityFlag = false, aggregation = null, dataAsOf = null }) {
  let evaluation;
  if (raw.valueKind === 'distribution') evaluation = { status: STATUS.INFORMATIONAL, basis: 'distribution', thresholds: null };
  else if (!hasValue(raw)) evaluation = { status: STATUS.NOT_EVALUABLE, basis: null, thresholds: null };
  else if (scope === 'portfolio' && aggregation === AGGREGATION.WEIGHTED_MEAN_AE && kpi.direction !== 'information') {
    // A weighted mean of project values is shown, but the project thresholds are not applied to it.
    evaluation = { status: STATUS.INFORMATIONAL, basis: 'distribution', thresholds: null };
  } else evaluation = evaluateKpi(kpi, raw.value, { overrides, detail: raw.detail });
  return {
    id: kpi.id, scope, subjectId,
    state: raw.state, value: raw.value ?? null, valueKind: raw.valueKind ?? 'scalar', unit: kpi.unit,
    status: evaluation.status, statusBasis: evaluation.basis, thresholds: evaluation.thresholds,
    confidence: assessConfidence(raw, { qualityFlag }),
    readiness: assessReadiness(kpi, raw),
    basis: raw.basis, reasons: raw.reasons, missing: raw.missing ?? [],
    owner: raw.missing?.length || raw.state === CALC_STATE.MISSING_DATA ? { dataOwner: kpi.dataOwner, kpiOwner: kpi.kpiOwner } : null,
    parts: raw.parts, detail: raw.detail, items: raw.items, flag: raw.flag,
    phase: kpi.phase, importance: kpi.importance,
    asOf: ref, dataAsOf
  };
}

const latestDate = (dates) => dates.filter(isValidDate).sort((a, b) => toTime(b) - toTime(a))[0] ?? null;

export function calculateKpis(projects, { referenceDate, config: configOverrides, overrides = {}, contractors = null } = {}) {
  if (!isValidDate(referenceDate instanceof Date ? toIso(referenceDate) : referenceDate)) throw new Error('calculateKpis requires a valid referenceDate');
  const ref = toIso(referenceDate);
  const config = mergeConfig(configOverrides);
  const validation = validatePortfolio(projects, ref, { requiredFields: config.requiredFields });

  /* 2 — project level */
  const projectEntries = projects.map((project, index) => {
    const report = validation.reports[index];
    const ctx = { p: project, ref, invalid: report.invalidFields, config, validation: report, kpis: {} };
    const raws = {};
    Object.entries(PROJECT_CALCULATORS).forEach(([id, calc]) => { raws[id] = calc.project(ctx); });
    // DO1 first: it only reads dates, and feeds the confidence of every other KPI of the project.
    const stale = raws.DO1.state === CALC_STATE.CALCULATED && isNum(raws.DO1.value) && raws.DO1.value > getKpi('DO1').redThreshold;
    const qualityFlag = report.inconsistent || stale;
    const kpis = {};
    Object.entries(raws).forEach(([id, raw]) => {
      kpis[id] = finalize(getKpi(id), raw, { scope: 'project', subjectId: project.id, overrides, ref, qualityFlag: id.startsWith('DO') ? false : qualityFlag, aggregation: PROJECT_CALCULATORS[id].aggregation, dataAsOf: project.lastUpdateDate ?? null });
    });
    ctx.kpis = kpis;
    return { project, id: project.id, name: project.name, ctx, kpis, validation: report, active: isActiveProject(project), weight: isNum(project.aeCurrent) ? project.aeCurrent : null, qualityFlag };
  });

  /* 3 — portfolio level */
  const portfolio = {};
  const populationOf = (population) => projectEntries.filter((entry) => population === 'all' || entry.active);
  const portfolioQualityFlag = () => portfolio.DO3?.status === STATUS.RED;
  const dataAsOfOf = (entries) => latestDate(entries.map((entry) => entry.project.lastUpdateDate));

  // DO1–DO3 first: they only read dates, fields and validation, so the others may consult them.
  const order = ['DO1', 'DO2', 'DO3', ...KPI_REGISTRY.map((kpi) => kpi.id).filter((id) => !['DO1', 'DO2', 'DO3', 'CO1', 'CO6'].includes(id)), 'CO1', 'CO6'];
  order.forEach((id) => {
    const kpi = getKpi(id);
    const meta = KPI_ENGINE_META[id];
    const population = populationOf(meta.population);
    let raw;
    if (PROJECT_CALCULATORS[id]) {
      const entries = population.map((entry) => ({ project: entry.project, result: entry.kpis[id], status: entry.kpis[id].status, weight: entry.weight }));
      raw = aggregateProjectResults(id, meta.aggregation, population, entries, { overrides });
      // Re-use the project-level raw shape expected by `finalize`.
      if (meta.aggregation === AGGREGATION.DISTRIBUTION && raw.state !== CALC_STATE.NOT_APPLICABLE && raw.state !== CALC_STATE.MISSING_DATA) raw.valueKind = 'distribution';
    } else if (CLASSIFIERS[id]) {
      const classifier = CLASSIFIERS[id];
      const entries = population.map((entry) => ({ project: entry.project, ...classifier.classify({ ...entry.ctx, kpis: entry.kpis }) }));
      raw = aggregateProportion(id, classifier.aggregation, population, entries);
    } else {
      const items = projectEntries.map((entry) => ({ project: entry.project, kpis: entry.kpis, weight: entry.weight }));
      const context = { items, config, ref, overrides, portfolio, contractors };
      raw = id === 'CO1' ? computeCO1(context) : id === 'CO2' ? computeCO2(context) : computeCO6(context);
    }
    portfolio[id] = finalize(kpi, raw, { scope: 'portfolio', subjectId: null, overrides, ref, qualityFlag: id.startsWith('DO') ? false : portfolioQualityFlag(), aggregation: meta.aggregation, dataAsOf: dataAsOfOf(population) });
  });

  const ordered = Object.fromEntries(KPI_REGISTRY.map((kpi) => [kpi.id, portfolio[kpi.id]]));
  const counts = (pick) => Object.fromEntries([...new Set(Object.values(ordered).map(pick))].map((key) => [key, Object.values(ordered).filter((r) => pick(r) === key).length]));

  return {
    referenceDate: ref,
    config,
    overrides,
    population: { total: projectEntries.length, active: projectEntries.filter((entry) => entry.active).length },
    validation,
    projects: projectEntries.map(({ ctx, project, ...rest }) => ({ ...rest, project })),
    portfolio: ordered,
    dataQuality: { DO1: ordered.DO1, DO2: ordered.DO2, DO3: ordered.DO3, issues: validation.issues, counts: validation.counts },
    summary: { byState: counts((r) => r.state), byReadiness: counts((r) => r.readiness), byStatus: counts((r) => r.status) }
  };
}

export { needsValidation };
