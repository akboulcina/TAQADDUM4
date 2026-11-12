export const ROLE_IDS = ["dg", "pmo", "mo", "pm", "finance", "territorial"];

export const PERMISSIONS = ["alerts.acknowledge", "alerts.resolve", "alerts.dismiss", "project.update", "project.validate", "project.note", "report.export", "finance.view"];

export const SCOPES = ["portfolio", "assigned"];

export const DUE_SOON_DAYS = 30;
export const WORKFLOW_WINDOW_DAYS = 60;

export const ROLE_CONFIG = {
  dg: {
    accessLevel: "decide",
    scope: "portfolio",
    landing: "dashboard",
    permissions: ["alerts.resolve", "project.note", "report.export", "finance.view"],
    nav: [
      { sectionKey: "nav.section.steering", items: [{ route: "dashboard", labelKey: "nav.dashboard.dg" }, { route: "kpi" }, { route: "alerts", labelKey: "nav.alerts.dg", badge: "alertsOpen" }, { route: "map" }, { route: "portfolio" }] },
      { sectionKey: "nav.section.reporting", items: [{ route: "reports" }, { route: "collaboration" }] }
    ],
    extraRoutes: ["project-details"],
    alertView: { minSeverity: "high" },
    dashboard: {
      titleKey: "dashboard.title",
      descriptionKey: "dashboard.description",
      kpis: ["projectsActive", "totalAuthorisationEngagement", "annualPaymentCredits", "physicalProgress", "financialProgressGlobal", "globalVariance", "totalAlerts", "criticalInformed"],
      panels: [
        { id: "health", component: "health" },
        { id: "budget", component: "budget" },
        { id: "map", component: "siteMap" },
        { id: "critical", component: "ruleAlerts", props: { titleKey: "panel.critical.title", subtitleKey: "panel.critical.subtitle", emptyKey: "panel.critical.empty", severities: ["critical"], limit: 4 } },
        { id: "territorialRisk", component: "wilayaRanking" },
        { id: "strategic", component: "kpiShelf", props: { titleKey: "shelf.strategic.title", subtitleKey: "shelf.strategic.subtitle", importance: ["S", "M"], sort: "importance", limit: 7 } },
        { id: "priority", component: "priorityProjects", span: "full" },
        { id: "pending", component: "pendingDecisions", span: "full" }
      ],
      actions: [
        { id: "export", kind: "export", labelKey: "action.export", permission: "report.export" },
        { id: "alerts", kind: "navigate", route: "alerts", labelKey: "action.viewAlerts" },
        { id: "reports", kind: "navigate", route: "reports", labelKey: "action.report", primary: true }
      ]
    }
  },
  pmo: {
    accessLevel: "coordinate",
    scope: "portfolio",
    landing: "dashboard",
    permissions: ["alerts.acknowledge", "alerts.resolve", "alerts.dismiss", "project.note", "report.export", "finance.view"],
    nav: [
      { sectionKey: "nav.section.coordination", items: [{ route: "dashboard", labelKey: "nav.dashboard.pmo" }, { route: "alerts", labelKey: "nav.alerts.pmo", badge: "alertsOpen" }, { route: "portfolio" }, { route: "collaboration" }] },
      { sectionKey: "nav.section.performance", items: [{ route: "kpi" }, { route: "reports" }, { route: "project-details" }] }
    ],
    extraRoutes: [],
    alertView: {},
    dashboard: {
      titleKey: "role.pmo.title",
      descriptionKey: "role.pmo.description",
      kpis: ["trackedProjects", "lateOrAtRisk", "overdueDeadlines", "openAlerts", "ref.DO2", "ref.DO1"],
      panels: [
        { id: "queue", component: "coordinationQueue" },
        { id: "escalations", component: "ruleAlerts", props: { titleKey: "panel.escalations.title", subtitleKey: "panel.escalations.subtitle", emptyKey: "panel.escalations.empty", limit: 5 } },
        { id: "quality", component: "kpiShelf", props: { titleKey: "shelf.quality.title", subtitleKey: "shelf.quality.subtitle", families: ["DO"], limit: 3 } },
        { id: "portfolioKpis", component: "kpiShelf", props: { titleKey: "shelf.portfolio.title", subtitleKey: "shelf.portfolio.subtitle", rights: ["R"], families: ["AV", "DL", "CO", "GV"], limit: 8 } },
        { id: "workload", component: "workload" },
        { id: "activity", component: "activity", props: { titleKey: "panel.activity.titleAll" } }
      ],
      actions: [
        { id: "export", kind: "export", labelKey: "action.export", permission: "report.export" },
        { id: "alerts", kind: "navigate", route: "alerts", labelKey: "action.handleAlerts", primary: true }
      ]
    }
  },
  mo: {
    accessLevel: "validate",
    scope: "assigned",
    landing: "dashboard",
    permissions: ["alerts.acknowledge", "alerts.resolve", "project.validate", "project.note", "report.export", "finance.view"],
    nav: [
      { sectionKey: "nav.section.myProjects", items: [{ route: "dashboard", labelKey: "nav.dashboard.mo" }, { route: "portfolio", labelKey: "nav.portfolio.mine" }, { route: "project-details", labelKey: "nav.projects.mo", badge: "pendingValidations" }, { route: "alerts", labelKey: "nav.alerts.mine", badge: "alertsOpen" }] },
      { sectionKey: "nav.section.operations", items: [{ route: "collaboration" }, { route: "reports" }] }
    ],
    extraRoutes: [],
    alertView: {},
    dashboard: {
      titleKey: "role.mo.title",
      descriptionKey: "role.mo.description",
      kpis: ["assignedProjects", "pendingValidations", "contractualDueSoon", "ref.AV1", "ref.QR1", "openAlerts"],
      panels: [
        { id: "validations", component: "validations" },
        { id: "milestones", component: "contractualMilestones" },
        { id: "progress", component: "kpiShelf", props: { titleKey: "shelf.progress.title", subtitleKey: "shelf.progress.subtitle", families: ["AV", "DL"], limit: 7 } },
        { id: "constraints", component: "kpiShelf", props: { titleKey: "shelf.constraints.title", subtitleKey: "shelf.constraints.subtitle", families: ["QR", "GV"], limit: 7 } },
        { id: "projects", component: "projectList", props: { titleKey: "panel.assigned.title", subtitleKey: "panel.assigned.subtitle" }, span: "full" },
        { id: "alerts", component: "ruleAlerts", props: { titleKey: "panel.scopeAlerts.title", subtitleKey: "panel.scopeAlerts.subtitle", emptyKey: "panel.scopeAlerts.empty", limit: 4 } },
        { id: "activity", component: "activity", props: { titleKey: "panel.activity.titleScope" } }
      ],
      actions: [
        { id: "export", kind: "export", labelKey: "action.export", permission: "report.export" },
        { id: "alerts", kind: "navigate", route: "alerts", labelKey: "action.viewAlerts" },
        { id: "validate", kind: "navigate", route: "project-details", labelKey: "action.openValidations", primary: true }
      ]
    }
  },
  pm: {
    accessLevel: "execute",
    scope: "assigned",
    landing: "dashboard",
    permissions: ["alerts.acknowledge", "project.update", "project.note"],
    nav: [
      { sectionKey: "nav.section.myExecution", items: [{ route: "dashboard", labelKey: "nav.dashboard.pm" }, { route: "project-details", labelKey: "nav.projects.pm", badge: "actionsToAdvance" }, { route: "portfolio", labelKey: "nav.portfolio.mine" }, { route: "alerts", labelKey: "nav.alerts.pm", badge: "alertsOpen" }] },
      { sectionKey: "nav.section.operations", items: [{ route: "collaboration" }] }
    ],
    extraRoutes: [],
    alertView: {},
    dashboard: {
      titleKey: "role.pm.title",
      descriptionKey: "role.pm.description",
      kpis: ["ownProjects", "avgProgress", "nextDue", "actionsToAdvance", "awaitingValidation", "overdueDeadlines"],
      panels: [
        { id: "focus", component: "focusProject" },
        { id: "daily", component: "dailyActions" },
        { id: "board", component: "workflowBoard", span: "full" },
        { id: "projects", component: "projectList", props: { titleKey: "panel.own.title", subtitleKey: "panel.own.subtitle" } },
        { id: "alerts", component: "ruleAlerts", props: { titleKey: "panel.scopeAlerts.title", subtitleKey: "panel.scopeAlerts.subtitle", emptyKey: "panel.scopeAlerts.empty", limit: 4 } },
        { id: "pending", component: "pendingDecisions" },
        { id: "activity", component: "activity", props: { titleKey: "panel.activity.titleScope" } }
      ],
      actions: [{ id: "update", kind: "navigate", route: "project-details", labelKey: "action.updateProject", primary: true }]
    }
  },
  finance: {
    accessLevel: "monitor",
    scope: "portfolio",
    landing: "dashboard",
    permissions: ["alerts.acknowledge", "report.export", "finance.view"],
    nav: [
      { sectionKey: "nav.section.finance", items: [{ route: "dashboard", labelKey: "nav.dashboard.finance" }, { route: "kpi", labelKey: "nav.kpi.finance" }, { route: "portfolio", labelKey: "nav.portfolio.finance" }, { route: "alerts", labelKey: "nav.alerts.finance", badge: "alertsOpen" }] },
      { sectionKey: "nav.section.reporting", items: [{ route: "reports", labelKey: "nav.reports.finance" }, { route: "collaboration" }] }
    ],
    extraRoutes: ["project-details"],
    alertView: { categories: ["budget"] },
    dashboard: {
      titleKey: "role.finance.title",
      descriptionKey: "role.finance.description",
      kpis: ["budgetApproved", "committedBudget", "paymentsTotal", "spendingGap", "ref.FI4", "ref.FI5"],
      panels: [
        { id: "sectors", component: "budget" },
        { id: "review", component: "financialReview" },
        { id: "financeKpis", component: "kpiShelf", props: { titleKey: "shelf.finance.title", subtitleKey: "shelf.finance.subtitle", families: ["FI", "BU"], limit: 9 } },
        { id: "alerts", component: "ruleAlerts", props: { titleKey: "panel.budgetAlerts.title", subtitleKey: "panel.budgetAlerts.subtitle", emptyKey: "panel.budgetAlerts.empty", limit: 4 } },
        { id: "finance", component: "projectFinance", span: "full" },
        { id: "pending", component: "pendingDecisions" },
        { id: "activity", component: "activity", props: { titleKey: "panel.activity.titleAll" } }
      ],
      actions: [
        { id: "export", kind: "export", labelKey: "action.export", permission: "report.export" },
        { id: "kpi", kind: "navigate", route: "kpi", labelKey: "action.openKpi" },
        { id: "reports", kind: "navigate", route: "reports", labelKey: "action.financialReport", primary: true }
      ]
    }
  },
  territorial: {
    accessLevel: "monitor",
    scope: "portfolio",
    landing: "dashboard",
    permissions: ["report.export"],
    nav: [
      { sectionKey: "nav.section.territory", items: [{ route: "dashboard", labelKey: "nav.dashboard.territorial" }, { route: "map" }, { route: "portfolio", labelKey: "nav.portfolio.territorial" }, { route: "kpi" }, { route: "alerts", labelKey: "nav.alerts.territorial", badge: "alertsOpen" }] },
      { sectionKey: "nav.section.operations", items: [{ route: "reports" }, { route: "collaboration" }] }
    ],
    extraRoutes: ["project-details"],
    alertView: { categories: ["schedule", "risk"] },
    dashboard: {
      titleKey: "role.territorial.title",
      descriptionKey: "role.territorial.description",
      kpis: ["wilayasCovered", "territorialProgress", "wilayasDelayed", "wilayasAtRisk", "lowestWilaya", "overdueDeadlines"],
      panels: [
        { id: "map", component: "siteMap", props: { primaryCta: true } },
        { id: "ranking", component: "wilayaRanking" },
        { id: "attention", component: "fieldAttention" },
        { id: "alerts", component: "ruleAlerts", props: { titleKey: "panel.fieldAlerts.title", subtitleKey: "panel.fieldAlerts.subtitle", emptyKey: "panel.fieldAlerts.empty", limit: 4 } },
        { id: "pending", component: "pendingDecisions", span: "full" }
      ],
      actions: [
        { id: "export", kind: "export", labelKey: "action.export", permission: "report.export" },
        { id: "map", kind: "navigate", route: "map", labelKey: "action.openMap", primary: true }
      ]
    }
  }
};

export const FALLBACK_ROLE = {
  accessLevel: "monitor",
  scope: "assigned",
  landing: "dashboard",
  permissions: [],
  nav: [{ sectionKey: "nav.section.steering", items: [{ route: "dashboard" }, { route: "portfolio" }, { route: "alerts", badge: "alertsOpen" }] }],
  extraRoutes: ["project-details"],
  alertView: {},
  isFallback: true,
  dashboard: {
    titleKey: "role.fallback.title",
    descriptionKey: "role.fallback.description",
    kpis: ["trackedProjects", "avgProgress", "openAlerts"],
    panels: [{ id: "projects", component: "projectList", props: { titleKey: "panel.assigned.title", subtitleKey: "panel.assigned.subtitle" }, span: "full" }],
    actions: []
  }
};
