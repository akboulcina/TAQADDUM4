import { useApp } from '../../../context/AppContext.jsx';
import ChartCard from '../../../components/ChartCard.jsx';
import { budgetBySector } from '../../../data/projects.js';

export default function BudgetPerformance({ projects }) {
  const { t, fmt } = useApp();
  const data = budgetBySector(projects);
  const max = Math.max(1, ...data.map((item) => item.committed));
  return (
    <ChartCard title={t('chart.budget')} subtitle={t('chart.budgetSub')}>
      <div className="bars">
        {data.map((item) => (
          <div key={item.sector} className="bar-row">
            <span className="bar-label" title={item.sector}>{item.sector}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(item.committed / max) * 100}%` }} />
              <div className="bar-fill secondary" style={{ width: `${(item.paid / max) * 100}%`, marginTop: '-22px' }} />
            </div>
            <span className="bar-value">{fmt.billions(item.committed)}</span>
          </div>
        ))}
      </div>
      <div className="chart-legend">
        <div className="legend-item"><span className="legend-swatch" style={{ background: 'var(--brand-500)' }} />{t('kpi.budget')}</div>
        <div className="legend-item"><span className="legend-swatch" style={{ background: '#9dc3f7' }} />{t('kpi.payments')}</div>
      </div>
    </ChartCard>
  );
}
