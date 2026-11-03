import { TREND_REQUIRED_SOURCE } from './kpiIntelligence.js';
import './KpiIntelligence.css';

export default function KpiTrendPanel({ kpi, result, history = [] }) {
  if (!Array.isArray(history) || history.length < 2) {
    return (
      <section className="kpr-section kpi-trend">
        <h4>Tendance</h4>
        <p className="kpr-note">Analyse de tendance non disponible : historique des valeurs KPI requis.</p>
        <p className="kpr-note">Source requise : <code>{TREND_REQUIRED_SOURCE}</code></p>
      </section>
    );
  }

  const current = history[history.length - 1];
  const previous = history[history.length - 2];
  const change = Number(current.value) - Number(previous.value);
  const direction = change > 0 ? 'hausse' : change < 0 ? 'baisse' : 'stable';
  const breached = current.status === 'red' || current.status === 'orange';

  return (
    <section className="kpr-section kpi-trend">
      <h4>Tendance</h4>
      <dl className="kpr-facts">
        <div><dt>Période actuelle</dt><dd>{current.period_start} → {current.period_end}</dd></div>
        <div><dt>Période précédente</dt><dd>{previous.period_start} → {previous.period_end}</dd></div>
        <div><dt>Valeur actuelle</dt><dd>{current.value} {kpi.unit}</dd></div>
        <div><dt>Valeur précédente</dt><dd>{previous.value} {kpi.unit}</dd></div>
        <div><dt>Changement</dt><dd>{change} {kpi.unit}</dd></div>
        <div><dt>Direction</dt><dd>{direction}</dd></div>
        <div><dt>Seuil</dt><dd>{breached ? 'Seuil orange ou rouge atteint' : 'Aucun dépassement orange/rouge'}</dd></div>
      </dl>
      {result?.status && <p className="kpr-note">Statut actuel : {result.status}.</p>}
    </section>
  );
}
