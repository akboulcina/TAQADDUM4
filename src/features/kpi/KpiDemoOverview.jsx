import { useMemo, useState } from 'react';
import { isOverdue } from '../../roles/portfolio.js';
import './KpiModule.css';

const STATUS_COLORS = { onTrack: '#12805C', atRisk: '#D97706', delayed: '#B42318', completed: '#4B5565' };
const STATUS_LABELS = { onTrack: 'En bonne voie', atRisk: 'À risque', delayed: 'En retard', completed: 'Achevé' };

const number = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

function normalize(project) {
  if (!project) return null;
  return {
    id: project.id ?? project.code ?? project.name,
    name: project.name ?? project.title ?? 'Projet',
    wilaya: project.wilaya ?? 'Non renseignée',
    sector: project.sector ?? 'Non renseigné',
    status: project.status ?? 'onTrack',
    progress: number(project.progress) ?? 0,
    budget: number(project.budget),
    committed: number(project.committed) ?? number(project.budget),
    paid: number(project.paid) ?? 0,
    dueDate: project.dueDate ?? null
  };
}

const formatDZD = (value) => value == null ? '—' : new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(value);
const formatBillion = (value) => value == null ? '—' : `${(value / 1_000_000_000).toLocaleString('fr-DZ', { maximumFractionDigits: 1 })} Mds DZD`;

export function KpiDemoOverview({ projects = [], kpis = [], user, financial = true }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [sortKey, setSortKey] = useState('progress');

  const data = useMemo(() => projects.map(normalize).filter(Boolean), [projects]);
  const filtered = useMemo(() => data.filter((project) =>
    (statusFilter === 'all' || project.status === statusFilter) &&
    (sectorFilter === 'all' || project.sector === sectorFilter)
  ), [data, statusFilter, sectorFilter]);

  const totals = useMemo(() => {
    const committed = filtered.reduce((sum, item) => sum + (item.committed ?? 0), 0);
    const paid = filtered.reduce((sum, item) => sum + item.paid, 0);
    const completed = filtered.filter((item) => item.status === 'completed').length;
    const overdue = filtered.filter((item) => isOverdue(item)).length;
    return {
      count: filtered.length,
      progress: filtered.length ? filtered.reduce((sum, item) => sum + item.progress, 0) / filtered.length : 0,
      completed,
      completionRate: filtered.length ? (completed / filtered.length) * 100 : 0,
      committed,
      paid,
      paymentRate: committed ? (paid / committed) * 100 : 0,
      overdue,
      schedulePerformance: filtered.length ? Math.max(0, 100 - (overdue / filtered.length) * 100) : 100
    };
  }, [filtered]);

  const statusDistribution = useMemo(() => {
    const base = { onTrack: 0, atRisk: 0, delayed: 0, completed: 0 };
    filtered.forEach((project) => { base[project.status] = (base[project.status] ?? 0) + 1; });
    return Object.entries(base);
  }, [filtered]);

  const sectorComparison = useMemo(() => {
    const map = new Map();
    filtered.forEach((project) => {
      const current = map.get(project.sector) ?? { committed: 0, paid: 0, progress: 0, count: 0 };
      current.committed += project.committed ?? 0;
      current.paid += project.paid;
      current.progress += project.progress;
      current.count += 1;
      map.set(project.sector, current);
    });
    return [...map.entries()].map(([sector, value]) => ({ sector, ...value, progress: value.progress / value.count }));
  }, [filtered]);

  const territorialComparison = useMemo(() => {
    const map = new Map();
    filtered.forEach((project) => {
      const current = map.get(project.wilaya) ?? { progress: 0, count: 0, risk: 0 };
      current.progress += project.progress;
      current.count += 1;
      if (project.status === 'atRisk' || project.status === 'delayed') current.risk += 1;
      map.set(project.wilaya, current);
    });
    return [...map.entries()].map(([wilaya, value]) => ({ wilaya, progress: value.progress / value.count, count: value.count, risk: value.risk }));
  }, [filtered]);

  const sectors = useMemo(() => [...new Set(data.map((project) => project.sector))].sort(), [data]);
  const maxSectorBudget = Math.max(1, ...sectorComparison.map((item) => item.committed));
  const sortedRows = [...filtered].sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0));

  const donutRadius = 58;
  const circumference = 2 * Math.PI * donutRadius;
  let offset = 0;

  return (
    <section className="kpi-module" aria-label="KPI et performance">
      <header className="kpi-header">
        <div>
          <p className="kpi-brand">TAQADDUM</p>
          <h2>KPI & Performance</h2>
          <p>Analyse consolidée du portefeuille — {user?.name ?? 'Utilisateur de démonstration'}.</p>
        </div>
        <span className="kpi-demo-badge">Valeurs dérivées des données de démonstration</span>
      </header>

      <div className="kpi-filters">
        <label>Statut<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Tous</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>
        <label>Secteur<select value={sectorFilter} onChange={(event) => setSectorFilter(event.target.value)}>
          <option value="all">Tous</option>
          {sectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
        </select></label>
        <span className="kpi-filter-count">{filtered.length} projet(s)</span>
      </div>

      <div className="kpi-cards">
        <article><span>Avancement moyen</span><strong>{totals.progress.toFixed(1)}%</strong><small>{totals.count} projets</small></article>
        <article><span>Taux d’achèvement</span><strong>{totals.completionRate.toFixed(1)}%</strong><small>{totals.completed} projet(s) achevé(s)</small></article>
        {financial ? <article><span>Budget engagé</span><strong>{formatBillion(totals.committed)}</strong><small>Engagements cumulés</small></article> : null}
        {financial ? <article><span>Paiements</span><strong>{formatBillion(totals.paid)}</strong><small>{totals.paymentRate.toFixed(1)}% des engagements</small></article> : null}
        <article><span>Performance calendrier</span><strong>{totals.schedulePerformance.toFixed(1)}%</strong><small>{totals.overdue} échéance(s) dépassée(s)</small></article>
        <article><span>Projets à surveiller</span><strong>{filtered.filter((item) => item.status === 'atRisk' || item.status === 'delayed').length}</strong><small>À risque ou en retard</small></article>
      </div>

      <div className="kpi-grid">
        <section className="kpi-card">
          <h3>Répartition par statut</h3>
          <div className="kpi-donut-wrap">
            <svg viewBox="0 0 160 160" width="170" height="170" role="img" aria-label="Répartition des projets par statut">
              <g transform="translate(80 80) rotate(-90)">
                {statusDistribution.map(([status, value]) => {
                  const dash = (value / Math.max(1, filtered.length)) * circumference;
                  const node = <circle key={status} r={donutRadius} fill="none" stroke={STATUS_COLORS[status]} strokeWidth="18" strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offset} />;
                  offset += dash;
                  return node;
                })}
              </g>
              <text x="80" y="86" textAnchor="middle" className="kpi-donut-value">{filtered.length}</text>
            </svg>
            <ul>{statusDistribution.map(([status, value]) => <li key={status}><i style={{ background: STATUS_COLORS[status] }} />{STATUS_LABELS[status]} <strong>{value}</strong></li>)}</ul>
          </div>
        </section>

        {financial ? <section className="kpi-card">
          <h3>Exécution budgétaire par secteur</h3>
          <div className="kpi-bars">
            {sectorComparison.map((item) => (
              <div key={item.sector} className="kpi-bar-row">
                <span>{item.sector}</span>
                <div className="kpi-bar-track"><div style={{ width: `${(item.committed / maxSectorBudget) * 100}%` }} /><div className="secondary" style={{ width: `${(item.paid / maxSectorBudget) * 100}%` }} /></div>
                <strong>{formatBillion(item.committed)}</strong>
              </div>
            ))}
          </div>
          <p className="kpi-legend"><i className="primary" />Engagements <i className="secondary" />Paiements</p>
        </section> : null}
      </div>

      <div className="kpi-grid">
        <section className="kpi-card">
          <h3>Comparaison territoriale</h3>
          <div className="kpi-territories">
            {territorialComparison.map((item) => (
              <div key={item.wilaya}><span>{item.wilaya}</span><div className="kpi-progress"><div style={{ width: `${item.progress}%` }} /></div><strong>{item.progress.toFixed(0)}%</strong></div>
            ))}
          </div>
        </section>
        <section className="kpi-card">
          <h3>Indicateurs fournis</h3>
          {kpis.length ? <ul className="kpi-provided">{kpis.map((item, index) => <li key={item.id ?? index}><span>{item.label ?? item.labelKey ?? item.name ?? 'Indicateur'}</span><strong>{item.value ?? '—'}</strong></li>)}</ul> : <p className="kpi-empty">Aucun indicateur externe fourni. Les indicateurs affichés sont dérivés des projets.</p>}
        </section>
      </div>

      <section className="kpi-card">
        <h3>Tableau détaillé</h3>
        <div className="kpi-table-wrap">
          <table>
            <thead><tr><th>Projet</th><th>Wilaya</th><th>Secteur</th>{financial ? <th><button onClick={() => setSortKey('budget')}>Budget</button></th> : null}<th><button onClick={() => setSortKey('progress')}>Avancement</button></th><th>Statut</th><th>Échéance</th></tr></thead>
            <tbody>
              {sortedRows.map((project) => (
                <tr key={project.id}><td><strong>{project.name}</strong><span>{project.id}</span></td><td>{project.wilaya}</td><td>{project.sector}</td>{financial ? <td>{formatDZD(project.budget)}</td> : null}<td><div className="kpi-progress"><div style={{ width: `${project.progress}%` }} /></div>{project.progress}%</td><td><span className={`kpi-status ${project.status}`}>{STATUS_LABELS[project.status] ?? project.status}</span></td><td>{project.dueDate ?? '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

export default KpiDemoOverview;
