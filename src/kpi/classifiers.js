import { gate, missingData } from './results.js';
import { daysBetween, isNum, isPresent, isValidDate, toTime } from './primitives.js';
import { isPopulated } from './validation.js';
import { AGGREGATION, LEVEL } from './constants.js';

/*
 * KPIs defined only on the whole portfolio, as « projects meeting a condition ÷
 * projects × 100 » (CO3, CO4, CO5, GV3, DO3). For each project a classifier
 * answers true / false / null (unknown — never guessed), and aggregate.js turns
 * the answers into the proportion with the correct denominator.
 *
 * classify(ctx) → { flag: true|false|null, missing: [], reasons: [], weight?: number }
 * `ctx.kpis` holds the project's own KPI results (DL1, AV2…) for CO4.
 */

const known = (flag, extra = {}) => ({ flag, missing: [], reasons: [], ...extra });
const unknown = (result) => ({ flag: null, missing: result.missing ?? [], reasons: result.reasons ?? [] });
const usable = (result) => result && (result.state === 'calculated' || result.state === 'partial') && isNum(result.value);

export const CLASSIFIERS = {
  /* CO3 — AE of active projects whose initial market was terminated ÷ AE of active projects × 100 (AE-weighted) */
  CO3: {
    level: LEVEL.PORTFOLIO, aggregation: AGGREGATION.PROPORTION_OF_ACTIVE, population: 'active', weighted: true,
    classify(ctx) {
      const blocked = gate(ctx, ['aeCurrent', 'initialMarketTerminated']);
      if (blocked) return unknown(blocked);
      return known(Boolean(ctx.p.initialMarketTerminated), { weight: ctx.p.aeCurrent });
    }
  },

  /* CO4 — projects with DL1 > 100 % and AV2 < 0,90 ÷ active projects × 100 */
  CO4: {
    level: LEVEL.PORTFOLIO, aggregation: AGGREGATION.PROPORTION_OF_ACTIVE, population: 'active',
    classify(ctx) {
      const { DL1: dl1, AV2: av2 } = ctx.kpis;
      if (dl1?.state === 'not_applicable') return known(false); // not started: the delay is not exceeded
      if (!usable(dl1)) return unknown(dl1 ?? missingData(['startOrderDate', 'currentDurationDays']));
      if (dl1.value <= ctx.config.co4.delayOver) return known(false); // AV2 is irrelevant when the delay is not exceeded
      if (!usable(av2)) return unknown(av2 ?? missingData(['tap']));
      return known(av2.value < ctx.config.co4.av2Under);
    }
  },

  /* CO5 — projects stopped for more than 60 days ÷ active projects × 100 */
  CO5: {
    level: LEVEL.PORTFOLIO, aggregation: AGGREGATION.PROPORTION_OF_ACTIVE, population: 'active',
    classify(ctx) {
      const blocked = gate(ctx, ['stoppages']);
      if (blocked) return unknown(blocked);
      const ongoing = ctx.p.stoppages.filter((item) => !isPresent(item.endDate));
      if (ongoing.some((item) => !isValidDate(item.startDate))) return unknown({ missing: [], reasons: [{ code: 'invalid_inputs', params: { fields: ['stoppages'] } }] });
      const days = ongoing.length ? Math.max(...ongoing.map((item) => daysBetween(item.startDate, ctx.ref))) : 0;
      return known(days > ctx.config.co5.stoppedOverDays, { detail: { ongoingDays: days } });
    }
  },

  /* GV3 — active projects with an arbitration past its deadline ÷ active projects × 100 */
  GV3: {
    level: LEVEL.PORTFOLIO, aggregation: AGGREGATION.PROPORTION_OF_ACTIVE, population: 'active',
    classify(ctx) {
      const blocked = gate(ctx, ['arbitrations']);
      if (blocked) return unknown(blocked);
      if (ctx.p.arbitrations.some((item) => !isPresent(item.resolvedDate) && !isValidDate(item.dueDate))) return unknown({ missing: [], reasons: [{ code: 'invalid_inputs', params: { fields: ['arbitrations'] } }] });
      return known(ctx.p.arbitrations.some((item) => !isPresent(item.resolvedDate) && toTime(item.dueDate) < toTime(ctx.ref)));
    }
  },

  /* DO3 — projects with ≥ 1 detected inconsistency ÷ projects × 100. Reads the validation report only. */
  DO3: {
    level: LEVEL.PORTFOLIO, aggregation: AGGREGATION.PROPORTION_OF_ALL, population: 'all',
    classify(ctx) {
      return known(ctx.validation.inconsistent, { detail: { anomalies: ctx.validation.issues.filter((issue) => issue.category === 'inconsistent').length } });
    }
  }
};

export { isPopulated };
