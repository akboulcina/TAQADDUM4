import { useMemo, useState } from 'react';
import { exportProjectsCsv } from '../../roles/exportCsv.js';
import './ReportsModule.css';

const money = (value) => new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(value ?? 0);

// canExport / labels are optional: without them the module behaves as before.
export default function ReportsModule({ projects = [], user, canExport = true, canViewFinancials = true, labels = {} }) {
  const [notice, setNotice] = useState('');
  const summary = useMemo(() => ({
    count: projects.length,
    budget: projects.reduce((sum, project) => sum + (Number(project.budget) || 0), 0),
    committed: projects.reduce((sum, project) => sum + (Number(project.committed) || 0), 0),
    paid: projects.reduce((sum, project) => sum + (Number(project.paid) || 0), 0),
    delayed: projects.filter((project) => project.status === 'delayed').length,
    atRisk: projects.filter((project) => project.status === 'atRisk').length,
  }), [projects]);

  const exportCsv = () => {
    if (!canExport) return;
    exportProjectsCsv(projects, undefined, { financial: canViewFinancials });
    setNotice('Export CSV généré à partir des données de démonstration.');
  };

  return (
    <section className="reports-module" aria-label="Rapports et exports">
      <header className="reports-header">
        <div><p className="reports-brand">TAQADDUM</p><h2>Rapports & exports</h2><p>Rapports de synthèse simulés · {user?.name ?? 'Utilisateur de démonstration'}</p></div>
        <span className="reports-demo-badge">Données de démonstration</span>
      </header>
      {notice && <p className="reports-notice" role="status">{notice}</p>}
      <div className="reports-summary">
        <article><span>Projets du portefeuille</span><strong>{summary.count}</strong></article>
        {canViewFinancials ? <><article><span>Budget total</span><strong>{money(summary.budget)}</strong></article>
        <article><span>Engagements</span><strong>{money(summary.committed)}</strong></article>
        <article><span>Paiements</span><strong>{money(summary.paid)}</strong></article></> : null}
        <article><span>Projets en retard</span><strong>{summary.delayed}</strong></article>
        <article><span>Projets à risque</span><strong>{summary.atRisk}</strong></article>
      </div>
      <div className="reports-card">
        <div><h3>État consolidé du portefeuille</h3><p>Exporter les lignes du portefeuille actuellement fourni à l’application au format CSV, compatible avec Excel.</p></div>
        <button type="button" onClick={exportCsv} disabled={!canExport} title={canExport ? undefined : labels.noPermission}>Exporter le portefeuille CSV</button>
      </div>
      <div className="reports-table-wrap">
        <table>
          <thead><tr><th>Référence</th><th>Projet</th><th>Wilaya</th><th>Statut</th><th>Avancement</th>{canViewFinancials ? <th>Budget</th> : null}</tr></thead>
          <tbody>{projects.map((project) => <tr key={project.id ?? project.code}><td>{project.id ?? project.code ?? '—'}</td><td>{project.name ?? project.title ?? 'Projet'}</td><td>{project.wilaya ?? '—'}</td><td>{project.status ?? '—'}</td><td>{Number(project.progress) || 0}%</td>{canViewFinancials ? <td>{money(project.budget)}</td> : null}</tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
