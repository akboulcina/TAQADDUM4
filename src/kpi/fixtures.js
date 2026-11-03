/*
 * Test fixtures for the KPI engine. Reference date 2026-11-01.
 * Every number is chosen so the expected KPI values can be derived by hand
 * (see scripts/verify-kpi.mjs, which states each derivation).
 * These are TEST data: they are never shown in the application.
 */

export const REFERENCE_DATE = '2026-11-01';

/** Normal active project — complete data, every KPI calculable. */
export const NORMAL = {
  id: 'NRM', name: 'Normal project', status: 'active',
  aeCurrent: 1000, aeInitial: 1000, aeInitialAdjustment: 0, committed: 800, paymentsTotal: 450,
  tap: 55, worksRealizedValue: 550, totalEstimatedCost: 1000,
  startOrderDate: '2025-11-01', initialDurationDays: 730, currentDurationDays: 730, contractualEndDate: '2027-11-01',
  financialRateExAdvances: 50, remainingToDoEstimate: 200, paymentCreditsRegistered: 300, plannedPaymentsFiscalYear: 250,
  remainingCost: 400, remainingCostWithoutMarket: 40, commissionedStructures: 4, commissionedFullyFunctional: 3,
  rightOfWayReleased: 90, rightOfWayRequired: 100, networkInterferencesTreated: 9, networkInterferencesIdentified: 10,
  progressHistory: [{ date: '2026-07-31', tap: 40 }, { date: '2026-10-01', tap: 50 }],
  markets: [{ id: 'M1', contractorId: 'C1', initialAmount: 800, amendments: [{ id: 'A1', amount: 80, filedDate: '2026-03-01', csmVisaDate: '2026-04-15', notifiedDate: '2026-05-01' }] }],
  reevaluations: [{ id: 'R1', requestDate: '2026-08-02', approvedDate: null, amount: 50 }, { id: 'R0', requestDate: '2026-01-10', approvedDate: '2026-02-10', amount: 20 }],
  invoices: [
    { id: 'I1', marketId: 'M1', amount: 20, receivedDate: '2026-10-01', paidDate: null },
    { id: 'I2', marketId: 'M1', amount: 30, receivedDate: '2026-10-21', paidDate: null },
    { id: 'I3', marketId: 'M1', amount: 10, receivedDate: '2026-09-01', paidDate: null },
    { id: 'I4', marketId: 'M1', amount: 70, receivedDate: '2026-08-01', paidDate: '2026-08-20' }
  ],
  blockers: [
    { id: 'B1', openedDate: '2026-10-02', closedDate: null, owner: 'MO', targetDate: '2026-12-01' },
    { id: 'B2', openedDate: '2026-08-03', closedDate: null, owner: null, targetDate: null },
    { id: 'B3', openedDate: '2026-10-22', closedDate: null, owner: 'Wilaya', targetDate: '2026-11-30' },
    { id: 'B4', openedDate: '2026-01-05', closedDate: '2026-02-05', owner: 'MO', targetDate: '2026-02-01' }
  ],
  stoppages: [{ startDate: '2026-02-01', endDate: '2026-03-02' }, { startDate: '2026-02-15', endDate: '2026-03-17' }],
  hazards: [{ id: 'H1', open: true, solutionDecided: true }],
  consistencyModificationInProgress: false,
  nonConformities: [{ id: 'N1', severity: 'critical', discoveryDate: '2026-10-12', closedDate: null }, { id: 'N2', severity: 'minor', discoveryDate: '2026-01-12', closedDate: null }],
  hseIncidents: [{ id: 'S1', date: '2025-12-01', severe: true }, { id: 'S2', date: '2025-10-01', severe: true }],
  weeklyPlans: [{ weekStart: '2026-10-26', plannedTasks: 10, completedTasks: 8, mobilizationPlanned: 100, mobilizationEffective: 85, nonRealizations: [{ cause: 'land' }, { cause: 'materials' }] }],
  receptions: [
    { id: 'P1', type: 'provisional', date: '2026-03-01', hasReserves: true, reservesLiftedDate: null },
    { id: 'P2', type: 'provisional', date: '2026-09-01', hasReserves: true, reservesLiftedDate: null },
    { id: 'P3', type: 'provisional', date: '2026-01-01', hasReserves: false, reservesLiftedDate: null }
  ],
  arbitrations: [{ id: 'D1', dueDate: '2026-10-01', resolvedDate: null }],
  initialMarketTerminated: false,
  lastUpdateDate: '2026-10-25', expectedUpdateFrequencyDays: 14
};

/** Delayed active project — delay in force exceeded, large drift, ongoing stoppage. */
export const DELAYED = {
  id: 'DLY', name: 'Delayed project', status: 'active',
  aeCurrent: 2000, aeInitial: 1500, aeInitialAdjustment: -500, committed: 1800, paymentsTotal: 900,
  tap: 60, startOrderDate: '2024-11-01', initialDurationDays: 200, currentDurationDays: 400, contractualEndDate: '2025-12-06',
  worksPaidExAdvances: 800, worksContractAmount: 1000,
  progressHistory: [{ date: '2026-07-01', tap: 55 }],
  markets: [{ id: 'M2', contractorId: 'C2', initialAmount: 1000, amendments: [
    { id: 'A1', amount: 100, filedDate: '2025-01-10', csmVisaDate: '2025-02-10', notifiedDate: '2025-03-01' },
    { id: 'A2', amount: 100, filedDate: '2025-04-10', csmVisaDate: '2025-05-10', notifiedDate: '2025-06-01' },
    { id: 'A3', amount: 100, filedDate: '2025-07-10', csmVisaDate: '2025-08-10', notifiedDate: '2025-09-01' },
    { id: 'A4', amount: 100, filedDate: '2025-10-10', csmVisaDate: '2025-11-10', notifiedDate: '2025-12-01' },
    { id: 'A5', amount: 100, filedDate: '2026-01-10', csmVisaDate: '2026-02-10', notifiedDate: '2026-03-01' },
    { id: 'A6', amount: 60, filedDate: '2026-06-03', csmVisaDate: null, notifiedDate: null }
  ] }],
  stoppages: [{ startDate: '2026-07-01', endDate: null }],
  hazards: [{ id: 'H2', open: true, solutionDecided: false }],
  initialMarketTerminated: true,
  lastUpdateDate: '2026-08-01', expectedUpdateFrequencyDays: 30
};

/** Completed project. */
export const COMPLETED = {
  id: 'CMP', name: 'Completed project', status: 'completed',
  aeCurrent: 500, aeInitial: 500, committed: 500, paymentsTotal: 495, tap: 100,
  startOrderDate: '2024-01-01', initialDurationDays: 600, currentDurationDays: 600, contractualEndDate: '2025-08-23',
  initialMarketTerminated: true, lastUpdateDate: '2026-10-20'
};

/** Active project with almost no financial data. */
export const MISSING_FINANCE = {
  id: 'MFN', name: 'Missing financial data', status: 'active',
  tap: 40, startOrderDate: '2026-01-01', initialDurationDays: 365, currentDurationDays: 365, contractualEndDate: '2027-01-01'
};

/** Active project whose source values contradict each other. */
export const INCONSISTENT = {
  id: 'INC', name: 'Inconsistent data', status: 'active',
  aeCurrent: 800, aeInitial: 800, committed: 500, paymentsTotal: 600, tap: 120,
  startOrderDate: '2026-06-01', contractualEndDate: '2026-03-01', initialDurationDays: 300, currentDurationDays: -5,
  lastUpdateDate: '2027-01-01'
};

/** Active project with zero / missing denominators. */
export const ZERO_DENOMINATORS = {
  id: 'ZER', name: 'Zero denominators', status: 'active',
  aeCurrent: 600, aeInitial: 0, committed: 100, paymentsTotal: 0, tap: 0,
  startOrderDate: '2026-11-01', initialDurationDays: 100, currentDurationDays: 100,
  remainingToDoEstimate: 0, plannedPaymentsFiscalYear: 0, paymentCreditsRegistered: 0,
  rightOfWayReleased: 0, rightOfWayRequired: 0, commissionedStructures: 0, commissionedFullyFunctional: 0,
  networkInterferencesTreated: 0, networkInterferencesIdentified: 0, remainingCost: 0, remainingCostWithoutMarket: 0,
  blockers: [], reevaluations: [], invoices: [], nonConformities: [], hazards: [], hseIncidents: []
};

/** Multi-project portfolio used by the portfolio checks. */
export const PORTFOLIO = [NORMAL, DELAYED, COMPLETED, MISSING_FINANCE, INCONSISTENT, ZERO_DENOMINATORS];
