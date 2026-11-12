const DAY_MS = 86400000;

export const STATUS_RANK = { completed: 0, onTrack: 1, atRisk: 2, delayed: 3 };
export const SEVERITY_RANK = { low: 1, medium: 2, high: 3, critical: 4 };

const num = (value) => (typeof value === "number" && Number.isFinite(value) ? value : null);
const sum = (items, pick) => items.reduce((total, item) => total + (pick(item) ?? 0), 0);

export function getToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function daysUntil(isoDate, today = getToday()) {
  if (!isoDate) return null;
  const target = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  return Math.round((target.getTime() - today.getTime()) / DAY_MS);
}

export function normalizeProject(project) {
  if (!project) return null;
  const budget = num(project.budget);
  const committed = num(project.committed) ?? budget;
  const paid = num(project.paid) ?? 0;
  const progress = num(project.progress) ?? 0;
  const financialProgress = num(project.financialProgress) ?? (budget ? (paid / budget) * 100 : 0);
  return {
    id: project.id ?? project.code ?? project.name,
    name: project.name ?? project.title ?? "Projet",
    wilaya: project.wilaya ?? "Non renseignée",
    wilayas: project.wilayas ?? (project.wilaya ? [project.wilaya] : []),
    sector: project.sector ?? "Non renseigné",
    status: project.status ?? "onTrack",
    priority: project.priority ?? "medium",
    progress,
    financialProgress,
    budget,
    initialBudget: num(project.initialBudget),
    committed,
    paid,
    annualCredits: num(project.annualCredits),
    manager: project.manager ?? "Non renseigné",
    dueDate: project.dueDate ?? null,
    startDate: project.startDate ?? null,
    initialDuration: num(project.initialDuration),
    currentDuration: num(project.currentDuration),
    contractor: project.contractor ?? null,
    bet: project.bet ?? null,
    bcs: project.bcs ?? null,
    worksContract: num(project.worksContract),
    pendingAvenant: num(project.pendingAvenant),
    stopped: Boolean(project.stopped),
    delayConsumed: num(project.delayConsumed),
    observation: project.observation ?? null,
    recommendation: project.recommendation ?? null
  };
}

export const isActive = (project) => project.status !== "completed";

export function isOverdue(project, today = getToday()) {
  const days = daysUntil(project.dueDate, today);
  return isActive(project) && days != null && days < 0;
}

export function projectFinance(project) {
  const budget = project.budget ?? 0;
  const committed = project.committed ?? budget;
  const paid = project.paid ?? 0;
  const consumption = budget ? (paid / budget) * 100 : 0;
  const financialProgress = project.financialProgress ?? consumption;
  const costFinal = project.worksContract && project.progress ? (project.worksContract * financialProgress) / project.progress : null;
  return {
    budget,
    initialBudget: project.initialBudget ?? null,
    committed,
    paid,
    annualCredits: project.annualCredits ?? null,
    outstanding: committed - paid,
    unengaged: budget - committed,
    engagementRate: budget ? (committed / budget) * 100 : 0,
    disbursementRate: committed ? (paid / committed) * 100 : 0,
    consumption,
    financialProgress,
    gap: financialProgress - project.progress,
    costFinal,
    overPaid: committed > 0 && paid > committed
  };
}

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
  const ranked = items.filter((item) => item.status !== "completed");
  const pool = ranked.length ? ranked : items;
  return pool.reduce((worst, item) => (STATUS_RANK[item.status] > STATUS_RANK[worst] ? item.status : worst), pool[0]?.status ?? "onTrack");
}

export function summarizePortfolio(rawProjects, today = getToday(), dueSoonDays = 30) {
  const projects = rawProjects.map(normalizeProject).filter(Boolean);
  const active = projects.filter(isActive);
  const budget = sum(projects, (p) => p.budget);
  const committed = sum(projects, (p) => p.committed);
  const paid = sum(projects, (p) => p.paid);
  const weightedProgress = budget ? sum(projects, (p) => (p.budget ?? 0) * p.progress) / budget : average(projects, (p) => p.progress);
  const weightedFinancialProgress = budget ? sum(projects, (p) => (p.budget ?? 0) * p.financialProgress) / budget : average(projects, (p) => p.financialProgress);
  const consumption = budget ? (paid / budget) * 100 : 0;
  const globalGap = weightedFinancialProgress - weightedProgress;

  const byStatus = { onTrack: [], atRisk: [], delayed: [], completed: [] };
  projects.forEach((project) => (byStatus[project.status] ?? (byStatus[project.status] = [])).push(project));

  const bySector = [...groupBy(projects, (p) => p.sector)].map(([sector, items]) => ({
    sector,
    count: items.length,
    committed: sum(items, (p) => p.committed),
    paid: sum(items, (p) => p.paid),
    progress: average(items, (p) => p.progress),
    financialProgress: average(items, (p) => p.financialProgress)
  }));

  const byWilaya = [...groupBy(projects, (p) => p.wilaya)].map(([wilaya, items]) => ({
    wilaya,
    count: items.length,
    projects: items,
    progress: average(items, (p) => p.progress),
    budget: sum(items, (p) => p.budget),
    status: worstStatus(items),
    delayed: items.filter((p) => p.status === "delayed").length,
    atRisk: items.filter((p) => p.status === "atRisk").length
  }));

  const byManager = [...groupBy(projects, (p) => p.manager)].map(([manager, items]) => ({
    manager,
    count: items.length,
    active: items.filter(isActive).length,
    progress: average(items, (p) => p.progress),
    risky: items.filter((p) => p.status === "atRisk" || p.status === "delayed").length
  }));

  return {
    projects,
    total: projects.length,
    active,
    activeCount: active.length,
    completed: byStatus.completed,
    delayed: byStatus.delayed,
    atRisk: byStatus.atRisk,
    risky: projects.filter((p) => p.status === "atRisk" || p.status === "delayed"),
    overdue: projects.filter((p) => isOverdue(p, today)),
    dueSoon: active.filter((p) => { const days = daysUntil(p.dueDate, today); return days != null && days >= 0 && days <= dueSoonDays; }),
    byStatus,
    bySector,
    byWilaya,
    byManager,
    budget,
    totalAuthorisation: budget,
    annualCredits: sum(projects, (p) => p.annualCredits),
    committed,
    paid,
    outstanding: committed - paid,
    avgProgress: average(projects, (p) => p.progress),
    weightedProgress,
    financialProgress: weightedFinancialProgress,
    globalGap,
    consumption,
    spendingGap: globalGap,
    engagementRate: budget ? (committed / budget) * 100 : 0,
    disbursementRate: committed ? (paid / committed) * 100 : 0
  };
}

const CATEGORY_BY_TYPE = {
  "Échéance dépassée": "schedule",
  "Projet ralenti": "schedule",
  "Dépassement budgétaire": "budget",
  "Rapport manquant": "reporting"
};

export function buildAlerts(rawProjects, suppliedAlerts = [], today = getToday()) {
  const projects = rawProjects.map(normalizeProject).filter(Boolean);
  const todayIso = today.toISOString().slice(0, 10);
  const supplied = suppliedAlerts.map((alert, index) => ({
    id: alert.id ?? `alert-${index}`,
    severity: alert.severity ?? "medium",
    type: alert.type ?? "Alerte projet",
    category: alert.category ?? CATEGORY_BY_TYPE[alert.type] ?? "risk",
    title: alert.title ?? "Alerte",
    detail: alert.detail ?? "",
    projectId: alert.project ?? alert.projectId ?? null,
    owner: alert.owner ?? null,
    date: alert.date ?? null
  }));

  const derived = [];
  projects.forEach((project) => {
    const base = { projectId: project.id, owner: project.manager };
    if (isOverdue(project, today)) {
      derived.push({ ...base, id: `${project.id}-overdue`, severity: "critical", type: "Échéance dépassée", category: "schedule", title: `Échéance dépassée — ${project.name}`, detail: `L’échéance contractuelle était le ${project.dueDate}.`, date: project.dueDate });
    }
    if (project.committed && project.paid > project.committed) {
      derived.push({ ...base, id: `${project.id}-budget`, severity: "high", type: "Dépassement budgétaire", category: "budget", title: `Dépassement de paiements — ${project.name}`, detail: "Les paiements enregistrés dépassent le montant engagé.", date: todayIso });
    }
    if (project.progress < 45 && isActive(project)) {
      derived.push({ ...base, id: `${project.id}-stalled`, severity: "medium", type: "Projet ralenti", category: "schedule", title: `Avancement faible — ${project.name}`, detail: `L’avancement physique est de ${project.progress}%.`, date: todayIso });
    }
    if (project.status === "atRisk") {
      derived.push({ ...base, id: `${project.id}-report`, severity: "low", type: "Rapport manquant", category: "reporting", title: `Rapport d’avancement attendu — ${project.name}`, detail: "Le rapport périodique n’a pas été transmis.", date: todayIso });
    }
  });

  const seen = new Set(supplied.map((alert) => alert.id));
  return [...supplied, ...derived.filter((alert) => !seen.has(alert.id))];
}

export function countAlerts(alerts) {
  return Array.isArray(alerts) ? alerts.length : 0;
}

export function matchesAlertView(alert, view = {}) {
  if (view.minSeverity && (SEVERITY_RANK[alert.severity] ?? 0) < SEVERITY_RANK[view.minSeverity]) return false;
  if (view.categories && !view.categories.includes(alert.category)) return false;
  return true;
}

export const sortAlerts = (alerts) => [...alerts].sort((a, b) => (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0) || String(b.date ?? "").localeCompare(String(a.date ?? "")));

export function deriveSites(sites, rawProjects) {
  const projects = rawProjects.map(normalizeProject).filter(Boolean);
  return sites.map((site) => {
    const inWilaya = projects.filter((project) => project.wilaya === site.wilaya || (project.wilayas ?? []).includes(site.wilaya));
    if (!inWilaya.length) return null;
    return { ...site, progress: Math.round(average(inWilaya, (p) => p.progress)), status: worstStatus(inWilaya), projectCount: inWilaya.length };
  }).filter(Boolean);
}

export function selectFocusProject(rawProjects) {
  const projects = rawProjects.map(normalizeProject).filter(Boolean);
  const pool = projects.filter(isActive);
  const candidates = pool.length ? pool : projects;
  return [...candidates].sort((a, b) => STATUS_RANK[b.status] - STATUS_RANK[a.status] || String(a.dueDate ?? "9999").localeCompare(String(b.dueDate ?? "9999")))[0] ?? null;
}
