import { DEFAULT_REQUIRED_FIELDS } from './sourceSchema.js';

/*
 * Engine parameters that the workbook states inside a formula or a rule, or that
 * the platform has to choose. Nothing here changes a KPI definition: each value
 * names its origin so a reviewer can tell workbook from platform.
 *
 * Pass `{ config: { … } }` to calculateKpis() to override any of them; the
 * result of a run records nothing silently — the catalogue shows when a basis
 * is a default.
 */
export const DEFAULT_CONFIG = Object.freeze({
  /* From the workbook's own formula / rule text */
  av3WindowDays: 90,                        // AV3 « trois derniers mois » (≈ 3 months)
  co4: Object.freeze({ delayOver: 100, av2Under: 0.9 }),   // CO4 « DL1 > 100 % et AV2 < 0,90 »
  co5: Object.freeze({ stoppedOverDays: 60 }),             // CO5 « arrêtés > 60 jours »
  gv4Months: 6,                             // GV4 « non levées depuis plus de 6 mois »
  qr8Months: 12,                            // QR8 « sur 12 mois »
  criticalSeverity: 'critical',             // QR7 « non-conformité critique »

  /* Platform choices (documented, not from a KPI cell) */
  defaultUpdateFrequencyDays: 30,           // DO1: « Mensuelle » (01_KPI Fréquence_cible) read as 30 days when a project has no own periodicity
  requiredFields: DEFAULT_REQUIRED_FIELDS,  // DO2: proposal, see sourceSchema.js
  requiredFieldsValidated: false,           // DO2 stays « requires_validation » until the PMO confirms the list

  /* Strategic scores — weights come from the workbook, normalisation does not (see calculators.strategic.js) */
  co1: Object.freeze({
    weights: Object.freeze({ av2: 0.40, bu1Inverse: 0.25, pp2: 0.20, terminationHistory: 0.15 }), // 01_KPI, provisional
    normalizers: Object.freeze({ bu1Inverse: null, terminationHistory: null }),                    // NOT defined by the workbook
    validated: false
  }),
  co6: Object.freeze({
    weights: Object.freeze({ av2: 0.25, delays: 0.20, finance: 0.20, blockers: 0.20, co1: 0.15 }), // 01_KPI, provisional
    normalizers: Object.freeze({ av2: null, delays: null, finance: null, blockers: null, co1: null }), // NOT defined by the workbook
    validated: false
  })
});

export function mergeConfig(overrides = {}) {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    co4: { ...DEFAULT_CONFIG.co4, ...overrides.co4 },
    co5: { ...DEFAULT_CONFIG.co5, ...overrides.co5 },
    co1: { ...DEFAULT_CONFIG.co1, ...overrides.co1, weights: { ...DEFAULT_CONFIG.co1.weights, ...overrides.co1?.weights }, normalizers: { ...DEFAULT_CONFIG.co1.normalizers, ...overrides.co1?.normalizers } },
    co6: { ...DEFAULT_CONFIG.co6, ...overrides.co6, weights: { ...DEFAULT_CONFIG.co6.weights, ...overrides.co6?.weights }, normalizers: { ...DEFAULT_CONFIG.co6.normalizers, ...overrides.co6?.normalizers } }
  };
}
