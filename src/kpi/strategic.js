import { calculated, missingData, needsValidation, notApplicable, notImplemented, partial, reason } from './results.js';
import { isNum, ratio, sum, weightedMean } from './primitives.js';
import { evaluateKpi } from './thresholds.js';
import { CALC_STATE, AGGREGATION, LEVEL } from './constants.js';
import { isActiveProject } from './validation.js';

/*
 * Contractor-level and strategic KPIs: CO1, CO2, CO6.
 *
 * CO2 is fully defined by the workbook (share of the AE in progress held by one
 * contractor) and computed as written.
 *
 * CO1 and CO6 are synthetic 0–100 scores. The workbook gives provisional WEIGHTS
 * but not how each component becomes a 0–100 sub-score (« inverse de BU1 »,
 * « historique de résiliations », the delay / finance / blocker groups). Inventing
 * those conversions would publish a made-up strategic score, so:
 *
 *   – by default the KPIs are « not_implemented » and say what is missing;
 *   – the formulas are implemented and tested: once the team supplies the
 *     normalisation functions in the engine config, the score is computed;
 *   – even then the result is « requires_validation » (method) until
 *     config.coX.validated is set — never published as a definitive score.
 */

export const STRATEGIC = {
  CO1: { level: LEVEL.CONTRACTOR, aggregation: AGGREGATION.NOT_AGGREGATED },
  CO2: { level: LEVEL.CONTRACTOR, aggregation: AGGREGATION.MAX_OF_UNITS },
  CO6: { level: LEVEL.PORTFOLIO, aggregation: AGGREGATION.NOT_AGGREGATED }
};

const marketAmount = (market) => market.initialAmount + sum((market.amendments ?? []).filter((a) => a.notifiedDate && isNum(a.amount)).map((a) => a.amount));

/** Contractor → { projects: Set, markets: [{project, market}] } over the active projects. */
function contractorIndex(items) {
  const index = new Map();
  items.filter((item) => isActiveProject(item.project)).forEach((item) => {
    (Array.isArray(item.project.markets) ? item.project.markets : []).forEach((market) => {
      if (!market.contractorId) return;
      const entry = index.get(market.contractorId) ?? { id: market.contractorId, items: new Map(), markets: [] };
      entry.items.set(item.project.id, item);
      entry.markets.push({ project: item.project, market });
      index.set(market.contractorId, entry);
    });
  });
  return index;
}

export function computeCO2(ctx) {
  const active = ctx.items.filter((item) => isActiveProject(item.project));
  const eligible = [];
  const excluded = [];
  active.forEach(({ project }) => {
    if (!Array.isArray(project.markets) || !project.markets.length) { excluded.push({ projectId: project.id, state: CALC_STATE.MISSING_DATA, missing: ['markets'], reasons: [] }); return; }
    const bad = project.markets.filter((market) => !market.contractorId || !isNum(market.initialAmount));
    if (bad.length) { excluded.push({ projectId: project.id, state: CALC_STATE.MISSING_DATA, missing: ['contractorId'], reasons: [] }); return; }
    project.markets.forEach((market) => eligible.push({ projectId: project.id, contractorId: market.contractorId, amount: marketAmount(market) }));
  });
  const coverage = { population: active.length, used: active.length - excluded.length, notApplicable: 0, excluded };
  if (!eligible.length) return active.length ? missingData(['markets', 'contractorId'], { detail: { coverage } }) : notApplicable('no_projects_in_scope', null, { detail: { coverage } });
  const total = sum(eligible.map((row) => row.amount));
  const byContractor = new Map();
  eligible.forEach((row) => byContractor.set(row.contractorId, (byContractor.get(row.contractorId) ?? 0) + row.amount));
  const contractors = [...byContractor.entries()]
    .map(([id, amount]) => { const share = ratio(amount, total, 100); return { id, amount, share, status: evaluateKpi('CO2', share, { overrides: ctx.overrides }).status }; })
    .sort((a, b) => b.share - a.share);
  // « Partiel (groupements à modéliser) »: a market is attributed to the contractor named on it; joint ventures are not split.
  return partial(contractors[0].share, [reason('groupements_not_modeled')], {
    basis: 'derived', parts: { value: contractors[0].share }, detail: { contractors, topContractorId: contractors[0].id, coverage, total }
  });
}

/** Per-contractor CO1 inputs derived from project-level results. */
function contractorComponents(entry, items) {
  const projects = [...entry.items.values()];
  const meanOf = (id) => weightedMean(projects.map((item) => ({ value: item.kpis[id]?.parts?.value ?? item.kpis[id]?.value, weight: item.weight })).filter((row) => isNum(row.value)));
  const av2 = meanOf('AV2');
  const pp2 = meanOf('PP2');
  const initial = sum(entry.markets.map(({ market }) => market.initialAmount).filter(isNum));
  const amended = sum(entry.markets.flatMap(({ market }) => (market.amendments ?? []).filter((a) => a.notifiedDate && isNum(a.amount)).map((a) => a.amount)));
  return { av2: av2.value, pp2: pp2.value, bu1: ratio(amended, initial, 100), weight: sum(projects.map((item) => item.weight).filter(isNum)) };
}

export function computeCO1(ctx) {
  const { weights, normalizers, validated } = ctx.config.co1;
  const missingNormalizers = Object.entries(normalizers).filter(([, fn]) => typeof fn !== 'function').map(([key]) => key);
  if (missingNormalizers.length) {
    return notImplemented('normalization_undefined', { detail: { weights, missingNormalizers } });
  }
  const index = contractorIndex(ctx.items);
  if (!index.size) return missingData(['markets', 'contractorId']);
  const scores = [];
  index.forEach((entry) => {
    const c = contractorComponents(entry, ctx.items);
    if (c.av2 === null || c.bu1 === null) return;
    const parts = {
      av2: Math.min(c.av2, 1) * 100, // « AV2 (plafonné à 1) » — the only capped ratio, by the workbook's own rule
      bu1Inverse: normalizers.bu1Inverse(c.bu1),
      pp2: c.pp2,
      terminationHistory: normalizers.terminationHistory(ctx.contractors?.[entry.id] ?? null)
    };
    const active = Object.keys(weights).filter((key) => isNum(parts[key]));
    if (!active.includes('av2') || !active.includes('bu1Inverse') || !active.includes('terminationHistory')) return;
    // « si PP2 absent, ses 20 % sont redistribués »: proportionally over the remaining components.
    const totalWeight = sum(active.map((key) => weights[key]));
    const score = sum(active.map((key) => (weights[key] / totalWeight) * parts[key]));
    scores.push({ id: entry.id, score, weight: c.weight, ppRedistributed: !active.includes('pp2'), parts });
  });
  if (!scores.length) return missingData(['contractorHistory', 'markets'], { detail: { weights } });
  const mean = weightedMean(scores.map((row) => ({ value: row.score, weight: row.weight })));
  const value = mean.value ?? sum(scores.map((row) => row.score)) / scores.length;
  const extra = { parts: { value }, detail: { contractors: scores, weights, weightedBy: 'ae' } };
  return validated ? calculated(value, extra) : needsValidation('weights_not_validated', { kind: 'method', value, ...extra });
}

export function computeCO6(ctx) {
  const { weights, normalizers, validated } = ctx.config.co6;
  const missingNormalizers = Object.entries(normalizers).filter(([, fn]) => typeof fn !== 'function').map(([key]) => key);
  if (missingNormalizers.length) return notImplemented('normalization_undefined', { detail: { weights, missingNormalizers } });
  const parts = {};
  const unavailable = [];
  Object.keys(weights).forEach((key) => {
    const part = normalizers[key](ctx.portfolio);
    if (isNum(part)) parts[key] = part; else unavailable.push(key);
  });
  if (unavailable.length) return missingData(unavailable, { reasons: [reason('component_unavailable', { components: unavailable })], detail: { weights } });
  const value = sum(Object.keys(weights).map((key) => weights[key] * parts[key]));
  const extra = { parts: { value }, detail: { components: parts, weights, weightedBy: 'ae' } };
  return validated ? calculated(value, extra) : needsValidation('weights_not_validated', { kind: 'method', value, ...extra });
}
