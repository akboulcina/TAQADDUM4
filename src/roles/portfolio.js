/*
 * Pure selectors over the shared project / alert datasets.
 *
 * Every dashboard KPI, sidebar badge and the Alerts module derive their numbers
 * from these functions, so the same project can never show two different values
 * on two screens. No React, no I/O: these run unchanged in Node (see
 * scripts/verify-roles.mjs).
 */

const DAY_MS = 86_400_000;

export const STATUS_RANK = { completed: 0, onTrack: 1, atRisk: 2, delayed: 3 };
export const SEVERITY_RANK = { low: 1, medium: 2, high: 3, critical: 4 };

const num = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const sum = (items, pick) => items.reduce((total, item) => total + (pick(item) ?? 0), 0);

/** Local midnight of the current day. Single clock for the whole app. */
export function getToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/** Whole days from `today` to an ISO date (negative when the date has passed). */
export function daysUntil(isoDate, today = getToday()) {
  if (!isoDate) return null;
  const target = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  return Math.round((target.getTime() - today.getTime()) / DAY_MS);
}

export function normalizeProject(project) {
  if (!project) return null;
  return {
    id: project.id ?? project.code ?? project.name,
    name: project.name ?? project.title ?? 'Projet',
    wilaya: project.wilaya ?? 'Non renseignée',
    sector: project.sector ?? 'Non renseigné',
    status: project.status ?? 'onTrack',
    priority: project.priority ?? 'medium',
    progress: num(project.progress) ?? 0,
    budget: num(project.budget),
    committed: num(project.committed) ?? num(project.budget),
    paid: num(project.paid) ?? 0,
    manager: project.manager ?? 'Non renseigné',
    dueDate: project.dueDate ?? null
  };
}

export const isActive = (project) => project.status !== 'completed';

/** A project is overdue once its due date is strictly in the past and it is not completed. */
export function isOverdue(project, today = getToday()) {
  const days = daysUntil(project.dueDate, today);
  return isActive(project) && days != null && days < 0;
}

/** Financial indicators of one project. `gap` = payments rate − physical progress, in points. */
export function projectFinance(project) {
  const budget = project.budget ?? 0;
  const committed = project.committed ?? budget;
  const paid = project.paid ?? 0;
  const consumption = budget ? (paid / budget) * 100 : 0;
  return {
    budget,
    committed,
    paid,
    outstanding: committed - paid,
    unengaged: budget - committed,
    engagementRate: budget ? (committed / budget) * 100 : 0,
    disbursementRate: committed ? (paid / committed) * 100 : 0,
    consumption,
    gap: consumption - project.progress,
    overPaid: committed > 0 && paid > committed
  };
}

/** Threshold (points) above which a payments/progress gap is flagged for financial review. */
export const FINANCIAL_GAP_THRESHOLD = 10;

export function needsFinancialReview(project) {
  const finance = projectFinance(project);
  return isActive(project) && (finance.overPaid || Math.abs(finance.gap) >= FINANCIAL_GAP_THRESHOLD);
}

function groupBy(items, keyOf) {
  const groups = new Map();
  items.forEach((item) => {
    const key = keyOf(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  return groups;
}

const average = (items, pick) => (items.length ? sum(items, pick) / items.length : 0);

export function worstStatus(items) {
  const ranked = items.filter((item) => item.status !== 'completed');
  const pool = ranked.length ? ranked : items;
  return pool.reduce((worst, item) => (STATUS_RANK[item.status] > STATUS_RANK[worst] ? item.status : worst), pool[0]?.status ?? 'onTrack');
}

/** Consolidated view of a set of projects. */
export function summarizePortfolio(rawProjects, today = getToday(), dueSoonDays = 30) {
  const projects = rawProjects.map(normalizeProject).filter(Boolean);
  const active = projects.filter(isActive);
  const budget = sum(projects, (p) => p.budget);
  const committed = sum(projects, (p) => p.committed);
  const paid = sum(projects, (p) => p.paid);
  const weightedProgress = budget ? sum(projects, (p) => (p.budget ?? 0) * p.progress) / budget : average(projects, (p) => p.progress);
  const consumption = budget ? (paid / budget) * 100 : 0;

  const byStatus = { onTrack: [], atRisk: [], delayed: [], completed: [] };
  projects.forEach((project) => (byStatus[project.status] ?? (byStatus[project.status] = [])).push(project));

  const bySector = [...groupBy(projects, (p) => p.sector)].map(([sector, items]) => ({
    sector,
    count: items.length,
    committed: sum(items, (p) => p.committed),
    paid: sum(items, (p) => p.paid),
    progress: average(items, (p) => p.progress)
  }));

  const byWilaya = [...groupBy(projects, (p) => p.wilaya)].map(([wilaya, items]) => ({
    wilaya,
    count: items.length,
    projects: items,
    progress: average(items, (p) => p.progress),
    budget: sum(items, (p) => p.budget),
    status: worstStatus(items),
    delayed: items.filter((p) => p.status === 'delayed').length,
    atRisk: items.filter((p) => p.status === 'atRisk').length
  }));

  const byManager = [...groupBy(projects, (p) => p.manager)].map(([manager, items]) => ({
    manager,
    count: items.length,
    active: items.filter(isActive).length,
    progress: average(items, (p) => p.progress),
    risky: items.filter((p) => p.status === 'atRisk' || p.status === 'delayed').length
  }));

  return {
    projects,
    total: projects.length,
    active,
    activeCount: active.length,
    completed: byStatus.completed,
    delayed: byStatus.delayed,
    atRisk: byStatus.atRisk,
    risky: projects.filter((p) => p.status === 'atRisk' || p.status === 'delayed'),
    overdue: projects.filter((p) => isOverdue(p, today)),
    dueSoon: active.filter((p) => { const days = daysUntil(p.dueDate, today); return days != null && days >= 0 && days <= dueSoonDays; }),
    byStatus,
    bySector,
    byWilaya,
    byManager,
    budget,
    committed,
    paid,
    outstanding: committed - paid,
    avgProgress: average(projects, (p) => p.progress),
    weightedProgress,
    consumption,
    spendingGap: consumption - weightedProgress,
    engagementRate: budget ? (committed / budget) * 100 : 0,
    disbursementRate: committed ? (paid / committed) * 100 : 0
  };
}

/* ───────────────────────────── Alerts ───────────────────────────── */

const CATEGORY_BY_TYPE = {
  'Échéance dépassée': 'schedule',
  'Projet ralenti': 'schedule',
  'Dépassement budgétaire': 'budget',
  'Rapport manquant': 'reporting'
};

/**
 * Supplied alerts (src/data/dashboard.js) + operational alerts derived from the
 * projects. This is the single alert builder: the Alerts module, the dashboards
 * and the sidebar badge all call it with the same inputs.
 */
export function buildAlerts(rawProjects, suppliedAlerts = [], today = getToday()) {
  const projects = rawProjects.map(normalizeProject).filter(Boolean);
  const todayIso = today.toISOString().slice(0, 10);
  const supplied = suppliedAlerts.map((alert, index) => ({
    id: alert.id ?? `alert-${index}`,
    severity: alert.severity ?? 'medium',
    type: alert.type ?? 'Alerte projet',
    category: alert.category ?? CATEGORY_BY_TYPE[alert.type] ?? 'risk',
    title: alert.title ?? 'Alerte',
    detail: alert.detail ?? '',
    projectId: alert.project ?? alert.projectId ?? null,
    owner: alert.owner ?? null,
    date: alert.date ?? null
  }));

  const derived = [];
  projects.forEach((project) => {
    const base = { projectId: project.id, owner: project.manager };
    if (isOverdue(project, today)) {
      derived.push({ ...base, id: `${project.id}-overdue`, severity: 'critical', type: 'Échéance dépassée', category: 'schedule', title: `Échéance dépassée — ${project.name}`, detail: `L’échéance contractuelle était le ${project.dueDate}.`, date: project.dueDate });
    }
    if (project.committed && project.paid > project.committed) {
      derived.push({ ...base, id: `${project.id}-budget`, severity: 'high', type: 'Dépassement budgétaire', category: 'budget', title: `Dépassement de paiements — ${project.name}`, detail: 'Les paiements enregistrés dépassent le montant engagé.', date: todayIso });
    }
    if (project.progress < 45 && isActive(project)) {
      derived.push({ ...base, id: `${project.id}-stalled`, severity: 'medium', type: 'Projet ralenti', category: 'schedule', title: `Avancement faible — ${project.name}`, detail: `L’avancement physique est de ${project.progress}%.`, date: todayIso });
    }
    if (project.status === 'atRisk') {
      derived.push({ ...base, id: `${project.id}-report`, severity: 'low', type: 'Rapport manquant', category: 'reporting', title: `Rapport d’avancement attendu — ${project.name}`, detail: 'Le rapport périodique n’a pas été transmis.', date: todayIso });
    }
  });

  const seen = new Set(supplied.map((alert) => alert.id));
  return [...supplied, ...derived.filter((alert) => !seen.has(alert.id))];
}

/** Does an alert belong to a role's alert view ({ minSeverity?, categories? })? */
export function matchesAlertView(alert, view = {}) {
  if (view.minSeverity && (SEVERITY_RANK[alert.severity] ?? 0) < SEVERITY_RANK[view.minSeverity]) return false;
  if (view.categories && !view.categories.includes(alert.category)) return false;
  return true;
}

export const sortAlerts = (alerts) =>
  [...alerts].sort((a, b) => (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0) || String(b.date ?? '').localeCompare(String(a.date ?? '')));

/* ───────────────────────────── Territory ───────────────────────────── */

/**
 * Map markers: keep the coordinates of the static site list, but derive progress,
 * status and project count from the projects, so a wilaya can never disagree with
 * the project it contains. Wilayas with no project in scope are dropped.
 */
export function deriveSites(sites, rawProjects) {
  const projects = rawProjects.map(normalizeProject).filter(Boolean);
  return sites
    .map((site) => {
      const inWilaya = projects.filter((project) => project.wilaya === site.wilaya);
      if (!inWilaya.length) return null;
      return { ...site, progress: Math.round(average(inWilaya, (p) => p.progress)), status: worstStatus(inWilaya), projectCount: inWilaya.length };
    })
    .filter(Boolean);
}

/** The project that deserves attention first: worst status, then earliest due date. */
export function selectFocusProject(rawProjects) {
  const projects = rawProjects.map(normalizeProject).filter(Boolean);
  const pool = projects.filter(isActive);
  const candidates = pool.length ? pool : projects;
  return [...candidates].sort((a, b) => STATUS_RANK[b.status] - STATUS_RANK[a.status] || String(a.dueDate ?? '9999').localeCompare(String(b.dueDate ?? '9999')))[0] ?? null;
}
