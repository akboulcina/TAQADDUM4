import { daysUntil, needsFinancialReview, FINANCIAL_GAP_THRESHOLD } from '../../roles/portfolio.js';
import { WORKFLOW_WINDOW_DAYS } from '../../roles/roleConfig.js';
import { getKpi } from '../../kpi/registry.js';
import { formatValue } from '../../kpi/catalogue.js';

/*
 * KPI registry. A role's dashboard lists KPI ids (roles/roleConfig.js); each id
 * resolves here to a function of the role's SCOPED data, so a KPI is always
 * computed from the projects the persona can see — never typed in.
 *
 *   compute(scope, f) → { value, note?, tone? }
 *   scope: see src/roles/useRoleScope.js     f: { t, ...createFormatters(lang) }
 *   tone:  'success' | 'warning' | 'danger' | undefined
 */

const countBySeverity = (alerts, severity) => alerts.filter((alert) => alert.severity === severity).length;

function nextDueProject(scope) {
  return [...scope.summary.active]
    .filter((project) => project.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] ?? null;
}

function dueTone(days) {
  if (days == null) return undefined;
  if (days < 0) return 'danger';
  return days <= 7 ? 'danger' : days <= 30 ? 'warning' : undefined;
}

const engagementNote = (s, f) => f.t('kpi.note.engagementRate', { rate: f.percent(s.summary.engagementRate, 0) });
const disbursementNote = (s, f) => f.t('kpi.note.disbursement', { rate: f.percent(s.summary.disbursementRate, 0) });
const activeNote = (s, f) => f.t('kpi.note.activeCount', { n: f.int(s.summary.activeCount) });

export const KPI_DEFINITIONS = {
  /* ── Executive ── */
  projectsActive: {
    labelKey: 'kpi.projects',
    compute: (s, f) => ({ value: f.int(s.summary.activeCount), note: f.t('kpi.note.ofTotal', { n: f.int(s.summary.total) }) })
  },
  committedBudget: {
    labelKey: 'kpi.budget',
    compute: (s, f) => ({ value: f.billions(s.summary.committed), note: engagementNote(s, f) })
  },
  physicalProgress: {
    labelKey: 'kpi.execution',
    compute: (s, f) => ({ value: f.percent(s.summary.weightedProgress, 1), note: f.t('kpi.note.weighted') })
  },
  paymentsTotal: {
    labelKey: 'kpi.payments',
    compute: (s, f) => ({ value: f.billions(s.summary.paid), note: disbursementNote(s, f) })
  },
  decisionsRequired: {
    labelKey: 'kpi.decisions',
    // Alerts the persona must act on (code D in the workbook).
    compute: (s, f) => {
      const critical = countBySeverity(s.decideAlerts, 'critical');
      return { value: f.int(s.decideAlerts.length), note: f.t('kpi.note.criticalCount', { n: f.int(critical) }), tone: critical ? 'danger' : s.decideAlerts.length ? 'warning' : 'success' };
    }
  },
  criticalInformed: {
    labelKey: 'kpi.criticalInformed',
    // The Direction is « I » (informed) on its alerts: red alerts are shown for awareness, not as tasks.
    compute: (s, f) => {
      const red = countBySeverity(s.openAlerts, 'critical');
      return { value: f.int(red), note: f.t('kpi.note.informedOnly'), tone: red ? 'danger' : 'success' };
    }
  },
  spendingGap: {
    labelKey: 'kpi.variance',
    compute: (s, f) => ({ value: f.points(s.summary.spendingGap), note: f.t('kpi.note.spendingGap'), tone: Math.abs(s.summary.spendingGap) >= FINANCIAL_GAP_THRESHOLD ? 'warning' : undefined })
  },

  /* ── PMO ── */
  trackedProjects: {
    labelKey: 'kpi.tracked',
    compute: (s, f) => ({ value: f.int(s.summary.total), note: activeNote(s, f) })
  },
  lateOrAtRisk: {
    labelKey: 'kpi.lateOrAtRisk',
    compute: (s, f) => {
      const count = s.summary.delayed.length + s.summary.atRisk.length;
      return { value: f.int(count), note: f.t('kpi.note.delayedCount', { n: f.int(s.summary.delayed.length) }), tone: s.summary.delayed.length ? 'danger' : count ? 'warning' : 'success' };
    }
  },
  overdueDeadlines: {
    labelKey: 'kpi.overdue',
    compute: (s, f) => ({ value: f.int(s.summary.overdue.length), note: f.t('kpi.note.dueSoon', { n: f.int(s.summary.dueSoon.length) }), tone: s.summary.overdue.length ? 'danger' : s.summary.dueSoon.length ? 'warning' : 'success' })
  },
  openAlerts: {
    labelKey: 'kpi.openAlerts',
    // Active rule alerts the persona is a D/I recipient of, on its own scope.
    compute: (s, f) => {
      const critical = countBySeverity(s.openAlerts, 'critical');
      return { value: f.int(s.openAlerts.length), note: f.t('kpi.note.alertsSplit', { critical: f.int(critical), act: f.int(s.decideAlerts.length) }), tone: critical ? 'danger' : s.openAlerts.length ? 'warning' : 'success' };
    }
  },
  avgProgress: {
    labelKey: 'kpi.avgProgress',
    compute: (s, f) => ({ value: f.percent(s.summary.avgProgress, 1), note: f.t('kpi.note.simpleAverage') })
  },

  /* ── Maître d’Ouvrage ── */
  assignedProjects: {
    labelKey: 'kpi.assigned',
    compute: (s, f) => ({ value: f.int(s.summary.total), note: activeNote(s, f) })
  },
  pendingValidations: {
    labelKey: 'kpi.pendingValidations',
    compute: (s, f) => ({ value: f.int(s.workflow.toValidate.length), note: f.t('kpi.note.demoWorkflow'), tone: s.workflow.toValidate.length ? 'warning' : 'success' })
  },
  contractualDueSoon: {
    labelKey: 'kpi.contractualDue',
    compute: (s, f) => {
      const soon = s.summary.active.filter((project) => { const days = daysUntil(project.dueDate, s.today); return days != null && days <= WORKFLOW_WINDOW_DAYS; });
      const next = nextDueProject(s);
      return { value: f.int(soon.length), note: next ? f.t('kpi.note.nextDate', { date: f.date(next.dueDate) }) : f.t('kpi.note.none'), tone: soon.length ? 'warning' : undefined };
    }
  },
  committedScope: {
    labelKey: 'kpi.committedScope',
    compute: (s, f) => ({ value: f.billions(s.summary.committed), note: engagementNote(s, f) })
  },
  paidScope: {
    labelKey: 'kpi.paidScope',
    compute: (s, f) => ({ value: f.billions(s.summary.paid), note: disbursementNote(s, f) })
  },

  /* ── Chef de Projet ── */
  ownProjects: {
    labelKey: 'kpi.own',
    compute: (s, f) => ({ value: f.int(s.summary.total), note: activeNote(s, f) })
  },
  nextDue: {
    labelKey: 'kpi.nextDue',
    compute: (s, f) => {
      const next = nextDueProject(s);
      if (!next) return { value: '—', note: f.t('kpi.note.none') };
      const days = daysUntil(next.dueDate, s.today);
      const note = days < 0 ? f.t('kpi.note.daysLate', { n: f.int(-days) }) : days === 0 ? f.t('kpi.note.today') : f.t('kpi.note.daysLeft', { n: f.int(days) });
      return { value: f.date(next.dueDate), note: `${next.id} · ${note}`, tone: dueTone(days) };
    }
  },
  actionsToAdvance: {
    labelKey: 'kpi.actionsToAdvance',
    compute: (s, f) => ({ value: f.int(s.workflow.toAdvance.length), note: f.t('kpi.note.demoWorkflow'), tone: s.workflow.toAdvance.length ? 'warning' : 'success' })
  },
  awaitingValidation: {
    labelKey: 'kpi.awaitingValidation',
    compute: (s, f) => ({ value: f.int(s.workflow.toValidate.length), note: f.t('kpi.note.awaitingOwner') })
  },

  /* ── Finance ── */
  budgetApproved: {
    labelKey: 'kpi.budgetApproved',
    compute: (s, f) => ({ value: f.billions(s.summary.budget), note: f.t('kpi.note.projectsCount', { n: f.int(s.summary.total) }) })
  },
  outstandingCommitments: {
    labelKey: 'kpi.outstanding',
    compute: (s, f) => ({ value: f.billions(s.summary.outstanding), note: f.t('kpi.note.outstanding') })
  },
  financialFlags: {
    labelKey: 'kpi.financialFlags',
    compute: (s, f) => {
      const flagged = s.summary.projects.filter(needsFinancialReview).length;
      return { value: f.int(flagged), note: f.t('kpi.note.flagThreshold', { n: FINANCIAL_GAP_THRESHOLD }), tone: flagged ? 'warning' : 'success' };
    }
  },

  /* ── Territorial ── */
  wilayasCovered: {
    labelKey: 'kpi.wilayas',
    compute: (s, f) => ({ value: f.int(s.summary.byWilaya.length), note: f.t('kpi.note.projectsCount', { n: f.int(s.summary.total) }) })
  },
  territorialProgress: {
    labelKey: 'kpi.territorialProgress',
    compute: (s, f) => {
      const wilayas = s.summary.byWilaya;
      const average = wilayas.length ? wilayas.reduce((total, item) => total + item.progress, 0) / wilayas.length : 0;
      return { value: f.percent(average, 1), note: f.t('kpi.note.wilayaAverage') };
    }
  },
  wilayasDelayed: {
    labelKey: 'kpi.wilayasDelayed',
    compute: (s, f) => {
      const count = s.summary.byWilaya.filter((item) => item.delayed > 0).length;
      return { value: f.int(count), note: f.t('kpi.note.delayedProjects', { n: f.int(s.summary.delayed.length) }), tone: count ? 'danger' : 'success' };
    }
  },
  wilayasAtRisk: {
    labelKey: 'kpi.wilayasAtRisk',
    compute: (s, f) => {
      const count = s.summary.byWilaya.filter((item) => item.atRisk > 0).length;
      return { value: f.int(count), note: f.t('kpi.note.atRiskProjects', { n: f.int(s.summary.atRisk.length) }), tone: count ? 'warning' : 'success' };
    }
  },
  lowestWilaya: {
    labelKey: 'kpi.lowestWilaya',
    compute: (s, f) => {
      const lowest = [...s.summary.byWilaya].sort((a, b) => a.progress - b.progress)[0];
      return lowest ? { value: lowest.wilaya, note: f.t('kpi.note.lowestProgress', { rate: f.percent(lowest.progress, 0) }), tone: lowest.status === 'delayed' ? 'danger' : lowest.status === 'atRisk' ? 'warning' : undefined } : { value: '—', note: f.t('kpi.note.none') };
    }
  },
  territorialBudget: {
    labelKey: 'kpi.territorialBudget',
    compute: (s, f) => (s.canViewFinancials
      ? { value: f.billions(s.summary.budget), note: f.t('kpi.note.projectsCount', { n: f.int(s.summary.total) }) }
      : { value: '—', note: f.t('kpi.note.financeHidden') })
  }
};

/*
 * Referentiel KPI cards: the id « ref.<KPI_ID> » (e.g. « ref.FI4 ») in a dashboard config shows the
 * PORTFOLIO value of that KPI from the engine, for the persona's scoped projects. The value is the
 * engine's, untouched; a KPI the persona cannot see (blank in the workbook matrix) is never rendered.
 */
const STATUS_TONE_BY_KPI = { green: 'success', orange: 'warning', red: 'danger' };

function referentielDefinition(kpiId) {
  const kpi = getKpi(kpiId);
  if (!kpi) return null;
  return {
    label: `${kpi.id} · ${kpi.name}`,
    compute: (s, f) => {
      if (!s.canViewKpi(kpiId)) return { value: '—', note: f.t('kpr.roleAccess.none') };
      const result = s.kpiReport?.portfolio?.[kpiId];
      const text = formatValue(result, kpi.unit, { fmt: f, t: f.t });
      if (text === null) return { value: '—', note: f.t(`kpr.state.${result?.state ?? 'not_implemented'}`) };
      return { value: text, note: `${f.t(`kpr.roleAccess.${s.rightOf(kpiId)}`)} · ${f.t(`kpr.state.${result.state}`)}`, tone: STATUS_TONE_BY_KPI[result.status] };
    }
  };
}

/** Definition of a dashboard KPI id, local (« projectsActive ») or referentiel (« ref.FI4 »). Null when unknown. */
export function resolveKpiDefinition(id) {
  if (KPI_DEFINITIONS[id]) return KPI_DEFINITIONS[id];
  return typeof id === 'string' && id.startsWith('ref.') ? referentielDefinition(id.slice(4)) : null;
}
