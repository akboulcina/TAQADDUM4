import { useMemo, useState } from 'react';
import './PortfolioModule.css';

const STATUS = { onTrack: 'En bonne voie', atRisk: 'À risque', delayed: 'En retard', completed: 'Achevé' };
const PRIORITY = { critical: 'Critique', high: 'Haute', medium: 'Moyenne', low: 'Faible' };
const num = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

function normalize(project) {
  if (!project) return null;
  return { id: project.id ?? project.code ?? project.name, name: project.name ?? project.title ?? 'Projet', wilaya: project.wilaya ?? 'Non renseignée', sector: project.sector ?? 'Non renseigné', status: project.status ?? 'onTrack', priority: project.priority ?? 'medium', progress: num(project.progress) ?? 0, budget: num(project.budget), committed: num(project.committed) ?? num(project.budget), paid: num(project.paid) ?? 0, manager: project.manager ?? 'Non renseigné', dueDate: project.dueDate ?? null };
}

const formatDZD = (value) => value == null ? '—' : new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(value);

export function PortfolioModule({ projects = [], user, onSelectProject, canViewFinancials = true }) {
  const [search, setSearch] = useState('');
  const [wilaya, setWilaya] = useState('all');
  const [sector, setSector] = useState('all');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [sort, setSort] = useState({ key: canViewFinancials ? 'budget' : 'progress', direction: 'desc' });
  const [previewId, setPreviewId] = useState(null);

  const data = useMemo(() => projects.map(normalize).filter(Boolean), [projects]);
  const options = useMemo(() => ({ wilayas: [...new Set(data.map((item) => item.wilaya))].sort(), sectors: [...new Set(data.map((item) => item.sector))].sort() }), [data]);

  const filtered = useMemo(() => data.filter((project) => (wilaya === 'all' || project.wilaya === wilaya) && (sector === 'all' || project.sector === sector) && (status === 'all' || project.status === status) && (priority === 'all' || project.priority === priority) && (!search || `${project.name} ${project.id} ${project.manager}`.toLowerCase().includes(search.toLowerCase()))), [data, search, wilaya, sector, status, priority]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => { const valueA = a[sort.key] ?? 0; const valueB = b[sort.key] ?? 0; if (typeof valueA === 'string') return sort.direction === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA); return sort.direction === 'asc' ? valueA - valueB : valueB - valueA; }), [filtered, sort]);

  const summary = { total: data.length, ongoing: data.filter((item) => item.status !== 'completed').length, completed: data.filter((item) => item.status === 'completed').length, delayed: data.filter((item) => item.status === 'delayed').length, budget: data.reduce((sum, item) => sum + (item.budget ?? 0), 0) };
  const preview = data.find((project) => project.id === previewId) ?? null;
  const toggleSort = (key) => setSort((current) => ({ key, direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc' }));

  return (
    <section className="portfolio-module" aria-label="Portefeuille de projets">
      <header className="portfolio-header">
        <div><p className="portfolio-brand">TAQADDUM</p><h2>Portefeuille de projets</h2><p>Suivi consolidé du portefeuille — {user?.name ?? 'Utilisateur de démonstration'}.</p></div>
        <span className="portfolio-demo-badge">Données simulées</span>
      </header>

      <div className="portfolio-summary">
        <article><span>Total projets</span><strong>{summary.total}</strong></article>
        <article><span>En cours</span><strong>{summary.ongoing}</strong></article>
        <article><span>Achevés</span><strong>{summary.completed}</strong></article>
        <article><span>En retard</span><strong>{summary.delayed}</strong></article>
        {canViewFinancials ? <article><span>Budget total</span><strong>{formatDZD(summary.budget)}</strong></article> : null}
      </div>

      <div className="portfolio-toolbar">
        <input type="search" placeholder="Rechercher un projet, un responsable…" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select value={wilaya} onChange={(event) => setWilaya(event.target.value)}><option value="all">Toutes wilayas</option>{options.wilayas.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <select value={sector} onChange={(event) => setSector(event.target.value)}><option value="all">Tous secteurs</option>{options.sectors.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tous statuts</option>{Object.entries(STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="all">Toutes priorités</option>{Object.entries(PRIORITY).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <button type="button" onClick={() => { setSearch(''); setWilaya('all'); setSector('all'); setStatus('all'); setPriority('all'); }}>Réinitialiser</button>
      </div>

      <div className="portfolio-layout">
        <div className="portfolio-table-card">
          {sorted.length === 0 ? <div className="portfolio-empty"><strong>Aucun projet trouvé</strong><p>Modifiez la recherche ou réinitialisez les filtres.</p></div> : (
            <div className="portfolio-table-wrap"><table>
              <thead><tr><th><button onClick={() => toggleSort('name')}>Projet</button></th><th>Wilaya</th><th>Secteur</th>{canViewFinancials ? <><th><button onClick={() => toggleSort('budget')}>Budget</button></th><th>Engagé / payé</th></> : null}<th><button onClick={() => toggleSort('progress')}>Avancement</button></th><th>Statut</th><th>Priorité</th><th>Responsable</th><th>Échéance</th><th></th></tr></thead>
              <tbody>
                {sorted.map((project) => (
                  <tr key={project.id} className={previewId === project.id ? 'selected' : ''} onClick={() => setPreviewId(project.id)}>
                    <td><strong>{project.name}</strong><span>{project.id}</span></td>
                    <td>{project.wilaya}</td><td>{project.sector}</td>
                    {canViewFinancials ? <><td>{formatDZD(project.budget)}</td>
                    <td>{formatDZD(project.committed)}<br /><small>{formatDZD(project.paid)}</small></td></> : null}
                    <td><div className="portfolio-progress"><span style={{ width: `${project.progress}%` }} /></div>{project.progress}%</td>
                    <td><span className={`portfolio-status ${project.status}`}>{STATUS[project.status]}</span></td>
                    <td>{PRIORITY[project.priority]}</td><td>{project.manager}</td><td>{project.dueDate ?? '—'}</td>
                    <td><button type="button" onClick={(event) => { event.stopPropagation(); onSelectProject?.(project.id); }}>Ouvrir</button></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>

        {preview && (
          <aside className="portfolio-preview">
            <h3>{preview.name}</h3>
            <p className="portfolio-preview-id">{preview.id}</p>
            <dl><div><dt>Wilaya</dt><dd>{preview.wilaya}</dd></div><div><dt>Secteur</dt><dd>{preview.sector}</dd></div><div><dt>Statut</dt><dd>{STATUS[preview.status]}</dd></div>{canViewFinancials ? <div><dt>Budget</dt><dd>{formatDZD(preview.budget)}</dd></div> : null}<div><dt>Responsable</dt><dd>{preview.manager}</dd></div></dl>
            <div className="portfolio-progress large"><span style={{ width: `${preview.progress}%` }} /></div>
            <button type="button" className="portfolio-open" onClick={() => onSelectProject?.(preview.id)}>Ouvrir la fiche projet</button>
            <button type="button" className="portfolio-close" onClick={() => setPreviewId(null)}>Fermer l’aperçu</button>
          </aside>
        )}
      </div>
    </section>
  );
}

export default PortfolioModule;
