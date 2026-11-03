import { useApp } from '../../../context/AppContext.jsx';
import ChartCard from '../../../components/ChartCard.jsx';
import ProgressBar from '../../../components/ProgressBar.jsx';

const pointColors = { onTrack: '#12805C', atRisk: '#D97706', delayed: '#B42318', completed: '#4B5565' };

// `sites` come from deriveSites(): coordinates + progress/status derived from the projects in scope.
export default function AlgeriaMapPreview({ sites = [], limit = 5, onOpenMap, onSelectWilaya }) {
  const { t } = useApp();
  return (
    <ChartCard
      title={t('chart.map')}
      subtitle={t('chart.mapSub')}
      action={onOpenMap ? <button type="button" className="link-button" onClick={onOpenMap}>{t('action.openMap')}</button> : null}
    >
      <div className="map-layout">
        <svg className="algeria-map" viewBox="0 0 620 300" role="img" aria-label={t('chart.map')}>
          <path className="algeria-shape" d="M60 150 L92 92 L152 56 L232 40 L332 34 L432 44 L522 68 L562 108 L542 158 L482 198 L402 228 L322 248 L242 252 L162 238 L102 208 Z" />
          {sites.map((site) => (
            <g key={site.wilaya} className="map-point" tabIndex={0} role="button" aria-label={`${site.wilaya} — ${site.progress}%`} onClick={() => onSelectWilaya?.(site.wilaya)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelectWilaya?.(site.wilaya); }}>
              <circle cx={site.x} cy={site.y} r="7" fill={pointColors[site.status]} />
              <text x={site.x + 11} y={site.y + 4}>{site.wilaya}</text>
            </g>
          ))}
        </svg>
        <div className="map-list">
          {sites.slice(0, limit).map((site) => (
            <div key={site.wilaya} className="map-list-item">
              <span>{site.wilaya}</span>
              <ProgressBar value={site.progress} tone={site.status} />
              <strong>{site.progress}%</strong>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
