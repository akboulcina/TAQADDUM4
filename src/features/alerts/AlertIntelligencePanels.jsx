import { useMemo } from 'react';
import { ACTIVE_ALERT_STATUSES } from '../../alerts/lifecycle.js';
import './AlertIntelligence.css';

const DAY = 86400000;
const bucketFor = (days) => days <= 7 ? '0-7' : days <= 14 ? '8-14' : days <= 30 ? '15-30' : '30+';

export default function AlertIntelligencePanels({ alerts = [], projects = [], evaluations = [] }) {
  const projectById = useMemo(() => new Map(projects.map((project) => [project.id ?? project.code, project])), [projects]);
  const today = Date.now();
  const active = useMemo(() => alerts.filter((alert) => ACTIVE_ALERT_STATUSES.includes(alert.state)), [alerts]);

  const aging = useMemo(() => {
    const buckets = { '0-7': 0, '8-14': 0, '15-30': 0, '30+': 0 };
    active.forEach((alert) => {
      const days = Math.floor((today - new Date(alert.createdAt).getTime()) / DAY);
      buckets[bucketFor(days)] += 1;
    });
    return buckets;
  }, [active, today]);

  const dueSoon = useMemo(() => active.filter((alert) => {
    if (!alert.dueDate) return false;
    const due = new Date(alert.dueDate).getTime();
    return due >= today && due - today <= 7 * DAY;
  }), [active, today]);

  const groupBy = (key) => active.reduce((groups, alert) => {
    const value = key(alert) ?? '—';
    groups[value] = (groups[value] ?? 0) + 1;
    return groups;
  }, {});

  const byRule = useMemo(() => groupBy((alert) => alert.rule?.id), [active]);
  const byProject = useMemo(() => groupBy((alert) => alert.projectId), [active]);
  const byWilaya = useMemo(() => groupBy((alert) => projectById.get(alert.projectId)?.wilaya?.name ?? projectById.get(alert.projectId)?.wilaya ?? '—'), [active, projectById]);
  const byOwner = useMemo(() => groupBy((alert) => alert.assignedOwner || 'Non affecté'), [active]);

  const transitions = useMemo(() => alerts.flatMap((alert) => (alert.auditHistory ?? []).map((entry) => `${entry.from ?? '—'} → ${entry.to}`)).reduce((groups, transition) => {
    groups[transition] = (groups[transition] ?? 0) + 1;
    return groups;
  }, {}), [alerts]);

  const resolved = useMemo(() => alerts.filter((alert) => alert.state === 'resolved' && alert.auditHistory?.some((entry) => entry.to === 'resolved')), [alerts]);
  const resolutionPerformance = useMemo(() => {
    if (!resolved.length) return null;
    const durations = resolved.map((alert) => {
      const resolvedEntry = [...(alert.auditHistory ?? [])].reverse().find((entry) => entry.to === 'resolved');
      return resolvedEntry ? (new Date(resolvedEntry.at).getTime() - new Date(alert.createdAt).getTime()) / DAY : null;
    }).filter((value) => value !== null && value >= 0);
    return durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length : null;
  }, [resolved]);

  const renderGroups = (groups) => (
    <div className="kpi-intel-table-wrap">
      <table className="kpi-intel-table">
        <thead><tr><th>Regroupement</th><th>Alertes actives</th></tr></thead>
        <tbody>
          {Object.entries(groups).map(([key, count]) => <tr key={key}><th scope="row">{key}</th><td>{count}</td></tr>)}
        </tbody>
      </table>
    </div>
  );

  return (
    <section className="alert-intelligence">
      <h3>Intelligence des alertes</h3>
      <div className="alert-intel-grid">
        <article><h4>Vieillissement des alertes ouvertes</h4>{renderGroups(aging)}</article>
        <article><h4>Par règle</h4>{renderGroups(byRule)}</article>
        <article><h4>Par projet</h4>{renderGroups(byProject)}</article>
        <article><h4>Par wilaya</h4>{renderGroups(byWilaya)}</article>
        <article><h4>Par responsable</h4>{renderGroups(byOwner)}</article>
        <article><h4>Échéances sous 7 jours</h4><p className="kpi-intel-empty">{dueSoon.length ? `${dueSoon.length} alerte(s) à échéance proche.` : 'Aucune alerte à échéance proche.'}</p></article>
        <article><h4>Transitions de statut</h4>{renderGroups(transitions)}</article>
        <article><h4>Performance de résolution</h4><p className="kpi-intel-empty">{resolutionPerformance === null ? 'Analyse non disponible : historique de résolution insuffisant.' : `Délai moyen de résolution : ${resolutionPerformance.toFixed(1)} jours (${resolved.length} alerte(s)).`}</p></article>
      </div>
      <p className="kpi-intel-empty">{evaluations.length} évaluation(s) de règles dans le périmètre autorisé.</p>
    </section>
  );
}
