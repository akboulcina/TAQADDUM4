import { ROLE_CONFIG, FALLBACK_ROLE } from './roleConfig.js';
import { matchesAlertView } from './portfolio.js';
import { getReferenceProfile } from './referenceAccess.js';
import { alertSeverityKey, alertViewKey } from '../alerts/categories.js';

/*
 * Access helpers: the ONLY place that turns a role definition (roleConfig.js)
 * into yes/no answers. Components call these instead of comparing role ids.
 *
 * ⚠ Demonstration behaviour: this runs in the browser and can be bypassed.
 * See the notice at the top of roleConfig.js — production needs server-side checks.
 */

const ALERT_ACTION_PERMISSION = {
  acknowledged: 'alerts.acknowledge',
  resolved: 'alerts.resolve',
  dismissed: 'alerts.dismiss',
  under_review: 'alerts.acknowledge',
  action_planned: 'alerts.resolve'
};

export function getRoleConfig(user) {
  return (user && ROLE_CONFIG[user.id]) || FALLBACK_ROLE;
}

/** Build the access object for one persona. Pure and cheap: recreate it when the persona changes. */
export function createAccess(user) {
  const config = getRoleConfig(user);
  const permissions = new Set(config.permissions);
  const allowedRoutes = new Set([...config.nav.flatMap((section) => section.items.map((item) => item.route)), ...config.extraRoutes]);

  const can = (permission) => permissions.has(permission);
  const isAssigned = (project) => Boolean(user) && Boolean(project) && project.manager === user.name;
  // A project is in scope when the role sees the whole portfolio, or when it is assigned to the persona.
  const canViewProject = (project) => Boolean(project) && (config.scope === 'portfolio' || isAssigned(project));

  const canActOnProject = (permission, project) => can(permission) && canViewProject(project);

  /**
   * Can this persona move `alert` to `state` ('acknowledged' | 'resolved' | 'dismissed')?
   * Needs the matching permission, the alert to belong to the role's alert view,
   * and — for assigned-scope roles — the alert's project to be assigned to them.
   */
  const canActOnAlert = (alert, state, project) => {
    const permission = ALERT_ACTION_PERMISSION[state];
    if (!permission || !can(permission) || !alert) return false;
    if (!matchesAlertView(alert, config.alertView)) return false;
    if (config.scope === 'assigned') return canViewProject(project);
    return true;
  };

  /*
   * Visibility from the workbook (03_Matrice_Roles). The profile is empty for a persona
   * with no workbook role: every KPI hidden, no alert recipient — the safe default.
   */
  const reference = getReferenceProfile(user?.id);
  const kpiRight = (kpiId) => reference.kpiRights[kpiId] ?? null;                 // 'R' | 'S' | 'V' | null
  const canViewKpi = (kpiId) => kpiRight(kpiId) !== null;                          // R, S and V all read; blank hides
  const canContributeKpi = (kpiId) => kpiRight(kpiId) === 'S';                     // feeds data — nothing more
  const canValidateKpi = (kpiId) => kpiRight(kpiId) === 'R';                       // validates and reports — nothing more
  const alertRecipientCode = (ruleId) => reference.alertCodes[ruleId] ?? null;     // 'D' | 'I' | null
  const ruleIdOf = (alert) => alert?.ruleId ?? alert?.rule?.id ?? null;

  /**
   * May the persona SEE this rule alert? Order matters: project scope first (an alert on a project
   * outside the scope never appears, whatever the category), then D/I recipient, then the role's
   * alert view. A portfolio-wide alert (projectId 'PORTFOLIO') needs a portfolio-scope role.
   * `project` is the raw project of the alert (undefined for a portfolio alert).
   */
  const canViewRuleAlert = (alert, project) => {
    const ruleId = ruleIdOf(alert);
    if (!ruleId) return false;
    if (alert.projectId === 'PORTFOLIO') {
      if (config.scope !== 'portfolio') return false;
    } else if (!canViewProject(project)) return false;
    if (!alertRecipientCode(ruleId)) return false;
    return matchesAlertView({ severity: alertSeverityKey(alert.severity ?? alert.rule?.severity), category: alertViewKey(ruleId) }, config.alertView);
  };

  /**
   * May the persona move this rule alert to `state`? Only a designated recipient (D), holding the matching
   * role permission, for an alert it can see. I (informed) never acts. `project` as in canViewRuleAlert.
   */
  const canActOnRuleAlert = (alert, state, project) => {
    const ruleId = ruleIdOf(alert);
    if (!ruleId || alertRecipientCode(ruleId) !== 'D') return false;
    if (!canViewRuleAlert(alert, project)) return false;
    const mapped = { severity: alertSeverityKey(alert.severity ?? alert.rule?.severity), category: alertViewKey(ruleId) };
    return canActOnAlert(mapped, state, project);
  };

  const readOnly = {
    projects: !(can('project.update') || can('project.validate') || can('project.note')),
    alerts: !(can('alerts.acknowledge') || can('alerts.resolve') || can('alerts.dismiss'))
  };

  return Object.freeze({
    roleId: user?.id ?? null,
    config,
    landing: config.landing,
    scope: config.scope,
    accessLevel: config.accessLevel,
    isFallback: Boolean(config.isFallback),
    alertView: config.alertView ?? {},
    readOnly,
    reference,
    kpiRight,
    canViewKpi,
    canContributeKpi,
    canValidateKpi,
    alertRecipientCode,
    canViewRuleAlert,
    canActOnRuleAlert,
    /** Restricted financial information (amounts, payment gaps, financial KPIs). */
    canViewFinancials: () => can('finance.view'),
    can,
    isAssigned,
    canViewProject,
    canActOnProject,
    canActOnAlert,
    /** Projects the persona is allowed to see. */
    filterProjects: (projects) => projects.filter(canViewProject),
    /** Route-level guard. The sidebar is a convenience; this is the check the shell enforces. */
    canAccessRoute: (routeId) => allowedRoutes.has(routeId),
    navigation: config.nav,
    /** Role-specific label key for a route, falling back to the route's default label. */
    labelKeyFor: (routeId, defaultKey) => {
      for (const section of config.nav) {
        const item = section.items.find((entry) => entry.route === routeId);
        if (item) return item.labelKey ?? defaultKey;
      }
      return defaultKey;
    },
    dashboard: config.dashboard
  });
}
