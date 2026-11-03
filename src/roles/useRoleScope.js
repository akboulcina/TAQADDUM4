import { useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useDemoState } from '../context/DemoStateContext.jsx';
import { projects as allProjects } from '../data/projects.js';
import { territorialSites } from '../data/dashboard.js';
import { nextStep } from '../data/projectWorkflow.js';
import { WORKFLOW_WINDOW_DAYS, DUE_SOON_DAYS } from './roleConfig.js';
import { daysUntil, deriveSites, getToday, selectFocusProject, sortAlerts, summarizePortfolio } from './portfolio.js';
import { useKpiReport } from '../kpi/useKpiReport.js';
import { ALERT_RULES } from '../alerts/ruleRegistry.js';
import { evaluateProjectScope } from '../alerts/scopeEvaluation.js';
import { ACTIVE_ALERT_STATUSES } from '../alerts/lifecycle.js';
import { alertCategoryLabel, alertSeverityKey, alertViewKey } from '../alerts/categories.js';

const RULES_BY_ID = Object.fromEntries(ALERT_RULES.map((rule) => [rule.id, rule]));

/*
 * Everything the signed-in persona is allowed to see, derived once per
 * (persona, demo state, language) and shared by the sidebar, the top bar, the
 * dashboard and every module. Components read this instead of filtering the raw
 * datasets themselves, which is what keeps numbers identical across screens.
 */
export function useRoleScope() {
  const { user, access, t, lang } = useApp();
  const { alertRecords, syncAlertEvaluations, workflow, activityLog } = useDemoState();

  // 1. Projects in scope — the persona never receives the others. Everything below derives from this list.
  const scopedProjects = useMemo(() => access.filterProjects(allProjects), [access]);
  const reportDay = useMemo(() => getToday(), []);

  // 2. The 43-KPI report and the 17 rule evaluations, both computed on the SCOPED projects only.
  const kpiReport = useKpiReport(scopedProjects, reportDay);
  const ruleEvaluations = useMemo(() => evaluateProjectScope(scopedProjects, kpiReport, new Date().toISOString()), [scopedProjects, kpiReport]);
  useEffect(() => {
    if (ruleEvaluations.length) syncAlertEvaluations(ruleEvaluations, RULES_BY_ID);
    // Sync only when a new evaluation batch is computed; state changes must not re-run the batch.
  }, [ruleEvaluations]);

  return useMemo(() => {
    const today = getToday();
    const projects = scopedProjects;
    const projectIds = new Set(projects.map((project) => project.id));
    const byId = new Map(allProjects.map((project) => [project.id, project]));
    const summary = summarizePortfolio(projects, today, DUE_SOON_DAYS);

    // 3. Alerts: the workbook's rule alerts, shown only when the persona is a D/I recipient AND the project is in
    //    scope (access.canViewRuleAlert checks both). Shaped like the dashboard alert cards.
    const allAlerts = Object.values(alertRecords)
      .filter((record) => RULES_BY_ID[record.ruleId] && access.canViewRuleAlert({ ruleId: record.ruleId, projectId: record.projectId }, byId.get(record.projectId)))
      .map((record) => {
        const rule = RULES_BY_ID[record.ruleId];
        return {
          id: record.id, key: record.key, ruleId: record.ruleId, rule,
          severity: alertSeverityKey(rule.severity), severityLabel: rule.severity,
          category: alertViewKey(rule.id), categoryLabel: alertCategoryLabel(rule.id),
          title: rule.name, detail: rule.readableCondition, type: rule.name,
          projectId: record.projectId, owner: record.assignedOwner ?? null, date: String(record.createdAt).slice(0, 10),
          state: record.status, active: ACTIVE_ALERT_STATUSES.includes(record.status), recipientCode: access.alertRecipientCode(rule.id)
        };
      });
    const openAlerts = sortAlerts(allAlerts.filter((alert) => alert.active));
    const decideAlerts = openAlerts.filter((alert) => alert.recipientCode === 'D');

    // 3. Demo workflow items (milestones / deliverables) of active projects in scope.
    const items = [];
    summary.active.forEach((project) => {
      const state = workflow[project.id];
      if (!state) return;
      [['milestone', state.milestones], ['deliverable', state.deliverables]].forEach(([kind, list]) => {
        list.forEach((item) => items.push({ key: `${project.id}:${kind}:${item.id}`, projectId: project.id, project, kind, item, step: nextStep(kind, item.status) }));
      });
    });
    // Waiting for the approver.
    const toValidate = items.filter((entry) => entry.step?.permission === 'project.validate');
    // Waiting for the executor: deliverables not started, and milestones due within the window.
    const toAdvance = items.filter((entry) => {
      if (entry.step?.permission !== 'project.update') return false;
      if (entry.kind === 'deliverable') return true;
      const days = daysUntil(entry.item.date, today);
      return days != null && days <= WORKFLOW_WINDOW_DAYS;
    });

    // 4. Activity: the live log plus the seeded demo feed, kept to the persona's projects.
    const seededActivity = [
      { id: 'ACT-1', actor: 'Sofiane Merabet', action: 'a actualisé l’avancement du projet', time: '2026-10-27', type: 'Mise à jour', projectId: 'PRJ-2038' },
      { id: 'ACT-2', actor: 'Yacine Hamdi', action: 'a soumis une demande d’arbitrage', time: '2026-10-26', type: 'Décision', projectId: 'PRJ-2031' },
      { id: 'ACT-3', actor: 'Karim Benali', action: 'a vérifié les engagements budgétaires', time: '2026-10-24', type: 'Finance', projectId: 'PRJ-2035' }
    ];
    const live = activityLog.map((entry) => ({ id: entry.id, actor: entry.actor, action: t(entry.actionKey), time: new Date(entry.at).toISOString().slice(0, 10), type: entry.type, projectId: entry.projectId, live: true }));
    const activity = [...live, ...seededActivity].filter((entry) => !entry.projectId || projectIds.has(entry.projectId));

    const focusProject = selectFocusProject(projects);

    return {
      user,
      today,
      projects,
      projectIds,
      allProjectsById: byId,
      summary,
      sites: deriveSites(territorialSites, projects),
      allAlerts,
      openAlerts,
      decideAlerts,
      kpiReport,
      ruleEvaluations,
      canViewKpi: access.canViewKpi,
      rightOf: access.kpiRight,
      canViewFinancials: access.canViewFinancials(),
      workflow: { items, toValidate, toAdvance },
      activity,
      focusProject,
      // Project opened by default in Project Details: the one that needs the persona first.
      defaultProjectId: (toValidate[0]?.projectId && access.can('project.validate') ? toValidate[0].projectId : focusProject?.id) ?? projects[0]?.id ?? null,
      // Counts shown on sidebar badges (ids referenced by `badge` in roleConfig.js).
      badges: { alertsOpen: openAlerts.length, pendingValidations: toValidate.length, actionsToAdvance: toAdvance.length }
    };
  }, [user, access, t, lang, scopedProjects, kpiReport, ruleEvaluations, alertRecords, workflow, activityLog]);
}
