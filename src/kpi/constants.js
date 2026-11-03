import { PERSONA_REFERENCE_MAP } from '../roles/roleReference.js';

/*
 * Shared vocabularies of the KPI engine. Values are stable identifiers (never
 * display strings): the UI translates them through i18n.kpi.js.
 */

/** Explicit calculation state of a KPI result. */
export const CALC_STATE = Object.freeze({
  CALCULATED: 'calculated',                 // every required input present and valid
  PARTIAL: 'partial',                       // a value exists, but from a proxy or a subset of the scope
  MISSING_DATA: 'missing_data',             // required source fields absent → no value (never 0)
  NOT_APPLICABLE: 'not_applicable',         // the KPI is undefined for this subject (e.g. nothing open to age)
  NOT_IMPLEMENTED: 'not_implemented',       // the workbook does not define enough to compute it
  REQUIRES_VALIDATION: 'requires_validation' // inputs are inconsistent, or the method awaits team validation
});
export const CALC_STATES = Object.freeze(Object.values(CALC_STATE));

/** Result of the threshold evaluator. */
export const STATUS = Object.freeze({
  GREEN: 'green',
  ORANGE: 'orange',
  RED: 'red',
  INFORMATIONAL: 'informational',
  NOT_EVALUABLE: 'not_evaluable'
});
export const STATUSES = Object.freeze(Object.values(STATUS));

/** Normalised direction ("Sens" column of 01_KPI). */
export const DIRECTION = Object.freeze({
  HIGHER_BETTER: 'higher_better',
  LOWER_BETTER: 'lower_better',
  ABSOLUTE_DEVIATION: 'absolute_deviation',
  SPECIAL_RULE: 'special_rule',
  INFORMATION: 'information'
});
export const DIRECTION_BY_LABEL = Object.freeze({
  'Plus haut = mieux': DIRECTION.HIGHER_BETTER,
  'Plus bas = mieux': DIRECTION.LOWER_BETTER,
  'Écart absolu': DIRECTION.ABSOLUTE_DEVIATION,
  'Règle spéciale': DIRECTION.SPECIAL_RULE,
  Information: DIRECTION.INFORMATION
});

export const CONFIDENCE = Object.freeze({ HIGH: 'high', MEDIUM: 'medium', LOW: 'low', NONE: 'none' });

/** At which level a KPI is naturally defined (what one "subject" is). */
export const LEVEL = Object.freeze({ PROJECT: 'project', MARKET: 'market', CONTRACTOR: 'contractor', PORTFOLIO: 'portfolio' });

/** How a portfolio value is obtained from project/market values. Every KPI declares one. */
export const AGGREGATION = Object.freeze({
  POOLED_RATIO: 'pooled_ratio',               // Σ numerators ÷ Σ denominators (cost-/count-weighted by construction)
  WEIGHTED_MEAN_AE: 'weighted_mean_ae',       // Σ(value × AE actuelle) ÷ Σ AE actuelle
  MEDIAN_POOLED: 'median_pooled',             // median over the pooled underlying items (no median of medians)
  OLDEST_ITEM: 'oldest_item',                 // age of the oldest pending item of the whole scope
  PROPORTION_OF_ACTIVE: 'proportion_of_active', // projects meeting a condition ÷ active projects
  PROPORTION_OF_ALL: 'proportion_of_all',     // projects meeting a condition ÷ all projects
  MEDIAN_OF_PROJECTS: 'median_of_projects',   // median of project values (DL3, specified by the workbook)
  COUNT_POOLED: 'count_pooled',               // Σ counts
  MAX_OF_UNITS: 'max_of_units',               // worst unit (market, contractor) — no averaging across markets
  DISTRIBUTION: 'distribution',               // no scalar: counts of project statuses (aggregation not appropriate)
  NOT_AGGREGATED: 'not_aggregated'            // meaningful per project/contractor only
});

/** Roles of the workbook (03_Matrice_Roles) in the order of its columns. */
export const EXCEL_ROLE_KEYS = Object.freeze(['direction', 'pmo', 'mo', 'bet', 'contractor', 'budgetController']);

/**
 * Platform personas (src/roles/roleConfig.js) that have a workbook role. Derived from
 * src/roles/roleReference.js, the single place where the mapping (and what stays
 * unresolved: chef de projet, territorial, BET, contractant) is decided.
 */
export const PERSONA_TO_EXCEL_ROLE = Object.freeze(Object.fromEntries(
  Object.entries(PERSONA_REFERENCE_MAP).filter(([, mapping]) => mapping.excelRole).map(([id, mapping]) => [id, mapping.excelRole])
));
