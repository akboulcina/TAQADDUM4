import { REFERENTIEL } from './referentiel.data.js';
import { DIRECTION_BY_LABEL, EXCEL_ROLE_KEYS } from './constants.js';

/*
 * The KPI registry: the 43 definitions of the workbook, and nothing else.
 *
 * Definitions, formulas, units, thresholds, importance, phases, owners and
 * frequencies are copied from `01_KPI` by scripts/kpi/export-referentiel.py
 * (see referentiel.data.js). This module only gives them stable field names and
 * derives *lookups* (family code, direction key, role access, related alert
 * rules); it never edits a source value. Components import from here and never
 * re-type a definition.
 *
 * Thresholds are PROVISIONAL (00_Lecture): they are proposals, neither official
 * nor validated. To use other values, pass overrides to the evaluator
 * (thresholds.js) — the registry itself is never mutated.
 */

export const WORKBOOK = Object.freeze({ ...REFERENTIEL.meta });
export const COMMON_RULES = Object.freeze({ ...REFERENTIEL.commonRules });
export const GLOSSARY = Object.freeze(REFERENTIEL.glossary.map((entry) => Object.freeze({ ...entry })));
export const EXCEL_ROLES = Object.freeze(REFERENTIEL.roles.map((role, index) => Object.freeze({ key: EXCEL_ROLE_KEYS[index], ...role })));

/** The 43 identifiers in workbook order, grouped as announced by the brief. */
export const EXPECTED_IDS = Object.freeze([
  'AV1', 'AV2', 'AV3', 'AV4', 'AV5',
  'FI1', 'FI2', 'FI3', 'FI4', 'FI5', 'FI6', 'FI7',
  'DL1', 'DL2', 'DL3', 'DL4',
  'BU1', 'BU2', 'BU3',
  'QR1', 'QR2', 'QR3', 'QR4', 'QR5', 'QR6', 'QR7', 'QR8',
  'DO1', 'DO2', 'DO3',
  'PP1', 'PP2', 'PP3',
  'CO1', 'CO2', 'CO3', 'CO4', 'CO5', 'CO6',
  'GV1', 'GV2', 'GV3', 'GV4'
]);

const ID_PATTERN = /^[A-Z]{2}\d$/;
const kpiRefsIn = (field) => (typeof field === 'string' && ID_PATTERN.test(field.slice(0, 3)) ? field.slice(0, 3) : null);

/** Alert rules (02_Regles_Alertes) that use a given KPI in one of their conditions. */
export const ALERT_RULES = Object.freeze(REFERENTIEL.alertRules.map((rule) => Object.freeze({
  ...rule,
  importance: rule.importanceLabel.replace(/[\[\]]/g, ''),
  kpiIds: Object.freeze([...new Set(rule.conditions.map((condition) => kpiRefsIn(condition.field)).filter(Boolean))])
})));

function normalizeKpi(raw) {
  const direction = DIRECTION_BY_LABEL[raw.directionLabel];
  if (!direction) throw new Error(`KPI ${raw.id}: unknown "Sens" value "${raw.directionLabel}"`);
  const roleAccess = {};
  EXCEL_ROLE_KEYS.forEach((key, index) => { roleAccess[key] = raw.roleAccess[index] ?? null; }); // 'R' | 'S' | 'V' | null
  return Object.freeze({
    id: raw.id,
    family: raw.id.slice(0, 2),
    familyLabel: raw.familyLabel,
    name: raw.name,
    definition: raw.definition,
    formula: raw.formula,
    unit: raw.unit,
    directionLabel: raw.directionLabel,
    direction,
    greenThreshold: raw.greenThreshold ?? null,
    redThreshold: raw.redThreshold ?? null,
    greenText: raw.greenText ?? null,
    orangeText: raw.orangeText ?? null,
    redText: raw.redText ?? null,
    importance: raw.importanceLabel.replace(/[\[\]]/g, ''), // 'M' | 'A' | 'S'
    phase: raw.phase,                                      // 'MVP' | 'V2' | 'Vision'
    calculability: raw.calculability,
    dataSources: raw.dataSources,
    dataSourceTables: Object.freeze(raw.dataSources.split(';').map((table) => table.trim()).filter(Boolean)),
    dataOwner: raw.dataOwner,   // « Alimenté_par »
    kpiOwner: raw.kpiOwner,     // « Responsable »
    targetFrequency: raw.targetFrequency,
    justification: raw.justification,
    roleAccess: Object.freeze(roleAccess),
    roleScopeNote: raw.roleScopeNote ?? null,
    alertRuleIds: Object.freeze(ALERT_RULES.filter((rule) => rule.kpiIds.includes(raw.id)).map((rule) => rule.id))
  });
}

export const KPI_REGISTRY = Object.freeze(REFERENTIEL.kpis.map(normalizeKpi));
export const KPI_IDS = Object.freeze(KPI_REGISTRY.map((kpi) => kpi.id));
const BY_ID = new Map(KPI_REGISTRY.map((kpi) => [kpi.id, kpi]));

export const getKpi = (id) => BY_ID.get(id) ?? null;

export const FAMILIES = Object.freeze([...new Set(KPI_REGISTRY.map((kpi) => kpi.family))].map((code) => Object.freeze({
  code,
  label: KPI_REGISTRY.find((kpi) => kpi.family === code).familyLabel
})));

/** Throws when the registry is not exactly the 43 expected unique KPIs. Called by the tests and at start-up. */
export function assertRegistry(registry = KPI_REGISTRY) {
  const ids = registry.map((kpi) => kpi.id);
  const unique = new Set(ids);
  if (ids.length !== 43) throw new Error(`Registry must hold exactly 43 KPIs, found ${ids.length}`);
  if (unique.size !== ids.length) throw new Error('Registry holds duplicate KPI ids');
  const missing = EXPECTED_IDS.filter((id) => !unique.has(id));
  const unexpected = ids.filter((id) => !EXPECTED_IDS.includes(id));
  if (missing.length || unexpected.length) throw new Error(`Registry ids differ from the brief (missing: ${missing}; unexpected: ${unexpected})`);
  return true;
}
assertRegistry();
