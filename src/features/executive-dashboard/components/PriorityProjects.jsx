import { useApp } from '../../../context/AppContext.jsx';
import ChartCard from '../../../components/ChartCard.jsx';
import DataTable from '../../../components/DataTable.jsx';
import StatusBadge from '../../../components/StatusBadge.jsx';
import ProgressBar from '../../../components/ProgressBar.jsx';

export default function PriorityProjects({ projects, onOpenProject }) {
  const { t, fmt, formatDZD } = useApp();
  const rows = projects.filter((project) => project.status !== 'completed').sort((a, b) => a.progress - b.progress).slice(0, 5);
  const columns = [
    { key: 'name', label: t('table.project'), render: (row) => <div className="project-cell"><strong>{row.name}</strong><span>{row.id}</span></div> },
    { key: 'wilaya', label: t('table.wilaya') },
    { key: 'sector', label: t('table.sector') },
    { key: 'budget', label: t('table.budget'), render: (row) => formatDZD(row.budget) },
    { key: 'progress', label: t('table.progress'), render: (row) => <div style={{ display: 'grid', gap: 5, minWidth: 130 }}><ProgressBar value={row.progress} tone={row.status} /><span>{row.progress}%</span></div> },
    { key: 'status', label: t('table.status'), render: (row) => <StatusBadge status={row.status} label={t(`status.${row.status}`)} /> },
    { key: 'dueDate', label: t('table.due'), render: (row) => fmt.date(row.dueDate) },
    ...(onOpenProject ? [{ key: 'open', label: '', render: (row) => <button type="button" className="link-button" onClick={() => onOpenProject(row.id)}>{t('action.open')}</button> }] : [])
  ];
  return <ChartCard title={t('chart.projects')} subtitle={t('chart.projectsSub')}><DataTable columns={columns} rows={rows} emptyLabel={t('table.empty')} /></ChartCard>;
}
