import { DIRECTION, STATUS } from './constants.js';
import { getKpi } from './registry.js';
import { isNum } from './primitives.js';

/*
 * Threshold / status evaluator — one function, one rule per direction, taken
 * from 00_Lecture « Seuils » and the 06_Simulateur status formula:
 *
 *   higher is better : Green ≥ Seuil_Vert ; Orange ≥ Seuil_Rouge ; Red otherwise
 *   lower is better  : Green ≤ Seuil_Vert ; Orange ≤ Seuil_Rouge ; Red above
 *   absolute gap     : same rule applied to |value|
 *   special rule     : the textual rule of the Vert / Orange / Rouge columns (QR5, QR6, QR8)
 *   information      : no numeric threshold → Informational
 *
 * Bounds are inclusive on the side of the better level. A value that is not a
 * finite number (or a threshold that is absent) is "not evaluable": it is never
 * coerced to 0 and never given a colour.
 *
 * Thresholds are provisional and configurable: `overrides` replaces
 * greenThreshold / redThreshold per KPI id, without mutating the registry, and
 * the result says when an override was used.
 */

/** Optional per-KPI overrides, e.g. { DL3: { greenThreshold: 0, redThreshold: 120 } }. Empty by default. */
export const DEFAULT_THRESHOLD_OVERRIDES = Object.freeze({});

export function resolveThresholds(kpiOrId, overrides = DEFAULT_THRESHOLD_OVERRIDES) {
  const kpi = typeof kpiOrId === 'string' ? getKpi(kpiOrId) : kpiOrId;
  if (!kpi) throw new Error(`Unknown KPI ${kpiOrId}`);
  const override = overrides?.[kpi.id];
  const hasOverride = Boolean(override) && (isNum(override.greenThreshold) || isNum(override.redThreshold));
  const green = isNum(override?.greenThreshold) ? override.greenThreshold : kpi.greenThreshold;
  const red = isNum(override?.redThreshold) ? override.redThreshold : kpi.redThreshold;
  return { green, red, overridden: hasOverride, provisional: true };
}

/** Throws when thresholds contradict the KPI's direction (green must be the better bound). */
export function validateThresholds(kpiOrId, thresholds) {
  const kpi = typeof kpiOrId === 'string' ? getKpi(kpiOrId) : kpiOrId;
  const { green, red } = thresholds;
  if (!isNum(green) || !isNum(red)) return true;
  const bad = kpi.direction === DIRECTION.HIGHER_BETTER ? green < red : green > red;
  if (bad && [DIRECTION.HIGHER_BETTER, DIRECTION.LOWER_BETTER, DIRECTION.ABSOLUTE_DEVIATION].includes(kpi.direction)) {
    throw new Error(`KPI ${kpi.id}: thresholds ${green}/${red} contradict direction ${kpi.direction}`);
  }
  return true;
}

const result = (status, extra = {}) => ({ status, basis: null, thresholds: null, ...extra });

/* Special rules: the workbook states them in words (columns Vert / Orange / Rouge). */
const SPECIAL_RULES = {
  // QR5 — 0 aléa ouvert → Vert ; ≥ 1 aléa avec solution arrêtée → Orange ; ≥ 1 aléa sans solution arrêtée → Rouge
  QR5: (value, detail) => {
    if (!isNum(value)) return STATUS.NOT_EVALUABLE;
    if (value === 0) return STATUS.GREEN;
    if (!isNum(detail?.withoutSolution)) return STATUS.NOT_EVALUABLE;
    return detail.withoutSolution > 0 ? STATUS.RED : STATUS.ORANGE;
  },
  // QR6 — Non → Vert ; Oui → Rouge (Orange « — » : no intermediate level)
  QR6: (value) => (value === false ? STATUS.GREEN : value === true ? STATUS.RED : STATUS.NOT_EVALUABLE),
  // QR8 — 0 → Vert ; ≥ 1 → Rouge (Orange « — »)
  QR8: (value) => (!isNum(value) || value < 0 ? STATUS.NOT_EVALUABLE : value === 0 ? STATUS.GREEN : STATUS.RED)
};

/**
 * Evaluate one KPI value.
 * @param {string|object} kpiOrId   registry entry or id
 * @param {number|boolean|null} value
 * @param {{overrides?: object, detail?: object}} [options]
 * @returns {{status: string, basis: string|null, thresholds: object|null}}
 */
export function evaluateKpi(kpiOrId, value, { overrides = DEFAULT_THRESHOLD_OVERRIDES, detail = null } = {}) {
  const kpi = typeof kpiOrId === 'string' ? getKpi(kpiOrId) : kpiOrId;
  if (!kpi) throw new Error(`Unknown KPI ${kpiOrId}`);

  if (kpi.direction === DIRECTION.INFORMATION) return result(isNum(value) ? STATUS.INFORMATIONAL : STATUS.NOT_EVALUABLE, { basis: 'information' });

  if (kpi.direction === DIRECTION.SPECIAL_RULE) {
    const rule = SPECIAL_RULES[kpi.id];
    if (!rule) return result(STATUS.NOT_EVALUABLE, { basis: 'special_rule_undefined' });
    return result(rule(value, detail), { basis: 'special_rule' });
  }

  const thresholds = resolveThresholds(kpi, overrides);
  validateThresholds(kpi, thresholds);
  if (!isNum(value) || !isNum(thresholds.green) || !isNum(thresholds.red)) return result(STATUS.NOT_EVALUABLE, { basis: 'thresholds', thresholds });

  const { green, red } = thresholds;
  let status;
  if (kpi.direction === DIRECTION.HIGHER_BETTER) status = value >= green ? STATUS.GREEN : value >= red ? STATUS.ORANGE : STATUS.RED;
  else if (kpi.direction === DIRECTION.LOWER_BETTER) status = value <= green ? STATUS.GREEN : value <= red ? STATUS.ORANGE : STATUS.RED;
  else {
    const magnitude = Math.abs(value);
    status = magnitude <= green ? STATUS.GREEN : magnitude <= red ? STATUS.ORANGE : STATUS.RED;
  }
  return result(status, { basis: 'thresholds', thresholds });
}

/** Counts of statuses for a list of results — used for "distribution" portfolio views. */
export function statusDistribution(results) {
  const counts = { green: 0, orange: 0, red: 0, informational: 0, not_evaluable: 0 };
  results.forEach((entry) => { counts[entry.status] = (counts[entry.status] ?? 0) + 1; });
  return counts;
}
