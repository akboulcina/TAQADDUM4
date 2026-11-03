import { useMemo, useState } from 'react';
import { DEMO_MILESTONES as DEMO_TIMELINE, DEMO_DELIVERABLES, nextStep } from '../../data/projectWorkflow.js';
import './ProjectDetailsModule.css';

const STATUS = { onTrack: 'En bonne voie', atRisk: 'À risque', delayed: 'En retard', completed: 'Achevé' };
const PRIORITY = { critical: 'Critique', high: 'Haute', medium: 'Moyenne', low: 'Faible' };
const TABS = [
  { id: 'overview', label: 'Aperçu' },
  { id: 'financial', label: 'Finances' },
  { id: 'timeline', label: 'Jalons' },
  { id: 'deliverables', label: 'Livrables' },
  { id: 'risks', label: 'Risques' },
  { id: 'stakeholders', label: 'Parties prenantes' },
  { id: 'activity', label: 'Activité' }
];

const num = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const formatDZD = (value) => value == null ? '—' : new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(value);

const DEMO_RISKS = [
  { id: 'R1', title: 'Retard possible sur le lot structurel', level: 'high', action: 'Mettre à jour le planning et mobiliser le fournisseur.' },
  { id: 'R2', title: 'Écart entre engagements et avancement', level: 'medium', action: 'Vérifier les pièces justificatives des paiements.' }
];

const DEMO_STAKEHOLDERS = [
  { name: 'Nadia Cherif', role: 'Maître d’Ouvrage' },
  { name: 'Sofiane Merabet', role: 'Chef de Projet' },
  { name: 'Karim Benali', role: 'Responsable Financier' }
];

const DEMO_ACTIVITY = [
  { actor: 'Sofiane Merabet', action: 'a publié le rapport d’avancement', time: '2026-10-26' },
  { actor: 'Karim Benali', action: 'a enregistré une demande de paiement', time: '2026-10-24' }
];

/*
 * Optional role-model props (defaults keep the original, unrestricted behaviour):
 *   workflow     { milestones, deliverables }     shared state for this project; with onAdvance the module is controlled
 *   onAdvance    (kind, itemId) => { ok, reason }
 *   permissions  { update, validate, note }       what the persona may do on THIS project
 *   labels       { start, validate, noPermission, forbidden, notesReadOnly, demoWorkflow }
 */
export function ProjectDetailsModule({ project, user, onBack, workflow, onAdvance, permissions, labels = {} }) {
  const [tab, setTab] = useState('overview');
  const controlled = Boolean(workflow && onAdvance);
  const allow = permissions ?? { update: true, validate: true, note: true };
  const showFinancial = allow.financial !== false; // restricted financial information (finance.view)
  const [localMilestones, setLocalMilestones] = useState(DEMO_TIMELINE);
  const [localDeliverables, setLocalDeliverables] = useState(DEMO_DELIVERABLES);
  const milestones = controlled ? workflow.milestones : localMilestones;
  const deliverables = controlled ? workflow.deliverables : localDeliverables;
  const [notes, setNotes] = useState([]);
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState('');
  const [expanded, setExpanded] = useState(new Set());

  const data = useMemo(() => project ? {
    id: project.id ?? project.code ?? '—', name: project.name ?? project.title ?? 'Projet', wilaya: project.wilaya ?? 'Non renseignée', sector: project.sector ?? 'Non renseigné', status: project.status ?? 'onTrack', priority: project.priority ?? 'medium', progress: num(project.progress) ?? 0, budget: num(project.budget), committed: num(project.committed) ?? num(project.budget), paid: num(project.paid) ?? 0, manager: project.manager ?? 'Non renseigné', dueDate: project.dueDate ?? null
  } : null, [project]);

  if (!data) {
    return <section className="project-details-module"><div className="pd-empty"><strong>Aucun projet sélectionné</strong><p>Sélectionnez un projet dans le portefeuille pour afficher sa fiche détaillée.</p><button type="button" onClick={() => onBack?.()}>Retour au portefeuille</button></div></section>;
  }

  const remaining = data.budget != null ? data.budget - (data.paid ?? 0) : null;
  const today = new Date();
  const showFeedback = (message) => { setFeedback(message); setTimeout(() => setFeedback(''), 2400); };
  const toggleExpand = (id) => setExpanded((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const advance = (kind, id, item) => {
    const step = nextStep(kind, item.status);
    if (!step) return;
    if (!allow[step.permission === 'project.validate' ? 'validate' : 'update']) { showFeedback(labels.forbidden ?? 'Action non autorisée pour votre rôle.'); return; }
    if (controlled) {
      const result = onAdvance(kind, id);
      showFeedback(result.ok ? (kind === 'milestone' ? 'Statut du jalon mis à jour.' : 'Statut du livrable mis à jour.') : (labels.forbidden ?? 'Action non autorisée pour votre rôle.'));
      return;
    }
    const apply = (list) => list.map((entry) => (entry.id === id ? { ...entry, status: step.to } : entry));
    if (kind === 'milestone') setLocalMilestones(apply); else setLocalDeliverables(apply);
    showFeedback(kind === 'milestone' ? 'Statut du jalon mis à jour localement.' : 'Statut du livrable mis à jour localement.');
  };
  // Label and enabled state of the action button for one item (null = nothing left to do).
  const actionFor = (kind, item) => {
    const step = nextStep(kind, item.status);
    if (!step) return null;
    const validating = step.permission === 'project.validate';
    return { label: validating ? (labels.validate ?? 'Valider') : (labels.start ?? 'Mettre à jour'), enabled: allow[validating ? 'validate' : 'update'] };
  };
  const addNote = (event) => { event.preventDefault(); if (!allow.note || !note.trim()) return; setNotes((current) => [{ id: `N-${Date.now()}`, author: user?.name ?? 'Utilisateur de démonstration', date: new Date().toLocaleDateString('fr-FR'), text: note.trim() }, ...current]); setNote(''); showFeedback('Note de suivi ajoutée localement.'); };

  return (
    <section className="project-details-module" aria-label="Fiche projet">
      <button type="button" className="pd-back" onClick={() => onBack?.()}>← Retour au portefeuille</button>
      <header className="pd-header">
        <div><p className="pd-brand">TAQADDUM</p><h2>{data.name}</h2><p className="pd-reference">{data.id} · {data.wilaya} · {data.sector}</p></div>
        <div className="pd-header-badges"><span className={`pd-status ${data.status}`}>{STATUS[data.status]}</span><span className="pd-priority">{PRIORITY[data.priority]}</span><span className="pd-demo">Interactions locales simulées</span></div>
      </header>

      {feedback && <div className="pd-feedback" role="status">{feedback}</div>}

      <nav className="pd-tabs">{TABS.filter((item) => showFinancial || item.id !== 'financial').map((item) => <button key={item.id} type="button" className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>{item.label}</button>)}</nav>

      {tab === 'overview' && <div className="pd-grid"><article className="pd-card"><h3>Vue d’ensemble</h3><dl><div><dt>Référence</dt><dd>{data.id}</dd></div><div><dt>Wilaya</dt><dd>{data.wilaya}</dd></div><div><dt>Secteur</dt><dd>{data.sector}</dd></div><div><dt>Responsable</dt><dd>{data.manager}</dd></div><div><dt>Échéance</dt><dd>{data.dueDate ?? '—'}</dd></div></dl><div className="pd-progress"><span style={{ width: `${data.progress}%` }} /></div><strong>{data.progress}% d’avancement</strong></article><article className="pd-card"><h3>Synthèse financière</h3><dl><div><dt>Budget approuvé</dt><dd>{formatDZD(data.budget)}</dd></div><div><dt>Engagements</dt><dd>{formatDZD(data.committed)}</dd></div><div><dt>Paiements</dt><dd>{formatDZD(data.paid)}</dd></div><div><dt>Reste à payer</dt><dd>{formatDZD(remaining)}</dd></div></dl></article></div>}

      {tab === 'financial' && showFinancial && <article className="pd-card"><h3>Détail financier</h3><div className="pd-financial"><div><span>Budget approuvé</span><strong>{formatDZD(data.budget)}</strong></div><div><span>Engagements</span><strong>{formatDZD(data.committed)}</strong></div><div><span>Paiements</span><strong>{formatDZD(data.paid)}</strong></div><div><span>Reste à payer</span><strong>{formatDZD(remaining)}</strong></div></div></article>}

      {tab === 'timeline' && <article className="pd-card"><h3>Jalons et échéances{labels.demoWorkflow ? <span className="pd-demo-inline">{labels.demoWorkflow}</span> : null}</h3><div className="pd-timeline">{milestones.map((milestone) => { const overdue = milestone.status !== 'completed' && new Date(milestone.date) < today; return <div key={milestone.id} className="pd-milestone"><button type="button" onClick={() => toggleExpand(milestone.id)}>{expanded.has(milestone.id) ? '−' : '+'}</button><div><strong>{milestone.title}</strong><span>{milestone.date} · {milestone.status === 'completed' ? 'Terminé' : milestone.status === 'inProgress' ? 'En cours' : 'À venir'}{overdue ? ' · Dépassé' : ''}</span></div>{(() => { const action = actionFor('milestone', milestone); return action ? <button type="button" disabled={!action.enabled} title={action.enabled ? undefined : labels.noPermission} onClick={() => advance('milestone', milestone.id, milestone)}>{action.label}</button> : <span className="pd-done">✓</span>; })()}</div>; })}</div></article>}

      {tab === 'deliverables' && <article className="pd-card"><h3>Livrables et documents simulés{labels.demoWorkflow ? <span className="pd-demo-inline">{labels.demoWorkflow}</span> : null}</h3><div className="pd-list">{deliverables.map((item) => <div key={item.id} className="pd-row"><div><strong>{item.title}</strong><span>Statut : {item.status}</span></div>{(() => { const action = actionFor('deliverable', item); return action ? <button type="button" disabled={!action.enabled} title={action.enabled ? undefined : labels.noPermission} onClick={() => advance('deliverable', item.id, item)}>{action.label}</button> : <span className="pd-done">✓</span>; })()}</div>)}</div></article>}

      {tab === 'risks' && <article className="pd-card"><h3>Risques et actions</h3><div className="pd-list">{DEMO_RISKS.map((risk) => <div key={risk.id} className={`pd-risk ${risk.level}`}><strong>{risk.title}</strong><span>{risk.action}</span></div>)}</div>{allow.note ? <form onSubmit={addNote} className="pd-note-form"><textarea placeholder="Ajouter une note de suivi…" value={note} onChange={(event) => setNote(event.target.value)} /><button type="submit">Ajouter la note</button></form> : <p className="pd-readonly">{labels.notesReadOnly ?? 'Consultation en lecture seule.'}</p>}{notes.map((item) => <div key={item.id} className="pd-note"><strong>{item.author}</strong><span>{item.date}</span><p>{item.text}</p></div>)}</article>}

      {tab === 'stakeholders' && <article className="pd-card"><h3>Parties prenantes</h3><div className="pd-list">{DEMO_STAKEHOLDERS.map((person) => <div key={person.name} className="pd-row"><div><strong>{person.name}</strong><span>{person.role}</span></div></div>)}</div></article>}

      {tab === 'activity' && <article className="pd-card"><h3>Activité récente simulée</h3><div className="pd-list">{DEMO_ACTIVITY.map((item, index) => <div key={index} className="pd-row"><div><strong>{item.actor}</strong><span>{item.action} · {item.time}</span></div></div>)}</div></article>}
    </section>
  );
}

export default ProjectDetailsModule;
