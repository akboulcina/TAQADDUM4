import { KPI_REGISTRY } from './registry.js';
import { KPI_ENGINE_META } from './engine.js';
import { CALC_STATE, PERSONA_TO_EXCEL_ROLE } from './constants.js';

/*
 * Pure view-model of the catalogue: which rows exist, which survive the filters,
 * and how a result becomes text. No React, so the tests can drive it.
 * Calculations are NOT redone here — rows only point at engine results.
 */

export const EMPTY_FILTERS = Object.freeze({ query: '', id: '', family: '', importance: '', phase: '', state: '', direction: '', level: '', mine: false });

/**
 * One row per KPI of the registry (always 43).
 * scope 'portfolio' → the consolidated result; scope 'project' → the result of that project,
 * or null for indicators that only exist at portfolio level.
 */
export function buildRows(report, { scope = 'portfolio', projectId = null } = {}) {
  const entry = scope === 'project' ? report.projects.find((p) => p.id === projectId) : null;
  return KPI_REGISTRY.map((kpi) => {
    const meta = KPI_ENGINE_META[kpi.id];
    const result = scope === 'project' ? (meta.hasProjectValue ? entry?.kpis[kpi.id] ?? null : null) : report.portfolio[kpi.id];
    return { kpi, meta, level: meta.level, result, projectLevelAvailable: meta.hasProjectValue };
  });
}

/**
 * Keeps only the rows whose KPI the persona may see (`canView` = access.canViewKpi). Applied BEFORE any
 * filter, count or summary, so a hidden KPI can neither be listed, counted nor searched for.
 */
export const restrictRows = (rows, canView) => rows.filter(({ kpi }) => canView(kpi.id));

const norm = (text) => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** `persona` is the platform persona id (dg, pmo, …). Personas without a workbook role never get a "mine" filter. */
export function filterRows(rows, filters = EMPTY_FILTERS, { persona = null } = {}) {
  const f = { ...EMPTY_FILTERS, ...filters };
  const query = norm(f.query).trim();
  const role = PERSONA_TO_EXCEL_ROLE[persona] ?? null;
  return rows.filter(({ kpi, level, result }) => {
    if (f.id && kpi.id !== f.id) return false;
    if (f.family && kpi.family !== f.family) return false;
    if (f.importance && kpi.importance !== f.importance) return false;
    if (f.phase && kpi.phase !== f.phase) return false;
    if (f.direction && kpi.direction !== f.direction) return false;
    if (f.level && level !== f.level) return false;
    if (f.state && (result?.state ?? 'none') !== f.state) return false;
    if (f.mine && role && !kpi.roleAccess[role]) return false;
    if (query && !(norm(kpi.id).includes(query) || norm(kpi.name).includes(query) || norm(kpi.definition).includes(query) || norm(kpi.formula).includes(query))) return false;
    return true;
  });
}

export const personaRole = (persona) => PERSONA_TO_EXCEL_ROLE[persona] ?? null;

const UNIT_KEY = { '%': 'percent', ratio: 'ratio', pts: 'pts', j: 'days', mois: 'months', nombre: 'count', '0–100': 'score', 'oui/non': 'yesno' };
export const unitKey = (unit) => UNIT_KEY[unit] ?? 'count';

/** Text of a value. Returns null when the result has no value to show — never "0" as a stand-in. */
export function formatValue(result, unit, { fmt, t }) {
  if (!result || result.value === null || result.value === undefined || Number.isNaN(result.value)) return null;
  const v = result.value;
  switch (unit) {
    case '%': return fmt.percent(v, 1);
    case 'ratio': return fmt.number(v, 2);
    case 'pts': return fmt.points(v, 1);
    case 'j': return `${fmt.number(v, 0)} ${t('kpr.unit.days')}`;
    case 'mois': return `${fmt.number(v, 1)} ${t('kpr.unit.months')}`;
    case 'oui/non': return v === true || v === 1 ? t('kpr.yes') : t('kpr.no');
    case '0–100': return `${fmt.number(v, 0)}${t('kpr.unit.score')}`;
    default: return fmt.number(v, 0);
  }
}

/** Counts used by the summary strip, for the rows currently in scope. */
export function summarizeRows(rows) {
  const by = (state) => rows.filter((r) => r.result?.state === state).length;
  return {
    total: rows.length,
    calculated: by(CALC_STATE.CALCULATED),
    partial: by(CALC_STATE.PARTIAL),
    missing: by(CALC_STATE.MISSING_DATA),
    notApplicable: by(CALC_STATE.NOT_APPLICABLE),
    review: by(CALC_STATE.NOT_IMPLEMENTED) + by(CALC_STATE.REQUIRES_VALIDATION),
    none: rows.filter((r) => !r.result).length,
    operational: rows.filter((r) => r.result?.readiness === 'operational' || r.result?.readiness === 'limited').length
  };
}

/** Which KPIs of the registry are rooted in a given source field — used to show "what unlocks what". */
export const isPreview = (result) => Boolean(result && /_preview$/.test(result.readiness ?? ''));
export const isNotOperational = (kpi) => kpi.phase !== 'MVP';
