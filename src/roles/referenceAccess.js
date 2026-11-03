import { KPI_REGISTRY } from '../kpi/registry.js';
import { ALERT_RULES } from '../alerts/ruleRegistry.js';
import { alertCategoryLabel, alertViewKey } from '../alerts/categories.js';
import { EXCEL_ROLE_TO_PERSONA_MAP, PERSONA_REFERENCE_MAP, REFERENCE_ROLE_KEYS } from './roleReference.js';

/*
 * Visibility derived from the workbook — pure functions, no React.
 *
 * KPI right (03_Matrice_Roles, columns E–J)
 *   R  responsible: validates and reports        V  read-only
 *   S  feeds the data, is not responsible        —  not visible
 * Alert code (second table of 03_Matrice_Roles)
 *   D  recipient: must act                       I  informed
 *   —  not a recipient, does not see the alert
 *
 * The codes are read from the registries generated from the workbook
 * (kpi/registry.js `roleAccess`, alerts/ruleRegistry.js `recipientRoles`); nothing
 * is retyped here. A persona with no workbook role gets an empty profile, which is
 * the documented safe default (everything hidden).
 *
 * What the codes do NOT mean: S is not an administrative right, V is not a right to
 * edit, and D is only the right to act on an alert in addition to the role's
 * permission and project scope (access.js).
 */

const KPI_RIGHTS = Object.freeze(['R', 'S', 'V']);
const ALERT_CODES = Object.freeze(['D', 'I']);

const unique = (list) => [...new Set(list)];

export function buildReferenceProfile(personaId) {
  const mapping = PERSONA_REFERENCE_MAP[personaId] ?? null;
  const excelRole = mapping?.excelRole ?? null;

  const rights = {};
  KPI_REGISTRY.forEach((kpi) => {
    const right = excelRole ? kpi.roleAccess[excelRole] : null;
    if (KPI_RIGHTS.includes(right)) rights[kpi.id] = right;
  });
  const ids = (predicate) => KPI_REGISTRY.filter((kpi) => predicate(kpi, rights[kpi.id])).map((kpi) => kpi.id);

  const alertCodes = {};
  ALERT_RULES.forEach((rule) => {
    const recipient = excelRole ? rule.recipientRoles.find((entry) => entry.excelRole === excelRole) : null;
    if (recipient && ALERT_CODES.includes(recipient.code)) alertCodes[rule.id] = recipient.code;
  });
  const rulesWith = (code) => ALERT_RULES.filter((rule) => alertCodes[rule.id] === code).map((rule) => rule.id);
  const visibleKpis = ids((kpi, right) => Boolean(right));

  return Object.freeze({
    personaId,
    excelRole,
    mappingStatus: mapping?.status ?? 'unresolved',
    kpiRights: Object.freeze(rights),
    kpi: Object.freeze({
      visible: Object.freeze(visibleKpis),
      owned: Object.freeze(ids((kpi, right) => right === 'R')),          // responsible: validates and reports
      contributes: Object.freeze(ids((kpi, right) => right === 'S')),    // data contributor
      readOnly: Object.freeze(ids((kpi, right) => right === 'V')),       // view only
      hidden: Object.freeze(ids((kpi, right) => !right)),                // blank in the matrix
      families: Object.freeze(unique(visibleKpis.map((id) => id.slice(0, 2)))),
      financial: Object.freeze(visibleKpis.filter((id) => id.startsWith('FI') || id.startsWith('BU')))
    }),
    alertCodes: Object.freeze(alertCodes),
    alerts: Object.freeze({
      decide: Object.freeze(rulesWith('D')),
      inform: Object.freeze(rulesWith('I')),
      visible: Object.freeze(Object.keys(alertCodes)),
      hidden: Object.freeze(ALERT_RULES.filter((rule) => !alertCodes[rule.id]).map((rule) => rule.id)),
      categories: Object.freeze(unique(Object.keys(alertCodes).map(alertCategoryLabel))),
      viewKeys: Object.freeze(unique(Object.keys(alertCodes).map(alertViewKey)))
    })
  });
}

const PROFILES = new Map();
/** Cached, frozen profile of a persona id. Unknown ids get the empty (safe) profile. */
export function getReferenceProfile(personaId) {
  if (!PROFILES.has(personaId)) PROFILES.set(personaId, buildReferenceProfile(personaId));
  return PROFILES.get(personaId);
}

/**
 * Cross-checks the persona map against the registries. Returns a list of problems
 * (empty = consistent). Used by the tests and available to a start-up assertion.
 */
export function auditReferenceMapping() {
  const problems = [];
  Object.entries(PERSONA_REFERENCE_MAP).forEach(([personaId, mapping]) => {
    if (mapping.excelRole && !REFERENCE_ROLE_KEYS.includes(mapping.excelRole)) problems.push(`${personaId}: unknown workbook role ${mapping.excelRole}`);
  });
  const mappedRoles = Object.values(PERSONA_REFERENCE_MAP).map((mapping) => mapping.excelRole).filter(Boolean);
  if (new Set(mappedRoles).size !== mappedRoles.length) problems.push('two personas share one workbook role');
  ALERT_RULES.forEach((rule) => rule.recipientRoles.forEach((recipient) => {
    const expected = EXCEL_ROLE_TO_PERSONA_MAP[recipient.excelRole] ?? null;
    if ((recipient.persona ?? null) !== expected) problems.push(`${rule.id}/${recipient.excelRole}: registry persona ${recipient.persona} ≠ mapping ${expected}`);
  }));
  return problems;
}
