/*
 * Source-data schema of the KPI engine: every input field a KPI needs, who owes
 * it, and which KPIs read it. The engine reports missing fields by these keys
 * (translated through `kpr.field.<key>` in i18n.kpi.js); it never invents a value
 * for them.
 *
 * `entity` says where the field lives. Fields of an entity collection
 * (markets, blockers…) are validated by validation.js.
 */

export const SOURCE_FIELDS = Object.freeze({
  // identity / status
  id: { entity: 'project' },
  status: { entity: 'project' },
  // physical progress
  tap: { entity: 'project', kpis: ['AV1', 'AV2', 'AV3', 'DL4', 'FI1'] },
  worksRealizedValue: { entity: 'project', kpis: ['AV1'] },
  totalEstimatedCost: { entity: 'project', kpis: ['AV1'] },
  progressHistory: { entity: 'project', kpis: ['AV3', 'DL4'] },
  remainingCost: { entity: 'project', kpis: ['AV4'] },
  remainingCostWithoutMarket: { entity: 'project', kpis: ['AV4'] },
  commissionedStructures: { entity: 'project', kpis: ['AV5'] },
  commissionedFullyFunctional: { entity: 'project', kpis: ['AV5'] },
  // finance
  aeCurrent: { entity: 'project', kpis: ['FI2', 'FI4', 'BU3', 'CO3', 'CO6'] },
  aeInitial: { entity: 'project', kpis: ['FI4'] },
  aeInitialAdjustment: { entity: 'project', kpis: ['FI4'] },
  committed: { entity: 'project', kpis: ['BU3', 'DO3'] },
  paymentsTotal: { entity: 'project', kpis: ['FI1', 'FI2', 'DO3'] },
  financialRateExAdvances: { entity: 'project', kpis: ['FI1'] },
  worksPaidExAdvances: { entity: 'project', kpis: ['FI1'] },
  worksContractAmount: { entity: 'project', kpis: ['FI1'] },
  remainingToDoEstimate: { entity: 'project', kpis: ['FI2', 'BU3'] },
  paymentCreditsRegistered: { entity: 'project', kpis: ['FI3'] },
  plannedPaymentsFiscalYear: { entity: 'project', kpis: ['FI3'] },
  reevaluations: { entity: 'project', kpis: ['FI5'] },
  invoices: { entity: 'project', kpis: ['FI6', 'FI7'] },
  // delays
  startOrderDate: { entity: 'project', kpis: ['DL1', 'AV2', 'QR4'] },
  initialDurationDays: { entity: 'project', kpis: ['DL2'] },
  currentDurationDays: { entity: 'project', kpis: ['DL1', 'AV2', 'DL2'] },
  contractualEndDate: { entity: 'project', kpis: ['DL3', 'AV3', 'DL4'] },
  // markets and amendments
  markets: { entity: 'project', kpis: ['BU1', 'BU2', 'FI7', 'CO2', 'GV2'] },
  initialMarketTerminated: { entity: 'project', kpis: ['CO3'] },
  // blockers, quality, risks
  rightOfWayReleased: { entity: 'project', kpis: ['QR1'] },
  rightOfWayRequired: { entity: 'project', kpis: ['QR1'] },
  networkInterferencesTreated: { entity: 'project', kpis: ['QR2'] },
  networkInterferencesIdentified: { entity: 'project', kpis: ['QR2'] },
  blockers: { entity: 'project', kpis: ['QR3', 'GV1'] },
  stoppages: { entity: 'project', kpis: ['QR4', 'CO5'] },
  hazards: { entity: 'project', kpis: ['QR5'] },
  consistencyModificationInProgress: { entity: 'project', kpis: ['QR6'] },
  nonConformities: { entity: 'project', kpis: ['QR7'] },
  hseIncidents: { entity: 'project', kpis: ['QR8'] },
  // data reliability
  lastUpdateDate: { entity: 'project', kpis: ['DO1'] },
  expectedUpdateFrequencyDays: { entity: 'project', kpis: ['DO1'] },
  // field planning
  weeklyPlans: { entity: 'project', kpis: ['PP1', 'PP2', 'PP3'] },
  // contractors / governance
  contractorHistory: { entity: 'contractor', kpis: ['CO1'] },
  arbitrations: { entity: 'project', kpis: ['GV3'] },
  receptions: { entity: 'project', kpis: ['GV4'] },
  amendments: { entity: 'market', kpis: ['BU1', 'BU2', 'GV2'] }
});

/**
 * Fields counted by DO2 « Complétude » ("champs obligatoires renseignés ÷ champs requis").
 *
 * The workbook does not list the required fields. This default is a PROPOSAL: the
 * scalar fields and collections read by the MVP KPIs that the workbook calls
 * calculable from CNED records. DO2 is therefore reported as « requires_validation »
 * until the PMO confirms the list. Pass another list through the engine options to
 * change it.
 */
export const DEFAULT_REQUIRED_FIELDS = Object.freeze([
  'aeCurrent', 'aeInitial', 'paymentsTotal', 'tap',
  'startOrderDate', 'initialDurationDays', 'currentDurationDays', 'contractualEndDate',
  'lastUpdateDate', 'markets', 'blockers', 'stoppages', 'reevaluations'
]);

/** Fields that are collections: "populated" means the array was supplied (an empty array is real information). */
export const COLLECTION_FIELDS = Object.freeze(new Set([
  'markets', 'blockers', 'stoppages', 'reevaluations', 'invoices', 'hazards', 'nonConformities',
  'hseIncidents', 'receptions', 'arbitrations', 'weeklyPlans', 'progressHistory'
]));
