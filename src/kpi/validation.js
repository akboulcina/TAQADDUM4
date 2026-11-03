import { COLLECTION_FIELDS, DEFAULT_REQUIRED_FIELDS } from './sourceSchema.js';
import { daysBetween, isNum, isPresent, isValidDate, toTime } from './primitives.js';

/*
 * Source-data validation. Pure: takes projects and a reference date, returns
 * issues. Two categories, deliberately separate so the data-quality KPIs never
 * depend on each other (no circularity):
 *
 *   'inconsistent' → feeds DO3 (a project with ≥ 1 detected anomaly)
 *   'missing'      → feeds DO2 (required fields populated)
 *   DO1 (freshness) reads dates only.
 *
 * An issue that makes a value unusable also lists it in `invalidFields`: the
 * calculators refuse to compute from those fields (state requires_validation).
 *
 * Issue = { code, category, projectId, field, entityId?, params? }.
 * `code` is translated through `kpr.issue.<code>`.
 */

const PERCENT_FIELDS = ['tap', 'financialRateExAdvances'];
const AMOUNT_FIELDS = [
  'aeCurrent', 'aeInitial', 'committed', 'paymentsTotal', 'worksRealizedValue', 'totalEstimatedCost', 'worksPaidExAdvances',
  'worksContractAmount', 'remainingToDoEstimate', 'paymentCreditsRegistered', 'plannedPaymentsFiscalYear', 'remainingCost',
  'remainingCostWithoutMarket', 'rightOfWayReleased', 'rightOfWayRequired'
];
const COUNT_FIELDS = ['commissionedStructures', 'commissionedFullyFunctional', 'networkInterferencesTreated', 'networkInterferencesIdentified'];
const DURATION_FIELDS = ['initialDurationDays', 'currentDurationDays'];

export const isActiveProject = (project) => !['completed', 'received'].includes(project?.status);

/** A field counts as populated when it holds a value (0 included); an array counts when supplied. */
export function isPopulated(project, field) {
  const value = project?.[field];
  if (COLLECTION_FIELDS.has(field)) return Array.isArray(value);
  if (typeof value === 'boolean') return true;
  return isPresent(value) && (typeof value !== 'number' || Number.isFinite(value));
}

export function validateProject(project, referenceDate, { requiredFields = DEFAULT_REQUIRED_FIELDS } = {}) {
  const issues = [];
  const invalidFields = new Set();
  const projectId = project?.id ?? null;
  const add = (code, category, field, extra = {}) => {
    issues.push({ code, category, projectId, field, ...extra });
    if (category === 'inconsistent' && field) invalidFields.add(field);
  };

  if (!isPresent(project?.id)) add('missing_id', 'inconsistent', 'id');

  PERCENT_FIELDS.forEach((field) => {
    const value = project[field];
    if (isPresent(value) && (!isNum(value) || value < 0 || value > 100)) {
      add(field === 'tap' && isNum(value) && value > 100 ? 'tap_above_100' : 'percentage_out_of_range', 'inconsistent', field, { params: { value } });
    }
  });
  [...AMOUNT_FIELDS, ...COUNT_FIELDS].forEach((field) => {
    const value = project[field];
    if (isPresent(value) && (!isNum(value) || value < 0)) add('negative_value', 'inconsistent', field, { params: { value } });
  });
  DURATION_FIELDS.forEach((field) => {
    const value = project[field];
    if (isPresent(value) && (!isNum(value) || value <= 0)) add('duration_not_positive', 'inconsistent', field, { params: { value } });
  });
  if (isNum(project.paymentsTotal) && isNum(project.committed) && project.paymentsTotal > project.committed) {
    add('payments_exceed_commitments', 'inconsistent', 'paymentsTotal', { params: { payments: project.paymentsTotal, committed: project.committed } });
  }
  if (isNum(project.committed) && isNum(project.aeCurrent) && project.committed > project.aeCurrent) {
    add('commitments_exceed_ae', 'inconsistent', 'committed', { params: { committed: project.committed, ae: project.aeCurrent } });
  }
  if (isNum(project.commissionedFullyFunctional) && isNum(project.commissionedStructures) && project.commissionedFullyFunctional > project.commissionedStructures) {
    add('count_exceeds_total', 'inconsistent', 'commissionedFullyFunctional');
  }
  if (isNum(project.networkInterferencesTreated) && isNum(project.networkInterferencesIdentified) && project.networkInterferencesTreated > project.networkInterferencesIdentified) {
    add('count_exceeds_total', 'inconsistent', 'networkInterferencesTreated');
  }
  if (isNum(project.remainingCostWithoutMarket) && isNum(project.remainingCost) && project.remainingCostWithoutMarket > project.remainingCost) {
    add('count_exceeds_total', 'inconsistent', 'remainingCostWithoutMarket');
  }

  // Dates: unparseable, and chronology.
  ['startOrderDate', 'contractualEndDate', 'lastUpdateDate'].forEach((field) => {
    if (isPresent(project[field]) && !isValidDate(project[field])) add('date_invalid', 'inconsistent', field, { params: { value: String(project[field]) } });
  });
  if (isValidDate(project.startOrderDate) && isValidDate(project.contractualEndDate) && toTime(project.contractualEndDate) < toTime(project.startOrderDate)) {
    add('dates_inconsistent', 'inconsistent', 'contractualEndDate', { params: { start: project.startOrderDate, end: project.contractualEndDate } });
    invalidFields.add('startOrderDate');
  }
  if (isValidDate(project.lastUpdateDate) && isValidDate(referenceDate) && toTime(project.lastUpdateDate) > toTime(referenceDate)) {
    add('update_in_future', 'inconsistent', 'lastUpdateDate', { params: { value: project.lastUpdateDate } });
  }
  const chronology = (list, field, startKey, endKey, code) => (list ?? []).forEach((item, index) => {
    if (isValidDate(item?.[startKey]) && isValidDate(item?.[endKey]) && toTime(item[endKey]) < toTime(item[startKey])) {
      add(code, 'inconsistent', field, { entityId: item.id ?? `#${index + 1}` });
    }
  });
  chronology(project.blockers, 'blockers', 'openedDate', 'closedDate', 'dates_inconsistent');
  chronology(project.invoices, 'invoices', 'receivedDate', 'paidDate', 'dates_inconsistent');
  chronology(project.reevaluations, 'reevaluations', 'requestDate', 'approvedDate', 'dates_inconsistent');
  chronology(project.nonConformities, 'nonConformities', 'discoveryDate', 'closedDate', 'dates_inconsistent');
  chronology(project.stoppages, 'stoppages', 'startDate', 'endDate', 'dates_inconsistent');
  (project.markets ?? []).forEach((market) => chronology(market.amendments, 'markets', 'filedDate', 'csmVisaDate', 'dates_inconsistent'));
  // Dates after the reference date that cannot be in the future.
  const futureCheck = (list, field, key) => (list ?? []).forEach((item, index) => {
    if (isValidDate(item?.[key]) && isValidDate(referenceDate) && toTime(item[key]) > toTime(referenceDate)) add('date_in_future', 'inconsistent', field, { entityId: item.id ?? `#${index + 1}` });
  });
  futureCheck(project.blockers, 'blockers', 'openedDate');
  futureCheck(project.invoices, 'invoices', 'receivedDate');
  futureCheck(project.reevaluations, 'reevaluations', 'requestDate');
  futureCheck(project.nonConformities, 'nonConformities', 'discoveryDate');

  // Markets: amounts.
  (project.markets ?? []).forEach((market, index) => {
    const entityId = market.id ?? `#${index + 1}`;
    if (!isNum(market.initialAmount)) add('missing_market_amount', 'missing', 'markets', { entityId });
    else if (market.initialAmount <= 0) add('negative_value', 'inconsistent', 'markets', { entityId });
    (market.amendments ?? []).forEach((amendment) => {
      if (!isNum(amendment.amount)) add('missing_amendment_amount', 'missing', 'markets', { entityId });
    });
  });

  // Missing required fields (DO2). The brief singles out missing initial / current contract amounts.
  const MISSING_CODE = { aeInitial: 'missing_initial_amount', aeCurrent: 'missing_current_amount' };
  [...new Set([...requiredFields, 'aeInitial', 'aeCurrent'])].forEach((field) => {
    if (!isPopulated(project, field)) issues.push({ code: MISSING_CODE[field] ?? 'missing_required_field', category: 'missing', projectId, field });
  });

  return { projectId, issues, invalidFields, inconsistent: issues.some((issue) => issue.category === 'inconsistent') };
}

/** Validates the whole list, adding portfolio-level checks (duplicate / missing identifiers). */
export function validatePortfolio(projects, referenceDate, options = {}) {
  const reports = projects.map((project) => validateProject(project, referenceDate, options));
  const seen = new Map();
  projects.forEach((project, index) => {
    if (!isPresent(project?.id)) return;
    seen.set(project.id, [...(seen.get(project.id) ?? []), index]);
  });
  seen.forEach((indexes, id) => {
    if (indexes.length > 1) indexes.forEach((index) => {
      reports[index].issues.push({ code: 'duplicate_id', category: 'inconsistent', projectId: id, field: 'id', params: { count: indexes.length } });
      reports[index].inconsistent = true;
    });
  });
  const issues = reports.flatMap((report) => report.issues);
  return {
    reports,
    byProject: new Map(reports.map((report, index) => [projects[index]?.id ?? `#${index}`, report])),
    issues,
    counts: {
      inconsistent: issues.filter((issue) => issue.category === 'inconsistent').length,
      missing: issues.filter((issue) => issue.category === 'missing').length,
      projectsWithAnomaly: reports.filter((report) => report.inconsistent).length
    }
  };
}

/** Age of the last update in days (null when absent or invalid). Used by DO1 only. */
export const updateAgeDays = (project, referenceDate) => (isValidDate(project?.lastUpdateDate) ? daysBetween(project.lastUpdateDate, referenceDate) : null);
