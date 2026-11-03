import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useApp } from './AppContext.jsx';
import { projects as projectData } from '../data/projects.js';
import { createInitialWorkflow, nextStep } from '../data/projectWorkflow.js';
import { reconcileAlertInstances, transitionAlert, assignAlertOwnerAndDueDate } from '../alerts/lifecycle.js';

/*
 * Shared, in-memory DEMO state: what the personas change while the prototype is
 * open (alert states, milestone / deliverable progress, an activity log).
 *
 * Why it exists: before, each module kept its own copy, so an alert resolved in
 * the Alerts module still counted on the dashboard, and the PM's progress was
 * invisible to the MO. Keeping one copy above the persona switch means every
 * dashboard, badge and module reads the same state, whichever persona is active.
 *
 * Lifetime: mounted by <AuthenticatedApp>, so it survives a persona switch but is
 * discarded on sign-out. Nothing is persisted.
 *
 * Every action re-checks the role model (access.canActOn…) before it writes.
 * That is defence in depth inside the demo — it is still browser code and still
 * not real security (see src/roles/roleConfig.js).
 */

const DemoStateContext = createContext(null);

const projectById = new Map(projectData.map((project) => [project.id ?? project.code, project]));
const ALERT_ACTIVITY = { acknowledged: 'activity.alert.acknowledged', under_review: 'activity.alert.acknowledged', action_planned: 'activity.alert.acknowledged', resolved: 'activity.alert.resolved', dismissed: 'activity.alert.dismissed' };

export function DemoStateProvider({ children }) {
  const { access, user } = useApp();
  const [alertStates, setAlertStates] = useState({});
  const [alertRecords, setAlertRecords] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [workflow, setWorkflow] = useState(() => createInitialWorkflow(projectData));
  const [activityLog, setActivityLog] = useState([]);

  const log = useCallback((entry) => {
    setActivityLog((current) => [{ id: `LIVE-${Date.now()}-${current.length}`, actor: user.name, at: Date.now(), ...entry }, ...current].slice(0, 30));
  }, [user]);

  /** Move an alert to 'acknowledged' | 'resolved' | 'dismissed'. Returns true when applied. */
  const actOnAlert = useCallback((alert, state, note = '') => {
    const project = alert.projectId ? projectById.get(alert.projectId) ?? null : null;
    // One check: designated recipient (D) + role permission + alert view + project scope (access.js).
    if (!access.canActOnRuleAlert(alert, state, project)) return false;
    setAlertStates((current) => ({ ...current, [alert.id]: state }));
    if (alert.key && alertRecords[alert.key]) {
      setAlertRecords((current) => ({
        ...current,
        [alert.key]: transitionAlert(current[alert.key], state, user.name, note)
      }));
    }
    log({ actionKey: ALERT_ACTIVITY[state] ?? 'activity.alert.acknowledged', projectId: alert.projectId, type: state === 'resolved' ? 'Décision' : 'Mise à jour' });
    return true;
  }, [access, log, alertRecords, user.name]);

  const syncAlertEvaluations = useCallback((evaluations, rulesById) => {
    const reconciled = reconcileAlertInstances(alertRecords, evaluations, rulesById, 'TAQADDUM');
    const previousIds = new Set(Object.values(alertRecords).map((record) => record.id));
    const created = reconciled.active.filter((record) => !previousIds.has(record.id));
    setAlertRecords(reconciled.records);
    if (created.length) {
      setNotifications((current) => {
        const known = new Set(current.map((item) => item.id));
        const additions = created.filter((record) => !known.has(`NTF-${record.id}`)).map((record) => ({
          id: `NTF-${record.id}`, alertId: record.id, alertKey: record.key, ruleId: record.ruleId,
          title: record.title, projectId: record.projectId, createdAt: record.createdAt, read: false
        }));
        return [...additions, ...current];
      });
    }
  }, [alertRecords]);

  const updateAlertAssignment = useCallback((alert, assignedOwner, dueDate) => {
    const project = alert.projectId && alert.projectId !== 'PORTFOLIO' ? projectById.get(alert.projectId) ?? null : null;
    if (!access.canActOnRuleAlert(alert, 'action_planned', project) || !alert.key || !alertRecords[alert.key]) return false;
    setAlertRecords((current) => ({
      ...current,
      [alert.key]: assignAlertOwnerAndDueDate(current[alert.key], assignedOwner, dueDate, user.name)
    }));
    return true;
  }, [access, alertRecords, user.name]);

  const markNotificationRead = useCallback((notificationId) => {
    setNotifications((current) => current.map((item) => item.id === notificationId ? { ...item, read: true } : item));
  }, []);

  /**
   * Advance a milestone or deliverable one step. The step's permission decides who
   * may do it: project.update for the first step, project.validate for the last.
   * Returns { ok, reason?, step? }.
   */
  const advanceWorkflowItem = useCallback((projectId, kind, itemId) => {
    const project = projectById.get(projectId);
    const list = kind === 'milestone' ? 'milestones' : 'deliverables';
    const item = workflow[projectId]?.[list]?.find((entry) => entry.id === itemId);
    if (!project || !item) return { ok: false, reason: 'notFound' };
    const step = nextStep(kind, item.status);
    if (!step) return { ok: false, reason: 'final' };
    if (!access.canActOnProject(step.permission, project)) return { ok: false, reason: 'forbidden', step };
    setWorkflow((current) => ({
      ...current,
      [projectId]: { ...current[projectId], [list]: current[projectId][list].map((entry) => (entry.id === itemId ? { ...entry, status: step.to } : entry)) }
    }));
    log({ actionKey: step.permission === 'project.validate' ? 'activity.workflow.validated' : 'activity.workflow.updated', projectId, type: step.permission === 'project.validate' ? 'Approbation' : 'Jalon' });
    return { ok: true, step };
  }, [access, log, workflow]);

  const value = useMemo(() => ({
    alertStates, alertRecords, notifications, workflow, activityLog,
    actOnAlert, syncAlertEvaluations, markNotificationRead, updateAlertAssignment, advanceWorkflowItem
  }), [alertStates, alertRecords, notifications, workflow, activityLog, actOnAlert, syncAlertEvaluations, markNotificationRead, updateAlertAssignment, advanceWorkflowItem]);
  return <DemoStateContext.Provider value={value}>{children}</DemoStateContext.Provider>;
}

export function useDemoState() {
  const context = useContext(DemoStateContext);
  if (!context) throw new Error('useDemoState must be used inside DemoStateProvider');
  return context;
}
