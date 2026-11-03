import { useApp } from '../../../context/AppContext.jsx';
import ChartCard from '../../../components/ChartCard.jsx';
import { countByStatus } from '../../../data/projects.js';

const colors = { onTrack: '#12805C', atRisk: '#D97706', delayed: '#B42318', completed: '#4B5565' };

export default function PortfolioHealth({ projects }) {
  const { t } = useApp();
  const data = countByStatus(projects);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const safeTotal = Math.max(1, total);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <ChartCard title={t('chart.health')} subtitle={t('chart.healthSub')}>
      <div className="donut-wrap">
        <svg viewBox="0 0 180 180" width="190" height="190" role="img" aria-label={t('chart.health')}>
          <g transform="translate(90 90) rotate(-90)">
            {data.map((item) => {
              const fraction = item.value / safeTotal;
              const dash = fraction * circumference;
              const circle = <circle key={item.status} r={radius} fill="none" stroke={colors[item.status]} strokeWidth="20" strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offset} />;
              offset += dash;
              return circle;
            })}
          </g>
          <text x="90" y="86" textAnchor="middle" className="donut-center">{total}</text>
          <text x="90" y="105" textAnchor="middle" className="donut-caption">{t('unit.projects')}</text>
        </svg>
        <div className="chart-legend" style={{ flexDirection: 'column', alignItems: 'flex-start', marginTop: 0 }}>
          {data.map((item) => (
            <div key={item.status} className="legend-item">
              <span className="legend-swatch" style={{ background: colors[item.status] }} />
              <span>{t(`status.${item.status}`)}</span>
              <strong style={{ marginInlineStart: 'auto' }}>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
