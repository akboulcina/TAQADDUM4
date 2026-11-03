import { CALC_STATE } from './constants.js';
import { isPopulated } from './validation.js';

/*
 * Result constructors. A calculator never returns a bare number: it returns one
 * of these, so "no data" can never be mistaken for zero.
 *
 *   value   number | boolean | null   — null whenever nothing can honestly be said
 *   reasons [{code, params}]          — why the state is what it is (i18n: kpr.reason.<code>)
 *   missing [fieldKey]                — source fields to supply (i18n: kpr.field.<key>)
 *   basis   'exact' | 'proxy' | 'default' | 'derived'
 *   parts   {num, den} | {value}      — what a portfolio aggregation needs
 *   detail  free-form, KPI specific
 */

const base = (extra) => ({ value: null, reasons: [], missing: [], basis: 'exact', parts: null, detail: null, flag: null, items: null, ...extra });
const reason = (code, params) => ({ code, params: params ?? null });

export const calculated = (value, extra = {}) => base({ state: CALC_STATE.CALCULATED, value, ...extra });
export const partial = (value, reasons, extra = {}) => base({ state: CALC_STATE.PARTIAL, value, reasons, ...extra });
export const missingData = (fields, extra = {}) => base({ state: CALC_STATE.MISSING_DATA, missing: fields, reasons: [reason('missing_fields', { fields })], ...extra });
export const notApplicable = (code, params, extra = {}) => base({ state: CALC_STATE.NOT_APPLICABLE, reasons: [reason(code, params)], ...extra });
export const notImplemented = (code, extra = {}) => base({ state: CALC_STATE.NOT_IMPLEMENTED, reasons: [reason(code)], ...extra });
/** kind 'inputs': a source value is impossible (no value). kind 'method': value shown but the method awaits validation. */
export const needsValidation = (code, { kind = 'inputs', value = null, fields = [], params = null, detail = null, ...extra } = {}) => base({
  state: CALC_STATE.REQUIRES_VALIDATION, value, reasons: [reason(code, params ?? { fields })], detail: { validationKind: kind, ...detail }, ...extra
});
export { reason };

/** Missing and invalid source fields of a project for a list of required fields, as a ready-made result (or null). */
export function gate(ctx, fields) {
  const missing = fields.filter((field) => !isPopulated(ctx.p, field));
  if (missing.length) return missingData(missing);
  const invalid = fields.filter((field) => ctx.invalid.has(field));
  if (invalid.length) return needsValidation('invalid_inputs', { kind: 'inputs', fields: invalid });
  return null;
}
