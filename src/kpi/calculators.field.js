import { calculated, gate, missingData, needsValidation, notApplicable, partial, reason } from './results.js';
import { addMonths, daysBetween, isNum, isPresent, isValidDate, median, ratio, sum, toTime } from './primitives.js';
import { isOpen, pct } from './calculators.js';
import { AGGREGATION, LEVEL } from './constants.js';
import { isPopulated } from './validation.js';

/*
 * Field planning (PP), governance (GV) and completeness (DO2) formulas that are
 * defined per project. Same contract as calculators.js.
 */

/** Latest weekly plan on or before the reference date. */
function latestWeek(ctx) {
  const weeks = ctx.p.weeklyPlans.filter((week) => isValidDate(week?.weekStart) && toTime(week.weekStart) <= toTime(ctx.ref));
  return weeks.sort((a, b) => toTime(b.weekStart) - toTime(a.weekStart))[0] ?? null;
}

const EXTERNAL_CAUSES = ['land', 'payment', 'materials', 'networks']; // « l'emprise, au paiement, aux matériaux ou aux réseaux »

export const CALCULATORS_FIELD = {
  PP1: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.POOLED_RATIO, population: 'active',
    project(ctx) {
      const blocked = gate(ctx, ['weeklyPlans']);
      if (blocked) return blocked;
      const week = latestWeek(ctx);
      if (!week || !isNum(week.plannedTasks) || !isNum(week.completedTasks)) return missingData(['weeklyPlans']);
      if (week.plannedTasks === 0) return notApplicable('nothing_planned');
      if (week.completedTasks < 0 || week.completedTasks > week.plannedTasks) return needsValidation('invalid_inputs', { fields: ['weeklyPlans'] });
      return calculated(pct(week.completedTasks, week.plannedTasks), { parts: { num: week.completedTasks, den: week.plannedTasks }, detail: { weekStart: week.weekStart } });
    }
  },

  PP2: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.DISTRIBUTION, population: 'active',
    project(ctx) {
      const blocked = gate(ctx, ['weeklyPlans']);
      if (blocked) return blocked;
      const week = latestWeek(ctx);
      if (!week || !isNum(week.mobilizationPlanned) || !isNum(week.mobilizationEffective)) return missingData(['weeklyPlans']);
      if (week.mobilizationPlanned === 0) return notApplicable('nothing_planned');
      if (week.mobilizationEffective < 0) return needsValidation('invalid_inputs', { fields: ['weeklyPlans'] });
      // Resources are in the project's own unit (hours, workforce, equipment): never pooled across projects.
      return calculated(pct(week.mobilizationEffective, week.mobilizationPlanned), { detail: { weekStart: week.weekStart }, parts: { value: pct(week.mobilizationEffective, week.mobilizationPlanned) } });
    }
  },

  PP3: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.COUNT_POOLED, population: 'active',
    project(ctx) {
      const blocked = gate(ctx, ['weeklyPlans']);
      if (blocked) return blocked;
      const week = latestWeek(ctx);
      if (!week || !isNum(week.plannedTasks) || !isNum(week.completedTasks)) return missingData(['weeklyPlans']);
      const total = week.plannedTasks - week.completedTasks; // total des non-réalisations
      if (total < 0) return needsValidation('invalid_inputs', { fields: ['weeklyPlans'] });
      if (total === 0) return notApplicable('nothing_unrealized');
      const causes = Array.isArray(week.nonRealizations) ? week.nonRealizations : [];
      const byCause = {};
      [...EXTERNAL_CAUSES, 'other'].forEach((cause) => { byCause[cause] = causes.filter((item) => (EXTERNAL_CAUSES.includes(item.cause) ? item.cause : 'other') === cause).length; });
      const external = sum(EXTERNAL_CAUSES.map((cause) => byCause[cause]));
      const documented = sum(Object.values(byCause));
      const value = pct(external, total);
      const detail = { total, external, byCause, byCausePct: Object.fromEntries(Object.entries(byCause).map(([cause, n]) => [cause, pct(n, total)])), documented };
      const extra = { parts: { num: external, den: total }, detail };
      // Causes not recorded for every non-realisation: the share is a lower bound.
      return documented < total ? partial(value, [reason('causes_not_fully_documented', { documented, total })], { ...extra, basis: 'derived' }) : calculated(value, extra);
    }
  },

  GV1: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.POOLED_RATIO, population: 'active',
    project(ctx) {
      const blocked = gate(ctx, ['blockers']);
      if (blocked) return blocked;
      const open = ctx.p.blockers.filter((item) => isOpen(item, 'closedDate'));
      if (!open.length) return notApplicable('no_open_blocker', null, { detail: { count: 0 } });
      const owned = open.filter((item) => isPresent(item.owner) && isPresent(item.targetDate)).length; // responsable ET échéance
      return calculated(pct(owned, open.length), { parts: { num: owned, den: open.length }, detail: { open: open.length, owned } });
    }
  },

  GV2: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.OLDEST_ITEM, population: 'active',
    project(ctx) {
      const blocked = gate(ctx, ['markets']);
      if (blocked) return blocked;
      if (ctx.p.markets.some((market) => !Array.isArray(market.amendments))) return missingData(['amendments']);
      const pending = ctx.p.markets.flatMap((market) => market.amendments.filter((amendment) => !isPresent(amendment.csmVisaDate)));
      if (!pending.length) return notApplicable('nothing_pending', null, { detail: { count: 0 } });
      if (pending.some((amendment) => !isValidDate(amendment.filedDate))) return needsValidation('invalid_inputs', { fields: ['markets'] });
      const oldest = pending.map((amendment) => daysBetween(amendment.filedDate, ctx.ref)).reduce((a, b) => Math.max(a, b));
      return calculated(oldest, { parts: { value: oldest }, detail: { count: pending.length } });
    }
  },

  GV4: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.POOLED_RATIO, population: 'all',
    project(ctx) {
      const blocked = gate(ctx, ['receptions']);
      if (blocked) return blocked;
      const provisional = ctx.p.receptions.filter((reception) => reception.type === 'provisional');
      if (!provisional.length) return notApplicable('no_provisional_reception', null, { detail: { count: 0 } });
      if (provisional.some((reception) => !isValidDate(reception.date))) return needsValidation('invalid_inputs', { fields: ['receptions'] });
      const stale = provisional.filter((reception) => reception.hasReserves === true && !isPresent(reception.reservesLiftedDate)
        && toTime(addMonths(reception.date, ctx.config.gv4Months)) < toTime(ctx.ref)); // réserves non levées depuis plus de 6 mois
      return calculated(pct(stale.length, provisional.length), { parts: { num: stale.length, den: provisional.length }, detail: { provisional: provisional.length, overdueReserves: stale.length } });
    }
  },

  DO2: {
    level: LEVEL.PROJECT, aggregation: AGGREGATION.POOLED_RATIO, population: 'all',
    project(ctx) {
      const required = ctx.config.requiredFields;
      const populated = required.filter((field) => isPopulated(ctx.p, field));
      const value = ratio(populated.length, required.length, 100); // champs obligatoires renseignés ÷ champs requis × 100
      const extra = { parts: { num: populated.length, den: required.length }, detail: { populated: populated.length, required: required.length, absent: required.filter((field) => !isPopulated(ctx.p, field)) } };
      return ctx.config.requiredFieldsValidated
        ? calculated(value, extra)
        : needsValidation('required_fields_not_validated', { kind: 'method', value, ...extra });
    }
  }
};
