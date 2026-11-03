import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { formatValue } from '../../kpi/catalogue.js';
import KpiFamilyNavigation from './KpiFamilyNavigation.jsx';
import AuthorizedCsvExportButton from './AuthorizedCsvExportButton.jsx';
import { familySummaries, statusDistribution } from './kpiIntelligence.js';
import './KpiIntelligence.css';

const STATUS_ORDER = ['green', 'orange', 'red', 'informational', 'not_evaluable'];

function KpiValueTable({ rows, title }) {
  const { t, fmt } = useApp();
  return (
    <section className="kpi-intel-section">
      <h3>{title}</h3>
      {rows.length ? (
        <div className="kpi-intel-table-wrap">
          <table className="kpi-intel-table">
            <thead>
              <tr><th>ID</th><th>KPI</th><th>Valeur</th><th>Statut</th><th>Disponibilité</th></tr>
            </thead>
            <tbody>
              {rows.map(({ kpi, result }) => (
                <tr key={kpi.id}>
                  <th scope="row">{kpi.id}</th>
                  <td>{kpi.name}</td>
                  <td>{formatValue(result, kpi.unit, { fmt, t }) ?? <span className="kpi-intel-muted">{t('kpr.noValue')}</span>}</td>
                  <td>{result?.status ?? 'not_evaluable'}</td>
                  <td>{result?.state ?? 'none'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="kpi-intel-empty">Aucun KPI autorisé dans ce périmètre.</p>}
    </section>
  );
}

export default function PortfolioIntelligence({ report, rows = [], canViewFinancials = false }) {
  const { t, fmt } = useApp();
  const [family, setFamily] = useState('');
  const distribution = useMemo(() => statusDistribution(rows), [rows]);
  const families = useMemo(() => familySummaries(rows), [rows]);
  const visibleRows = useMemo(() => family ? rows.filter((row) => row.kpi.family === family) : rows, [rows, family]);

  const attentionProjects = useMemo(() => {
    const avRows = rows.filter((row) => row.kpi.family === 'AV' && row.meta.hasProjectValue);
    return report.projects
      .map((project) => ({
        project,
        red: avRows.filter((row) => project.kpis[row.kpi.id]?.status === 'red').length,
        orange: avRows.filter((row) => project.kpis[row.kpi.id]?.status === 'orange').length
      }))
      .filter((item) => item.red > 0 || item.orange > 0)
      .sort((a, b) => b.red - a.red || b.orange - a.orange)
      .slice(0, 8);
  }, [report, rows]);

  const financialRows = rows.filter((row) => row.kpi.family === 'FI');
  const constraintRows = rows.filter((row) => ['PP', 'QR'].includes(row.kpi.family));
  const dataQualityRows = rows.filter((row) => row.kpi.family === 'DO');

  return (
    <div className="kpi-intelligence">
      <KpiFamilyNavigation rows={rows} activeFamily={family} onSelectFamily={setFamily} />

      <section className="kpi-intel-section">
        <div className="kpi-intel-heading">
          <h3>Distribution des statuts KPI</h3>
          <AuthorizedCsvExportButton filename="taqaddum-kpi-intelligence.csv" rows={visibleRows} formatValue={(result, unit) => formatValue(result, unit, { fmt, t })} />
        </div>
        <div className="kpi-intel-status" role="list">
          {STATUS_ORDER.map((status) => (
            <div key={status} role="listitem" className={`kpi-intel-chip kpi-intel-${status}`}>
              <strong>{distribution[status] ?? 0}</strong>
              <span>{t(`kpr.status.${status}`)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="kpi-intel-section">
        <h3>Performance par famille</h3>
        <div className="kpi-intel-table-wrap">
          <table className="kpi-intel-table">
            <thead><tr><th>Famille</th><th>Total</th><th>Disponibles</th><th>Partiels</th><th>Non évaluables</th></tr></thead>
            <tbody>
              {families.map((item) => (
                <tr key={item.code} className={family === item.code ? 'selected' : ''}>
                  <th scope="row">{item.code} · {item.label}</th>
                  <td>{item.total}</td><td>{item.available}</td><td>{item.partial}</td><td>{item.unevaluable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="kpi-intel-section">
        <h3>Projets nécessitant une attention sur l’avancement</h3>
        {attentionProjects.length ? (
          <div className="kpi-intel-table-wrap">
            <table className="kpi-intel-table">
              <thead><tr><th>Projet</th><th>KPI AV rouges</th><th>KPI AV orange</th></tr></thead>
              <tbody>
                {attentionProjects.map(({ project, red, orange }) => (
                  <tr key={project.id}><th scope="row">{project.name}</th><td>{red}</td><td>{orange}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="kpi-intel-empty">Aucun projet autorisé ne présente de KPI d’avancement rouge ou orange.</p>}
      </section>

      {canViewFinancials ? <KpiValueTable rows={financialRows} title="Exposition financière — indicateurs FI" /> : (
        <section className="kpi-intel-section"><h3>Exposition financière</h3><p className="kpi-intel-empty">Indicateurs financiers non autorisés pour votre rôle.</p></section>
      )}

      <KpiValueTable rows={constraintRows} title="Contraintes terrain, qualité et réseau — PP / QR" />

      <section className="kpi-intel-section">
        <h3>Fiabilité des données</h3>
        <KpiValueTable rows={dataQualityRows} title="" />
        <p className="kpi-intel-empty">
          {report.dataQuality.issues.length
            ? `${report.dataQuality.issues.length} anomalie(s) ou donnée(s) manquante(s) détectée(s).`
            : 'Aucune anomalie de qualité détectée dans le périmètre autorisé.'}
        </p>
      </section>
    </div>
  );
}
