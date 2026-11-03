import { useApp } from '../../../context/AppContext.jsx';
import ChartCard from '../../../components/ChartCard.jsx';
import DataTable from '../../../components/DataTable.jsx';
import ProgressBar from '../../../components/ProgressBar.jsx';
import { FINANCIAL_GAP_THRESHOLD, needsFinancialReview, projectFinance } from '../../../roles/portfolio.js';
import { Empty, OpenButton, Pill, Row } from './ui.jsx';

/** Finance: projects ranked by the distance between what was paid and what was physically done. */
export function FinancialReviewPanel({ scope, nav }) {
  const { t, fmt } = useApp();
  const rows = scope.summary.active
    .map((project) => ({ project, finance: projectFinance(project) }))
    .sort((a, b) => Math.abs(b.finance.gap) - Math.abs(a.finance.gap))
    .slice(0, 5);

  return (
    <ChartCard title={t('panel.review.title')} subtitle={t('panel.review.subtitle', { n: FINANCIAL_GAP_THRESHOLD })}>
      {rows.length === 0 ? <Empty>{t('panel.review.empty')}</Empty> : (
        <div className="rd-list">
          {rows.map(({ project, finance }) => {
            const flagged = needsFinancialReview(project);
            const text = finance.overPaid ? t('reason.overPaid') : finance.gap <= -FINANCIAL_GAP_THRESHOLD ? t('reason.paymentsBehind') : finance.gap >= FINANCIAL_GAP_THRESHOLD ? t('reason.paymentsAhead') : t('reason.withinRange');
            return (
              <Row
                key={project.id}
                title={project.name}
                meta={t('panel.review.line', { paid: fmt.percent(finance.consumption, 0), progress: fmt.percent(project.progress, 0) })}
                aside={<><Pill tone={flagged ? 'warning' : 'neutral'}>{`${fmt.points(finance.gap, 0)} · ${text}`}</Pill><OpenButton onClick={() => nav.openProject(project.id)} /></>}
              />
            );
          })}
        </div>
      )}
    </ChartCard>
  );
}

/** Finance: budget → commitments → payments for every project in scope. */
export function ProjectFinancePanel({ scope, nav }) {
  const { t, fmt } = useApp();
  const rows = scope.summary.projects.map((project) => ({ id: project.id, project, finance: projectFinance(project) }));
  const columns = [
    { key: 'name', label: t('table.project'), render: (row) => <div className="project-cell"><strong>{row.project.name}</strong><span>{row.project.id}</span></div> },
    { key: 'budget', label: t('table.budget'), render: (row) => fmt.billions(row.finance.budget, 2) },
    { key: 'committed', label: t('label.committed'), render: (row) => <div className="rd-stack"><span>{fmt.billions(row.finance.committed, 2)}</span><small>{fmt.percent(row.finance.engagementRate, 0)} {t('label.ofBudget')}</small></div> },
    { key: 'paid', label: t('label.paid'), render: (row) => <div className="rd-stack"><span>{fmt.billions(row.finance.paid, 2)}</span><small>{fmt.percent(row.finance.disbursementRate, 0)} {t('label.ofCommitted')}</small></div> },
    { key: 'outstanding', label: t('label.outstanding'), render: (row) => fmt.billions(row.finance.outstanding, 2) },
    { key: 'gap', label: t('label.gap'), render: (row) => <div style={{ display: 'grid', gap: 5, minWidth: 110 }}><ProgressBar value={row.finance.consumption} tone={needsFinancialReview(row.project) ? 'warning' : 'brand'} /><span>{fmt.points(row.finance.gap, 0)}</span></div> },
    { key: 'open', label: '', render: (row) => <OpenButton onClick={() => nav.openProject(row.project.id)} /> }
  ];
  return (
    <ChartCard title={t('panel.finance.title')} subtitle={t('panel.finance.subtitle')}>
      <DataTable columns={columns} rows={rows} emptyLabel={t('table.empty')} />
    </ChartCard>
  );
}
