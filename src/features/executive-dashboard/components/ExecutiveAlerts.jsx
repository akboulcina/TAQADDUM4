import { useApp } from '../../../context/AppContext.jsx';
import ChartCard from '../../../components/ChartCard.jsx';

// Generic alert list card. Defaults reproduce the original "Priority alerts" card.
export default function ExecutiveAlerts({ alerts, title, subtitle, emptyLabel, onViewAll, onOpenProject }) {
  const { t, fmt } = useApp();
  return (
    <ChartCard
      title={title ?? t('alerts.title')}
      subtitle={subtitle ?? t('alerts.subtitle')}
      action={onViewAll ? <button type="button" className="link-button" onClick={onViewAll}>{t('alerts.viewAll')}</button> : null}
    >
      {alerts.length === 0 ? <p className="table-empty">{emptyLabel ?? t('alerts.empty')}</p> : (
        <div className="alert-list">
          {alerts.map((alert) => {
            const projectId = alert.projectId ?? alert.project;
            return (
              <article key={alert.id} className={`alert-item ${alert.severity}`}>
                <span />
                <div>
                  <h3 className="alert-title">{alert.title}</h3>
                  <p className="alert-detail">{alert.detail}</p>
                  <div className="alert-meta">
                    <span className={`severity-tag ${alert.severity}`}>{t(`severity.${alert.severity}`)}</span>
                    {projectId ? (onOpenProject ? <button type="button" className="link-button" onClick={() => onOpenProject(projectId)}>{projectId}</button> : <span>{projectId}</span>) : null}
                    {alert.owner ? <span>{alert.owner}</span> : null}
                    <span>{fmt.date(alert.date)}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </ChartCard>
  );
}
