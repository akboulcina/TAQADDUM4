import { calculated, gate, missingData, needsValidation, notApplicable, partial, reason } from './results.js';
import { addDays, addMonths, daysBetween, DAYS_PER_MONTH, isNum, isPresent, isValidDate, median, mergedDays, ratio, sum, toTime } from './primitives.js';
import { isPopulated, updateAgeDays } from './validation.js';
import { AGGREGATION, LEVEL } from './constants.js';

/*
 * Project-level formulas of the 43 KPIs (one function per KPI, taken from the
 * « Formule » column of 01_KPI). Each calculator receives a context
 *
 *   ctx = { p, ref, invalid, config }
 *     p        the project's source record (see sourceSchema.js)
 *     ref      reference date (ISO) — « date de référence »
 *     invalid  Set of fields that validation.js flagged as impossible
 *     config   engine parameters (config.js)
 *
 * and returns a result from results.js. No calculator caps a ratio, substitutes
 * a mean for a median, or turns missing data into 0.
 *
 * KPIs that only exist at portfolio / contractor level (CO1–CO6, DO3, GV3) are in
 * aggregate.js; their per-project part is a `classify` function declared there.
 *
 * Each entry also declares how it is aggregated to the portfolio (`aggregation`)
 * and which projects form the population (`population`: 'active' | 'all').
 */

const pct = (num, den) => ratio(num, den, 100);
const notStarted = () => notApplicable('not_started');

/** Open / closed helpers shared by blockers, NC, reevaluations… */
const isOpen = (item, closedKey) => !isPresent(item?.[closedKey]);

/* ── DL1 shared with AV2 ─────────────────────────────────────────────────── */
function consumedDelay(ctx) {
  const blocked = gate(ctx, ['startOrderDate', 'currentDurationDays']);
  if (blocked) return blocked;
  const elapsed = daysBetween(ctx.p.startOrderDate, ctx.ref);
  if (elapsed === null) return needsValidation('invalid_inputs', { fields: ['startOrderDate'] });
  if (elapsed < 0) return notStarted();
  // Never capped at 100 % (00_Lecture, « Deux délais »).
  return calculated((elapsed / ctx.p.currentDurationDays) * 100, { detail: { elapsedDays: elapsed, currentDurationDays: ctx.p.currentDurationDays } });
}

/* ── Recent pace (AV3, DL4) ──────────────────────────────────────────────── */
function recentPace(ctx) {
  const blocked = gate(ctx, ['tap', 'progressHistory']);
  if (blocked) return blocked;
  const cutoff = addDays(ctx.ref, -ctx.config.av3WindowDays);
  const baseline = ctx.p.progressHistory
    .filter((entry) => isValidDate(entry?.date) && isNum(entry.tap) && toTime(entry.date) <= toTime(cutoff))
    .sort((a, b) => toTime(b.date) - toTime(a.date))[0];
  if (!baseline) return missingData(['progressHistory'], { reasons: [reason('insufficient_history', { days: ctx.config.av3WindowDays })] });
  const windowDays = daysBetween(baseline.date, ctx.ref);
  const gain = ctx.p.tap - baseline.tap;
  if (gain < 0) return needsValidation('progress_decreased', { fields: ['progressHistory'], params: { from: baseline.tap, to: ctx.p.tap } });
  return calculated(gain, { detail: { windowDays, gain, baselineDate: baseline.date } });
}

/* ── Markets / amendments ────────────────────────────────────────────────── */
const notified = (amendment) => isPresent(amendment?.notifiedDate);

function marketsOf(ctx) {
  const blocked = gate(ctx, ['markets']);
  if (blocked) return { blocked };
  if (!ctx.p.markets.length) return { blocked: missingData(['markets']) };
  const incomplete = ctx.p.markets.filter((market) => !Array.isArray(market.amendments));
  if (incomplete.length) return { blocked: missingData(['amendments'], { detail: { markets: incomplete.map((market) => market.id) } }) };
  if (ctx.p.markets.some((market) => !isNum(market.initialAmount) || market.initialAmount <= 0)) return { blocked: needsValidation('invalid_inputs', { fields: ['markets'] }) };
  if (ctx.p.markets.some((market) => market.amendments.some((amendment) => !isNum(amendment.amount)))) return { blocked: missingData(['amendments']) };
  return { markets: ctx.p.markets };
}

/* ═════════════════════════════════════════════════════════════════════════
 * Calculators
 * ═════════════════════════════════════════════════════════════════════════ */
export const CALCULATORS = {
  /* ── AV — Avancement physique ───────────────────────────────────────── */
  AV1: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.WEIGHTED_MEAN_AE, population: 'active',
    project(ctx) {
      const { p } = ctx;
      if (isPopulated(p, 'worksRealizedValue') && isPopulated(p, 'totalEstimatedCost')) {
        const blocked = gate(ctx, ['worksRealizedValue', 'totalEstimatedCost']);
        if (blocked) return blocked;
        if (p.totalEstimatedCost === 0) return notApplicable('zero_denominator', { field: 'totalEstimatedCost' });
        const value = pct(p.worksRealizedValue, p.totalEstimatedCost);
        if (value > 100) return needsValidation('percentage_above_100', { fields: ['worksRealizedValue'] });
        return calculated(value, { parts: { value } });
      }
      const blocked = gate(ctx, ['tap']);
      if (blocked) return blocked.state === 'missing_data' ? missingData(['worksRealizedValue', 'totalEstimatedCost']) : blocked;
      // The workbook defines TAP consolidé as the valued progress of all markets; used here as a stand-in.
      return partial(p.tap, [reason('proxy_tap')], { basis: 'proxy', missing: ['worksRealizedValue', 'totalEstimatedCost'], parts: { value: p.tap } });
    }
  },

  AV2: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.WEIGHTED_MEAN_AE, population: 'active',
    project(ctx) {
      const blocked = gate(ctx, ['tap']);
      const delay = consumedDelay(ctx);
      if (blocked && delay.value === null) return { ...delay, missing: [...new Set([...(blocked.missing ?? []), ...(delay.missing ?? [])])], reasons: delay.reasons.length ? delay.reasons : blocked.reasons };
      if (blocked) return blocked;
      if (delay.value === null) return delay;
      if (delay.value === 0) return notApplicable('delay_not_consumed');
      // TAP consolidé ÷ % du délai en vigueur consommé — both in %, so the ratio is unit-free and uncapped.
      const value = ctx.p.tap / delay.value;
      return calculated(value, { parts: { value }, detail: { tap: ctx.p.tap, delayConsumedPct: delay.value } });
    }
  },

  AV3: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.DISTRIBUTION, population: 'active',
    project(ctx) {
      const pace = recentPace(ctx);
      if (pace.value === null) return pace;
      const blocked = gate(ctx, ['contractualEndDate']);
      if (blocked) return blocked;
      const remainingDays = daysBetween(ctx.ref, ctx.p.contractualEndDate);
      if (ctx.p.tap >= 100) return notApplicable('already_complete');
      if (remainingDays <= 0) return notApplicable('deadline_passed');
      // ΔTAP of the window ÷ ΔTAP required over the same window to finish within the delay in force.
      const required = ((100 - ctx.p.tap) * pace.detail.windowDays) / remainingDays;
      return calculated(pace.value / required, { detail: { gain: pace.value, required, windowDays: pace.detail.windowDays } });
    }
  },

  AV4: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.POOLED_RATIO, population: 'active',
    project(ctx) {
      const blocked = gate(ctx, ['remainingCost', 'remainingCostWithoutMarket']);
      if (blocked) return blocked;
      if (ctx.p.remainingCost === 0) return notApplicable('nothing_remaining');
      return calculated(pct(ctx.p.remainingCostWithoutMarket, ctx.p.remainingCost), { parts: { num: ctx.p.remainingCostWithoutMarket, den: ctx.p.remainingCost } });
    }
  },

  AV5: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.POOLED_RATIO, population: 'all',
    project(ctx) {
      const blocked = gate(ctx, ['commissionedStructures', 'commissionedFullyFunctional']);
      if (blocked) return blocked;
      if (ctx.p.commissionedStructures === 0) return notApplicable('nothing_commissioned');
      return calculated(pct(ctx.p.commissionedFullyFunctional, ctx.p.commissionedStructures), { parts: { num: ctx.p.commissionedFullyFunctional, den: ctx.p.commissionedStructures } });
    }
  },

  /* ── FI — Finance ───────────────────────────────────────────────────── */
  FI1: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.WEIGHTED_MEAN_AE, population: 'active',
    project(ctx) {
      const { p } = ctx;
      const blockedTap = gate(ctx, ['tap']);
      if (blockedTap) return blockedTap;
      let financial = null;
      if (isPopulated(p, 'financialRateExAdvances')) {
        const blocked = gate(ctx, ['financialRateExAdvances']);
        if (blocked) return blocked;
        financial = p.financialRateExAdvances;
      } else if (isPopulated(p, 'worksPaidExAdvances') && isPopulated(p, 'worksContractAmount')) {
        const blocked = gate(ctx, ['worksPaidExAdvances', 'worksContractAmount']);
        if (blocked) return blocked;
        if (p.worksContractAmount === 0) return notApplicable('zero_denominator', { field: 'worksContractAmount' });
        financial = pct(p.worksPaidExAdvances, p.worksContractAmount);
      }
      if (financial !== null) {
        const value = p.tap - financial; // TAP − taux financier travaux hors avances, in points
        return calculated(value, { parts: { value }, detail: { tap: p.tap, financialRate: financial } });
      }
      // Stand-in: total payments ÷ AE actuelle. It includes advances and uses the AE, not the works amount.
      const blocked = gate(ctx, ['paymentsTotal', 'aeCurrent']);
      if (blocked) return missingData(['financialRateExAdvances'], { reasons: [reason('missing_fields', { fields: ['financialRateExAdvances'] })] });
      if (p.aeCurrent === 0) return notApplicable('zero_denominator', { field: 'aeCurrent' });
      const proxyRate = pct(p.paymentsTotal, p.aeCurrent);
      const value = p.tap - proxyRate;
      return partial(value, [reason('proxy_payments_over_ae')], { basis: 'proxy', missing: ['financialRateExAdvances'], parts: { value }, detail: { tap: p.tap, financialRate: proxyRate } });
    }
  },

  FI2: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.POOLED_RATIO, population: 'active',
    project(ctx) {
      const blocked = gate(ctx, ['aeCurrent', 'paymentsTotal', 'remainingToDoEstimate']);
      if (blocked) return blocked;
      if (ctx.p.remainingToDoEstimate === 0) return notApplicable('nothing_remaining');
      const num = ctx.p.aeCurrent - ctx.p.paymentsTotal;
      return calculated(pct(num, ctx.p.remainingToDoEstimate), { parts: { num, den: ctx.p.remainingToDoEstimate } });
    }
  },

  FI3: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.POOLED_RATIO, population: 'active',
    project(ctx) {
      const blocked = gate(ctx, ['paymentCreditsRegistered', 'plannedPaymentsFiscalYear']);
      if (blocked) return blocked;
      if (ctx.p.plannedPaymentsFiscalYear === 0) return notApplicable('zero_denominator', { field: 'plannedPaymentsFiscalYear' });
      return calculated(pct(ctx.p.paymentCreditsRegistered, ctx.p.plannedPaymentsFiscalYear), { parts: { num: ctx.p.paymentCreditsRegistered, den: ctx.p.plannedPaymentsFiscalYear } });
    }
  },

  FI4: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.POOLED_RATIO, population: 'active',
    project(ctx) {
      const blocked = gate(ctx, ['aeCurrent', 'aeInitial']);
      if (blocked) return blocked;
      const adjustmentKnown = isPopulated(ctx.p, 'aeInitialAdjustment');
      const adjustment = adjustmentKnown ? ctx.p.aeInitialAdjustment : 0;
      const base = ctx.p.aeInitial + adjustment; // AE initiale ajustée des transferts de MO / de périmètre
      if (!(base > 0)) return needsValidation('invalid_inputs', { fields: ['aeInitial'] });
      const num = ctx.p.aeCurrent - base;
      const extra = { parts: { num, den: base }, detail: { aeCurrent: ctx.p.aeCurrent, aeInitialAdjusted: base } };
      const value = pct(num, base);
      return adjustmentKnown ? calculated(value, extra) : partial(value, [reason('adjustment_not_provided')], { ...extra, basis: 'derived', missing: ['aeInitialAdjustment'] });
    }
  },

  FI5: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.OLDEST_ITEM, population: 'active',
    project(ctx) {
      const blocked = gate(ctx, ['reevaluations']);
      if (blocked) return blocked;
      const pending = ctx.p.reevaluations.filter((item) => isOpen(item, 'approvedDate'));
      if (!pending.length) return notApplicable('nothing_pending', null, { detail: { count: 0, amount: 0 } });
      if (pending.some((item) => !isValidDate(item.requestDate))) return needsValidation('invalid_inputs', { fields: ['reevaluations'] });
      const oldest = pending.map((item) => daysBetween(item.requestDate, ctx.ref)).reduce((a, b) => Math.max(a, b));
      const amount = sum(pending.filter((item) => isNum(item.amount)).map((item) => item.amount));
      return calculated(oldest, { parts: { value: oldest }, detail: { count: pending.length, amount, amountComplete: pending.every((item) => isNum(item.amount)) } });
    }
  },

  FI6: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.MEDIAN_POOLED, population: 'active',
    project(ctx) {
      const blocked = gate(ctx, ['invoices']);
      if (blocked) return blocked;
      const unpaid = ctx.p.invoices.filter((item) => isOpen(item, 'paidDate'));
      if (!unpaid.length) return notApplicable('nothing_pending', null, { detail: { count: 0 } });
      if (unpaid.some((item) => !isValidDate(item.receivedDate))) return needsValidation('invalid_inputs', { fields: ['invoices'] });
      const ages = unpaid.map((item) => daysBetween(item.receivedDate, ctx.ref));
      return calculated(median(ages), { items: ages, detail: { count: unpaid.length } }); // MEDIAN, not mean
    }
  },

  FI7: {
    level: LEVEL.MARKET, aggregation: AGGREGATION.POOLED_RATIO, population: 'active',
    project(ctx) {
      const blocked = gate(ctx, ['invoices']);
      if (blocked) return blocked;
      const { markets, blocked: marketBlock } = marketsOf(ctx);
      if (marketBlock) return marketBlock;
      const unpaid = ctx.p.invoices.filter((item) => isOpen(item, 'paidDate'));
      if (unpaid.some((item) => !isNum(item.amount))) return missingData(['invoices']);
      const amountOf = (market) => market.initialAmount + sum(market.amendments.filter(notified).map((amendment) => amendment.amount)); // montant du marché en vigueur
      const rows = markets.map((market) => {
        const num = sum(unpaid.filter((item) => item.marketId === market.id).map((item) => item.amount));
        return { id: market.id, num, den: amountOf(market), value: pct(num, amountOf(market)) };
      });
      const unassigned = unpaid.filter((item) => !markets.some((market) => market.id === item.marketId));
      if (unassigned.length) return needsValidation('invoice_without_market', { fields: ['invoices'], params: { count: unassigned.length } });
      const num = sum(rows.map((row) => row.num));
      const den = sum(rows.map((row) => row.den));
      return calculated(pct(num, den), { parts: { num, den }, detail: { markets: rows } });
    }
  },

  /* ── DL — Délais ────────────────────────────────────────────────────── */
  DL1: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.DISTRIBUTION, population: 'active',
    project(ctx) {
      const result = consumedDelay(ctx);
      return result.value === null ? result : { ...result, parts: { value: result.value } };
    }
  },

  DL2: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.DISTRIBUTION, population: 'active',
    project(ctx) {
      const blocked = gate(ctx, ['initialDurationDays', 'currentDurationDays']);
      if (blocked) return blocked;
      const value = ctx.p.currentDurationDays / ctx.p.initialDurationDays; // Délai en vigueur ÷ délai initial
      return calculated(value, { parts: { value } });
    }
  },

  DL3: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.MEDIAN_OF_PROJECTS, population: 'active',
    project(ctx) {
      const { p } = ctx;
      if (['completed', 'received'].includes(p.status)) return notApplicable('project_completed');
      let end = p.contractualEndDate;
      let derived = false;
      if (!isPopulated(p, 'contractualEndDate')) {
        if (!isPopulated(p, 'startOrderDate') || !isPopulated(p, 'currentDurationDays')) return missingData(['contractualEndDate']);
        end = addDays(p.startOrderDate, p.currentDurationDays);
        derived = true;
      }
      if (!isValidDate(end) || ctx.invalid.has('contractualEndDate') || ctx.invalid.has('startOrderDate')) return needsValidation('invalid_inputs', { fields: ['contractualEndDate'] });
      // max(0 ; date de référence − date de fin contractuelle en vigueur): zero when not overdue.
      const value = Math.max(0, daysBetween(end, ctx.ref));
      return calculated(value, { parts: { value }, basis: derived ? 'derived' : 'exact', detail: { contractualEndDate: end, derived } });
    }
  },

  DL4: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.DISTRIBUTION, population: 'active',
    project(ctx) {
      if (['completed', 'received'].includes(ctx.p.status)) return notApplicable('project_completed');
      const pace = recentPace(ctx);
      if (pace.value === null) return pace;
      const blocked = gate(ctx, ['contractualEndDate']);
      if (blocked) return blocked;
      const rate = pace.value / pace.detail.windowDays; // TAP points per day
      if (!(rate > 0)) return notApplicable('no_recent_progress');
      const remainingDays = (100 - ctx.p.tap) / rate;
      const forecast = addDays(ctx.ref, Math.ceil(remainingDays));
      const months = daysBetween(ctx.p.contractualEndDate, forecast) / DAYS_PER_MONTH;
      // The formula is implemented as written; the "(contraintes incluses)" of the definition needs blocker data the formula does not use.
      return partial(months, [reason('constraints_not_modelled')], { basis: 'derived', detail: { forecastDate: forecast, ratePerDay: rate } });
    }
  },

  /* ── BU — Coût et avenants ──────────────────────────────────────────── */
  BU1: {
    level: LEVEL.MARKET, aggregation: AGGREGATION.POOLED_RATIO, population: 'active',
    project(ctx) {
      const { markets, blocked } = marketsOf(ctx);
      if (blocked) return blocked;
      const rows = markets.map((market) => {
        const num = sum(market.amendments.filter(notified).map((amendment) => amendment.amount));
        return { id: market.id, num, den: market.initialAmount, value: pct(num, market.initialAmount) };
      });
      const num = sum(rows.map((row) => row.num));
      const den = sum(rows.map((row) => row.den));
      return calculated(pct(num, den), { parts: { num, den }, detail: { markets: rows } });
    }
  },

  BU2: {
    level: LEVEL.MARKET, aggregation: AGGREGATION.MAX_OF_UNITS, population: 'active',
    project(ctx) {
      const { markets, blocked } = marketsOf(ctx);
      if (blocked) return blocked;
      const rows = markets.map((market) => ({ id: market.id, value: market.amendments.filter(notified).length }));
      const value = Math.max(...rows.map((row) => row.value));
      return calculated(value, { parts: { value }, detail: { markets: rows, total: sum(rows.map((row) => row.value)) } });
    }
  },

  BU3: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.POOLED_RATIO, population: 'active',
    project(ctx) {
      const blocked = gate(ctx, ['committed', 'remainingToDoEstimate', 'aeCurrent']);
      if (blocked) return blocked;
      if (ctx.p.aeCurrent === 0) return notApplicable('zero_denominator', { field: 'aeCurrent' });
      const num = ctx.p.committed + ctx.p.remainingToDoEstimate;
      return calculated(pct(num, ctx.p.aeCurrent), { parts: { num, den: ctx.p.aeCurrent } });
    }
  },

  /* ── QR — Blocages, qualité, risques ────────────────────────────────── */
  QR1: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.POOLED_RATIO, population: 'active',
    project(ctx) {
      const blocked = gate(ctx, ['rightOfWayReleased', 'rightOfWayRequired']);
      if (blocked) return blocked;
      if (ctx.p.rightOfWayRequired === 0) return notApplicable('nothing_required');
      return calculated(pct(ctx.p.rightOfWayReleased, ctx.p.rightOfWayRequired), { parts: { num: ctx.p.rightOfWayReleased, den: ctx.p.rightOfWayRequired } });
    }
  },

  QR2: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.POOLED_RATIO, population: 'active',
    project(ctx) {
      const blocked = gate(ctx, ['networkInterferencesTreated', 'networkInterferencesIdentified']);
      if (blocked) return blocked;
      if (ctx.p.networkInterferencesIdentified === 0) return notApplicable('nothing_identified');
      return calculated(pct(ctx.p.networkInterferencesTreated, ctx.p.networkInterferencesIdentified), { parts: { num: ctx.p.networkInterferencesTreated, den: ctx.p.networkInterferencesIdentified } });
    }
  },

  QR3: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.MEDIAN_POOLED, population: 'active',
    project(ctx) {
      const blocked = gate(ctx, ['blockers']);
      if (blocked) return blocked;
      const open = ctx.p.blockers.filter((item) => isOpen(item, 'closedDate'));
      if (!open.length) return notApplicable('no_open_blocker', null, { detail: { count: 0 } });
      if (open.some((item) => !isValidDate(item.openedDate))) return needsValidation('invalid_inputs', { fields: ['blockers'] });
      const ages = open.map((item) => daysBetween(item.openedDate, ctx.ref));
      return calculated(median(ages), { items: ages, detail: { count: open.length } }); // MEDIAN age, count shown beside it
    }
  },

  QR4: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.POOLED_RATIO, population: 'active',
    project(ctx) {
      const blocked = gate(ctx, ['stoppages', 'startOrderDate']);
      if (blocked) return blocked;
      const elapsed = daysBetween(ctx.p.startOrderDate, ctx.ref);
      if (elapsed === null || elapsed <= 0) return notStarted();
      const stopped = mergedDays(ctx.p.stoppages, ctx.p.startOrderDate, ctx.ref); // overlaps counted once
      return calculated(pct(stopped, elapsed), { parts: { num: stopped, den: elapsed }, detail: { stoppedDays: stopped, elapsedDays: elapsed } });
    }
  },

  QR5: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.COUNT_POOLED, population: 'active',
    project(ctx) {
      const blocked = gate(ctx, ['hazards']);
      if (blocked) return blocked;
      const open = ctx.p.hazards.filter((item) => item.open !== false && !isPresent(item.closedDate));
      const withoutSolution = open.filter((item) => item.solutionDecided !== true).length;
      return calculated(open.length, { parts: { value: open.length }, detail: { withoutSolution, withSolution: open.length - withoutSolution } });
    }
  },

  QR6: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.DISTRIBUTION, population: 'active',
    project(ctx) {
      const blocked = gate(ctx, ['consistencyModificationInProgress']);
      if (blocked) return blocked;
      return calculated(Boolean(ctx.p.consistencyModificationInProgress), { flag: Boolean(ctx.p.consistencyModificationInProgress) });
    }
  },

  QR7: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.OLDEST_ITEM, population: 'active',
    project(ctx) {
      const blocked = gate(ctx, ['nonConformities']);
      if (blocked) return blocked;
      const open = ctx.p.nonConformities.filter((item) => item.severity === ctx.config.criticalSeverity && isOpen(item, 'closedDate'));
      if (!open.length) return notApplicable('no_open_critical_nc', null, { detail: { count: 0 } });
      if (open.some((item) => !isValidDate(item.discoveryDate))) return needsValidation('invalid_inputs', { fields: ['nonConformities'] });
      const oldest = open.map((item) => daysBetween(item.discoveryDate, ctx.ref)).reduce((a, b) => Math.max(a, b));
      return calculated(oldest, { parts: { value: oldest }, detail: { count: open.length } });
    }
  },

  QR8: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.COUNT_POOLED, population: 'all',
    project(ctx) {
      const blocked = gate(ctx, ['hseIncidents']);
      if (blocked) return blocked;
      const since = addMonths(ctx.ref, -ctx.config.qr8Months);
      const count = ctx.p.hseIncidents.filter((item) => item.severe !== false && isValidDate(item.date) && toTime(item.date) > toTime(since) && toTime(item.date) <= toTime(ctx.ref)).length;
      return calculated(count, { parts: { value: count } });
    }
  },

  /* ── DO — Fiabilité des données (inputs: dates and validation only) ─── */
  DO1: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.DISTRIBUTION, population: 'all',
    project(ctx) {
      const blocked = gate(ctx, ['lastUpdateDate']);
      if (blocked) return blocked;
      const age = updateAgeDays(ctx.p, ctx.ref);
      if (age === null || age < 0) return needsValidation('invalid_inputs', { fields: ['lastUpdateDate'] });
      const own = isPopulated(ctx.p, 'expectedUpdateFrequencyDays');
      if (own && !(ctx.p.expectedUpdateFrequencyDays > 0)) return needsValidation('invalid_inputs', { fields: ['expectedUpdateFrequencyDays'] });
      const expected = own ? ctx.p.expectedUpdateFrequencyDays : ctx.config.defaultUpdateFrequencyDays;
      const value = age / expected; // Âge de la dernière mise à jour ÷ périodicité attendue
      const extra = { parts: { value }, detail: { ageDays: age, expectedDays: expected } };
      return own ? calculated(value, extra) : calculated(value, { ...extra, basis: 'default', reasons: [reason('default_periodicity', { days: expected })] });
    }
  }
};

export { pct, isOpen, notified };
