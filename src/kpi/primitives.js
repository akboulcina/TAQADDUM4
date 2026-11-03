/*
 * Pure numeric / date helpers for the KPI engine. No React, no I/O, no clock:
 * the reference date is always passed in, so every result is reproducible.
 *
 * Dates are ISO strings (YYYY-MM-DD) or Date objects and are handled at UTC
 * midnight, so a result never depends on the machine's time zone.
 */

const DAY_MS = 86_400_000;
/** Mean Gregorian month, used ONLY for the "(en mois)" estimate of DL4. */
export const DAYS_PER_MONTH = 365.2425 / 12;

export const isNum = (value) => typeof value === 'number' && Number.isFinite(value);
export const isPresent = (value) => value !== null && value !== undefined && value !== '';

/** Parse an ISO date (or Date) to a UTC-midnight timestamp, or null when invalid. */
export function toTime(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) {
    const t = Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
    return Number.isNaN(t) ? null : t;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const t = Date.UTC(y, m - 1, d);
  const check = new Date(t);
  // Reject 2026-02-31 style dates that Date.UTC silently rolls over.
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return null;
  return t;
}

export const isValidDate = (value) => toTime(value) !== null;

/** Whole days from `from` to `to` (negative when `to` is earlier). null if either date is invalid. */
export function daysBetween(from, to) {
  const a = toTime(from);
  const b = toTime(to);
  return a === null || b === null ? null : Math.round((b - a) / DAY_MS);
}

export function addDays(date, days) {
  const t = toTime(date);
  return t === null ? null : new Date(t + days * DAY_MS).toISOString().slice(0, 10);
}

/** Calendar-month addition (clamped to the last day of the target month). */
export function addMonths(date, months) {
  const t = toTime(date);
  if (t === null) return null;
  const d = new Date(t);
  const day = d.getUTCDate();
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

export const sum = (values) => values.reduce((total, value) => total + value, 0);

/** Median of finite numbers. Returns null on an empty list — never 0. */
export function median(values) {
  const sorted = values.filter(isNum).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** a ÷ b × `scale`, or null when the denominator is missing or zero. */
export function ratio(numerator, denominator, scale = 1) {
  if (!isNum(numerator) || !isNum(denominator) || denominator === 0) return null;
  return (numerator / denominator) * scale;
}

/** Σ(value × weight) ÷ Σ weight over the items that have BOTH a value and a positive weight. */
export function weightedMean(items) {
  const usable = items.filter((item) => isNum(item.value) && isNum(item.weight) && item.weight > 0);
  const total = sum(usable.map((item) => item.weight));
  if (!usable.length || total === 0) return { value: null, used: 0, weight: 0 };
  return { value: sum(usable.map((item) => item.value * item.weight)) / total, used: usable.length, weight: total };
}

/** Round for display/tests without touching stored precision. */
export const roundTo = (value, digits = 2) => (isNum(value) ? Math.round(value * 10 ** digits) / 10 ** digits : value);

/** Total length (days) covered by [start, end] intervals clipped to [from, to]; overlaps counted once. */
export function mergedDays(intervals, from, to) {
  const lo = toTime(from);
  const hi = toTime(to);
  if (lo === null || hi === null || hi < lo) return null;
  const spans = intervals
    .map((interval) => [Math.max(lo, toTime(interval.startDate) ?? NaN), Math.min(hi, interval.endDate ? toTime(interval.endDate) ?? NaN : hi)])
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b > a)
    .sort((x, y) => x[0] - y[0]);
  let total = 0;
  let cursor = -Infinity;
  spans.forEach(([a, b]) => {
    const start = Math.max(a, cursor);
    if (b > start) total += b - start;
    cursor = Math.max(cursor, b);
  });
  return Math.round(total / DAY_MS);
}
