import { useApp } from '../../../context/AppContext.jsx';
import ChartCard from '../../../components/ChartCard.jsx';
import DataTable from '../../../components/DataTable.jsx';
import StatusBadge from '../../../components/StatusBadge.jsx';
import ProgressBar from '../../../components/ProgressBar.jsx';
import { STATUS_RANK, daysUntil } from '../../../roles/portfolio.js';
import { Empty, Row, Pill } from './ui.jsx';

/** Projects in the persona's scope, most urgent first. */
export function ProjectListPanel({ scope, nav, props }) {
  const { t, fmt } = useApp();
  const rows = [...scope.summary.projects].sort((a, b) => STATUS_RANK[b.status] - STATUS_RANK[a.status] || String(a.dueDate ?? '').localeCompare(String(b.dueDate ?? '')));
  const columns = [
    { key: 'name', label: t('table.project'), render: (row) => <div className="project-cell"><strong>{row.name}</strong><span>{row.id} · {row.wilaya}</span></div> },
    { key: 'status', label: t('table.status'), render: (row) => <StatusBadge status={row.status} label={t(`status.${row.status}`)} /> },
    { key: 'progress', label: t('table.progress'), render: (row) => <div style={{ display: 'grid', gap: 5, minWidth: 110 }}><ProgressBar value={row.progress} tone={row.status} /><span>{row.progress}%</span></div> },
    { key: 'dueDate', label: t('table.due'), render: (row) => fmt.date(row.dueDate) },
    { key: 'open', label: '', render: (row) => <button type="button" className="rd-button ghost" onClick={() => nav.openProject(row.id)}>{t('action.open')}</button> }
  ];
  return (
    <ChartCard title={t(props.titleKey)} subtitle={props.subtitleKey ? t(props.subtitleKey) : undefined}>
      <DataTable columns={columns} rows={rows} emptyLabel={t('table.empty')} />
    </ChartCard>
  );
}

/** Recent activity limited to the persona's projects (live actions first, then the seeded feed). */
export function ActivityPanel({ scope, nav, props }) {
  const { t, fmt } = useApp();
  const rows = scope.activity.slice(0, 5);
  const projectName = (id) => scope.allProjectsById.get(id)?.name;
  return (
    <ChartCard title={t(props.titleKey)} subtitle={t('panel.activity.subtitle')}>
      {rows.length === 0 ? <Empty>{t('panel.activity.empty')}</Empty> : (
        <div className="rd-list">
          {rows.map((entry) => (
            <Row
              key={entry.id}
              title={<>{entry.actor} <span className="rd-inline">{entry.action}</span></>}
              meta={`${fmt.date(entry.time)}${entry.projectId ? ` · ${projectName(entry.projectId) ?? entry.projectId}` : ''}`}
              aside={entry.live ? <Pill tone="success">{t('panel.activity.live')}</Pill> : entry.projectId && scope.projectIds.has(entry.projectId) ? <button type="button" className="rd-button ghost" onClick={() => nav.openProject(entry.projectId)}>{t('action.open')}</button> : null}
            />
          ))}
        </div>
      )}
    </ChartCard>
  );
}

export const dueLabel = (t, project, today) => {
  const days = daysUntil(project.dueDate, today);
  if (days == null) return null;
  if (days < 0) return { tone: 'danger', text: t('reason.lateBy', { n: -days }) };
  if (days === 0) return { tone: 'danger', text: t('kpi.note.today') };
  return { tone: days <= 30 ? 'warning' : 'neutral', text: t('reason.dueIn', { n: days }) };
};
