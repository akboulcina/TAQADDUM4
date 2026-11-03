import { useApp } from '../../../context/AppContext.jsx';
import ChartCard from '../../../components/ChartCard.jsx';
import { STATUS_RANK, daysUntil, isOverdue } from '../../../roles/portfolio.js';
import { DUE_SOON_DAYS } from '../../../roles/roleConfig.js';
import { Empty, OpenButton, Pill, Row } from './ui.jsx';

/** PMO: projects that need a follow-up, with the reason(s) why. */
export function CoordinationQueuePanel({ scope, nav }) {
  const { t, fmt } = useApp();
  const reportMissing = new Set(scope.allAlerts.filter((alert) => alert.category === 'reporting' && alert.active && alert.projectId !== 'PORTFOLIO').map((alert) => alert.projectId));

  const queue = scope.summary.active
    .map((project) => {
      const days = daysUntil(project.dueDate, scope.today);
      const reasons = [];
      if (isOverdue(project, scope.today)) reasons.push({ tone: 'danger', text: t('reason.overdue') });
      if (project.status === 'delayed') reasons.push({ tone: 'danger', text: t('status.delayed') });
      if (project.status === 'atRisk') reasons.push({ tone: 'warning', text: t('status.atRisk') });
      if (days != null && days >= 0 && days <= DUE_SOON_DAYS) reasons.push({ tone: 'warning', text: t('reason.dueIn', { n: days }) });
      if (reportMissing.has(project.id)) reasons.push({ tone: 'info', text: t('reason.reportMissing') });
      return { project, reasons };
    })
    .filter((entry) => entry.reasons.length)
    .sort((a, b) => STATUS_RANK[b.project.status] - STATUS_RANK[a.project.status] || b.reasons.length - a.reasons.length || String(a.project.dueDate).localeCompare(String(b.project.dueDate)))
    .slice(0, 6);

  return (
    <ChartCard title={t('panel.queue.title')} subtitle={t('panel.queue.subtitle')}>
      {queue.length === 0 ? <Empty>{t('panel.queue.empty')}</Empty> : (
        <div className="rd-list">
          {queue.map(({ project, reasons }) => (
            <Row
              key={project.id}
              title={project.name}
              meta={`${project.wilaya} · ${project.manager} · ${t('label.due')} ${fmt.date(project.dueDate)}`}
              aside={<>{reasons.slice(0, 2).map((reason) => <Pill key={reason.text} tone={reason.tone}>{reason.text}</Pill>)}<OpenButton onClick={() => nav.openProject(project.id)} /></>}
            />
          ))}
        </div>
      )}
    </ChartCard>
  );
}

/** PMO: how projects are spread across their responsible managers. */
export function WorkloadPanel({ scope }) {
  const { t } = useApp();
  const rows = [...scope.summary.byManager].sort((a, b) => b.risky - a.risky || b.active - a.active);
  return (
    <ChartCard title={t('panel.workload.title')} subtitle={t('panel.workload.subtitle')}>
      <div className="rd-bars">
        {rows.map((row) => (
          <div key={row.manager} className="rd-bar">
            <span className="rd-bar-label" title={row.manager}>{row.manager}</span>
            <div className="rd-bar-track"><i className={row.risky ? 'warning' : ''} style={{ width: `${row.progress}%` }} /></div>
            <strong className="rd-bar-value">{t('panel.workload.caption', { n: row.count, risky: row.risky })}</strong>
          </div>
        ))}
      </div>
      <p className="rd-hint">{t('panel.workload.hint')}</p>
    </ChartCard>
  );
}
