import { useApp } from '../../../context/AppContext.jsx';
import { useDemoState } from '../../../context/DemoStateContext.jsx';
import ChartCard from '../../../components/ChartCard.jsx';
import ProgressBar from '../../../components/ProgressBar.jsx';
import StatusBadge from '../../../components/StatusBadge.jsx';
import { WORKFLOW_STATUS_KEY, nextStep } from '../../../data/projectWorkflow.js';
import { SEVERITY_RANK, daysUntil, projectFinance } from '../../../roles/portfolio.js';
import { DemoTag, Empty, Notice, OpenButton, Pill, Row, SEVERITY_TONE, useNotice } from './ui.jsx';

/** Chef de Projet: the project that needs attention first, and why. */
export function FocusProjectPanel({ scope, nav }) {
  const { t, fmt, access } = useApp();
  const project = scope.focusProject;
  if (!project) return <ChartCard title={t('panel.focus.title')}><Empty>{t('panel.focus.empty')}</Empty></ChartCard>;

  const days = daysUntil(project.dueDate, scope.today);
  const finance = projectFinance(project);
  const why = project.status === 'delayed' ? t('panel.focus.whyDelayed') : project.status === 'atRisk' ? t('panel.focus.whyAtRisk') : t('panel.focus.whyNext');

  return (
    <ChartCard title={t('panel.focus.title')} subtitle={t('panel.focus.subtitle')} action={<StatusBadge status={project.status} label={t(`status.${project.status}`)} />}>
      <h3 className="rd-focus-name">{project.name}</h3>
      <p className="rd-hint">{project.id} · {project.wilaya} · {project.sector}</p>
      <div className="rd-focus-progress"><ProgressBar value={project.progress} tone={project.status} /><strong>{project.progress}%</strong></div>
      <dl className="rd-kv">
        <div><dt>{t('table.due')}</dt><dd>{fmt.date(project.dueDate)}{days != null ? <Pill tone={days < 0 ? 'danger' : days <= 7 ? 'danger' : days <= 30 ? 'warning' : 'neutral'}>{days < 0 ? t('reason.lateBy', { n: -days }) : days === 0 ? t('kpi.note.today') : t('reason.dueIn', { n: days })}</Pill> : null}</dd></div>
        {access.canViewFinancials() ? <div><dt>{t('label.paid')}</dt><dd>{fmt.percent(finance.consumption, 0)} {t('label.ofBudget')}</dd></div> : null}
        <div><dt>{t('label.priority')}</dt><dd>{t(`priority.${project.priority}`)}</dd></div>
      </dl>
      <p className="rd-why">{why}</p>
      <button type="button" className="rd-button primary" onClick={() => nav.openProject(project.id)}>{t('action.openProjectSheet')}</button>
    </ChartCard>
  );
}

/** Chef de Projet: milestones and deliverables of the focus project, with the PM's own action. */
export function WorkflowBoardPanel({ scope, nav }) {
  const { t, fmt, access } = useApp();
  const { workflow, advanceWorkflowItem } = useDemoState();
  const [notice, announce] = useNotice();
  const project = scope.focusProject;
  const state = project ? workflow[project.id] : null;

  if (!project || !state) return <ChartCard title={t('panel.board.title')}><Empty>{t('panel.focus.empty')}</Empty></ChartCard>;

  const advance = (kind, item) => {
    const result = advanceWorkflowItem(project.id, kind, item.id);
    announce(result.ok ? t('notice.updated', { item: item.title }) : t('notice.forbidden'));
  };

  const renderItem = (kind, item) => {
    const step = nextStep(kind, item.status);
    const allowed = step ? access.canActOnProject(step.permission, project) : false;
    const done = !step;
    const waiting = step && !allowed && step.permission === 'project.validate';
    return (
      <Row
        key={item.id}
        title={item.title}
        meta={kind === 'milestone' ? fmt.date(item.date) : t(`kind.${kind}`)}
        aside={<>
          <Pill tone={done ? 'success' : waiting ? 'warning' : 'neutral'}>{t(`wf.${WORKFLOW_STATUS_KEY[item.status]}`)}</Pill>
          {allowed ? <button type="button" className="rd-button primary" onClick={() => advance(kind, item)}>{t(step.permission === 'project.validate' ? 'action.validate' : 'action.start')}</button> : null}
        </>}
      />
    );
  };

  return (
    <ChartCard title={t('panel.board.title')} subtitle={`${project.name}`} action={<><DemoTag /><OpenButton onClick={() => nav.openProject(project.id)} label={t('action.openProjectSheet')} /></>}>
      <Notice>{notice}</Notice>
      <div className="rd-columns">
        <div>
          <h4 className="rd-subtitle">{t('panel.board.milestones')}</h4>
          <div className="rd-list">{state.milestones.map((item) => renderItem('milestone', item))}</div>
        </div>
        <div>
          <h4 className="rd-subtitle">{t('panel.board.deliverables')}</h4>
          <div className="rd-list">{state.deliverables.map((item) => renderItem('deliverable', item))}</div>
        </div>
      </div>
    </ChartCard>
  );
}

/** Chef de Projet: what to do today — due dates, alerts to take in charge, items to start. */
export function DailyActionsPanel({ scope, nav }) {
  const { t, access } = useApp();
  const { advanceWorkflowItem, actOnAlert } = useDemoState();
  const [notice, announce] = useNotice();

  const rows = [];
  scope.summary.active.forEach((project) => {
    const days = daysUntil(project.dueDate, scope.today);
    if (days != null && days <= 7) rows.push({ key: `due-${project.id}`, rank: 3000 - days, kind: 'due', tone: 'danger', title: project.name, meta: days < 0 ? t('reason.lateBy', { n: -days }) : days === 0 ? t('kpi.note.today') : t('reason.dueIn', { n: days }), action: { label: t('action.open'), run: () => nav.openProject(project.id) } });
  });
  scope.openAlerts.forEach((alert) => {
    const project = scope.allProjectsById.get(alert.projectId);
    const can = access.canActOnRuleAlert(alert, 'acknowledged', project);
    rows.push({ key: `alert-${alert.id}`, rank: 2000 + (SEVERITY_RANK[alert.severity] ?? 0), kind: 'alert', tone: SEVERITY_TONE[alert.severity], title: alert.title, meta: `${alert.projectId ?? ''} · ${t(`severity.${alert.severity}`)}`, action: can ? { label: t('action.acknowledge'), run: () => announce(actOnAlert(alert, 'acknowledged') ? t('notice.acknowledged') : t('notice.forbidden')) } : null });
  });
  scope.workflow.toAdvance.forEach((entry) => {
    const can = access.canActOnProject('project.update', entry.project);
    rows.push({ key: entry.key, rank: 1000, kind: 'item', tone: 'info', title: entry.item.title, meta: `${entry.project.name} · ${t(`kind.${entry.kind}`)}`, action: can ? { label: t('action.start'), run: () => { const result = advanceWorkflowItem(entry.projectId, entry.kind, entry.item.id); announce(result.ok ? t('notice.updated', { item: entry.item.title }) : t('notice.forbidden')); } } : null });
  });
  rows.sort((a, b) => b.rank - a.rank);

  return (
    <ChartCard title={t('panel.daily.title')} subtitle={t('panel.daily.subtitle')}>
      <Notice>{notice}</Notice>
      {rows.length === 0 ? <Empty>{t('panel.daily.empty')}</Empty> : (
        <div className="rd-list">
          {rows.slice(0, 6).map((row) => (
            <Row key={row.key} title={row.title} meta={row.meta} aside={<><Pill tone={row.tone}>{t(`kind.${row.kind}`)}</Pill>{row.action ? <button type="button" className="rd-button ghost" onClick={row.action.run}>{row.action.label}</button> : null}</>} />
          ))}
        </div>
      )}
    </ChartCard>
  );
}

