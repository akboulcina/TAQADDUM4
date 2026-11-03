import { useApp } from '../../../context/AppContext.jsx';
import ChartCard from '../../../components/ChartCard.jsx';
import StatusBadge from '../../../components/StatusBadge.jsx';
import { STATUS_RANK } from '../../../roles/portfolio.js';
import { Empty, OpenButton, Row } from './ui.jsx';

const BAR_TONE = { onTrack: 'success', atRisk: 'warning', delayed: 'danger', completed: 'neutral' };

/** Territorial: progress of every wilaya, weakest first. */
export function WilayaRankingPanel({ scope }) {
  const { t } = useApp();
  const rows = [...scope.summary.byWilaya].sort((a, b) => a.progress - b.progress);
  return (
    <ChartCard title={t('panel.ranking.title')} subtitle={t('panel.ranking.subtitle')}>
      <div className="rd-bars">
        {rows.map((row) => (
          <div key={row.wilaya} className="rd-bar">
            <span className="rd-bar-label">{row.wilaya}</span>
            <div className="rd-bar-track"><i className={BAR_TONE[row.status]} style={{ width: `${row.progress}%` }} /></div>
            <strong className="rd-bar-value">{Math.round(row.progress)}%</strong>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

/** Territorial: wilayas where a field check is warranted (delayed or at-risk projects). */
export function FieldAttentionPanel({ scope, nav }) {
  const { t, fmt, access } = useApp();
  const mapAllowed = access.canAccessRoute('map');
  const rows = scope.summary.byWilaya
    .filter((row) => row.status === 'delayed' || row.status === 'atRisk')
    .sort((a, b) => STATUS_RANK[b.status] - STATUS_RANK[a.status] || a.progress - b.progress);

  return (
    <ChartCard title={t('panel.attention.title')} subtitle={t('panel.attention.subtitle')}>
      {rows.length === 0 ? <Empty>{t('panel.attention.empty')}</Empty> : (
        <div className="rd-list">
          {rows.map((row) => {
            const worst = row.projects.find((project) => project.status === row.status) ?? row.projects[0];
            return (
              <Row
                key={row.wilaya}
                title={`${row.wilaya} — ${worst.name}`}
                meta={`${worst.manager} · ${t('label.due')} ${fmt.date(worst.dueDate)} · ${Math.round(row.progress)}%`}
                aside={<>
                  <StatusBadge status={row.status} label={t(`status.${row.status}`)} />
                  {mapAllowed ? <button type="button" className="rd-button ghost" onClick={() => nav.openWilaya(row.wilaya)}>{t('action.viewOnMap')}</button> : null}
                  <OpenButton onClick={() => nav.openProject(worst.id)} />
                </>}
              />
            );
          })}
        </div>
      )}
    </ChartCard>
  );
}
