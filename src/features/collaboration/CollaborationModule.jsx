import { useMemo, useState } from 'react';
import './CollaborationModule.css';

const VIEWS = [
  { id: 'activity', label: 'Activité' },
  { id: 'discussions', label: 'Discussions' },
  { id: 'announcements', label: 'Annonces' },
  { id: 'followups', label: 'Suivis' }
];

const ACTIVITY_TYPES = ['Mise à jour', 'Décision', 'Commentaire', 'Document', 'Approbation', 'Jalon'];
const TASK_STATUS = { open: 'À traiter', inProgress: 'En cours', completed: 'Terminée' };

const DEMO_DISCUSSIONS = [
  { id: 'D1', projectId: 'PRJ-2031', title: 'Arbitrage du lot structurel', messages: [
    { id: 'M1', author: 'Nadia Cherif', role: 'Maître d’Ouvrage', time: '2026-10-27 09:12', message: 'Le jalon structurel nécessite une décision avant le 15 novembre.' },
    { id: 'M2', author: 'Yacine Hamdi', role: 'PMO Central', time: '2026-10-27 10:04', message: 'Merci. Préparons une note d’arbitrage avec les impacts planning et financiers.' }
  ] },
  { id: 'D2', projectId: 'PRJ-2038', title: 'Livrables photogrammétriques', messages: [
    { id: 'M3', author: 'Sofiane Merabet', role: 'Chef de Projet', time: '2026-10-26 15:40', message: 'Le rapport photogrammétrique de Timgad est prêt pour revue.' }
  ] }
];

const DEMO_ANNOUNCEMENTS = [
  { id: 'A1', author: 'PMO Central', priority: 'high', date: '2026-10-27', title: 'Revue mensuelle du portefeuille', message: 'La revue mensuelle simulée se tiendra le 5 novembre. Les responsables doivent actualiser les indicateurs projet.' },
  { id: 'A2', author: 'Direction Générale', priority: 'medium', date: '2026-10-24', title: 'Priorité de clôture budgétaire', message: 'Priorité aux projets présentant un écart entre engagements et avancement physique.' }
];

const DEMO_TASKS = [
  { id: 'T1', title: 'Consolider la note d’arbitrage', projectId: 'PRJ-2031', assignee: 'Yacine Hamdi', dueDate: '2026-11-05', status: 'inProgress' },
  { id: 'T2', title: 'Valider les livrables 3D', projectId: 'PRJ-2038', assignee: 'Sofiane Merabet', dueDate: '2026-11-12', status: 'open' }
];

const DEMO_NOTIFICATIONS = [
  { id: 'N1', projectId: 'PRJ-2031', title: 'Nouvelle demande d’arbitrage', detail: 'PRJ-2031 — lot structurel', priority: 'high', read: false },
  { id: 'N2', projectId: 'PRJ-2038', title: 'Document soumis', detail: 'PRJ-2038 — rapport photogrammétrique', priority: 'medium', read: false },
  { id: 'N3', projectId: 'PRJ-2024', title: 'Échéance de suivi', detail: 'PRJ-2024 — observatoire territorial', priority: 'low', read: true }
];

const initials = (name) => (name ?? 'U').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
const projectTitle = (projects, id) => projects.find((project) => (project.id ?? project.code) === id)?.name ?? id ?? 'Projet non renseigné';

export function CollaborationModule({ user, projects = [], activity = [] }) {
  const [view, setView] = useState('activity');
  // Discussions, follow-ups and notifications tied to a project outside `projects` (the persona's scope) are not shown.
  const projectIds = useMemo(() => new Set(projects.map((project) => project.id ?? project.code)), [projects]);
  const inScope = (projectId) => !projectId || projectIds.has(projectId);
  const [selectedProject, setSelectedProject] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [readActivity, setReadActivity] = useState(new Set());
  const [readNotifications, setReadNotifications] = useState(new Set(['N3']));
  const [discussions, setDiscussions] = useState(DEMO_DISCUSSIONS);
  const visibleDiscussions = discussions.filter((discussion) => inScope(discussion.projectId));
  const [announcements] = useState(DEMO_ANNOUNCEMENTS);
  const [tasks, setTasks] = useState(DEMO_TASKS);
  const notifications = DEMO_NOTIFICATIONS.filter((notification) => inScope(notification.projectId));
  const [messageForm, setMessageForm] = useState({ discussionId: DEMO_DISCUSSIONS.find((discussion) => projects.some((project) => (project.id ?? project.code) === discussion.projectId))?.id ?? '', message: '' });
  const [taskForm, setTaskForm] = useState({ title: '', projectId: projects[0]?.id ?? '', assignee: '', dueDate: '' });
  const [feedback, setFeedback] = useState('');
  const [errors, setErrors] = useState({});

  const normalizedActivity = useMemo(() => activity.map((item, index) => ({
    id: item.id ?? `activity-${index}`,
    actor: item.actor ?? 'Utilisateur de démonstration',
    action: item.action ?? 'a mis à jour le projet',
    time: item.time ?? '—',
    type: item.type ?? 'Mise à jour',
    projectId: item.projectId ?? null
  })), [activity]);

  const filteredActivity = normalizedActivity.filter((item) =>
    (selectedProject === 'all' || item.projectId === selectedProject) &&
    (typeFilter === 'all' || item.type === typeFilter) &&
    (!search || `${item.actor} ${item.action}`.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredDiscussions = visibleDiscussions.filter((discussion) => selectedProject === 'all' || discussion.projectId === selectedProject);
  const filteredTasks = tasks.filter((task) =>
    inScope(task.projectId) && (selectedProject === 'all' || task.projectId === selectedProject) &&
    (statusFilter === 'all' || task.status === statusFilter)
  );

  const unreadNotifications = notifications.filter((notification) => !readNotifications.has(notification.id));

  const showFeedback = (message) => {
    setFeedback(message);
    setTimeout(() => setFeedback(''), 2600);
  };

  const submitMessage = (event) => {
    event.preventDefault();
    if (!messageForm.message.trim()) { setErrors({ message: 'Le message est obligatoire.' }); return; }
    setDiscussions((current) => current.map((discussion) => discussion.id === messageForm.discussionId ? {
      ...discussion,
      messages: [...discussion.messages, { id: `M-${Date.now()}`, author: user?.name ?? 'Utilisateur de démonstration', role: user?.role?.fr ?? 'Démonstration', time: new Date().toLocaleString('fr-FR'), message: messageForm.message.trim() }]
    } : discussion));
    setMessageForm((current) => ({ ...current, message: '' }));
    setErrors({});
    showFeedback('Message ajouté à la discussion.');
  };

  const submitTask = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!taskForm.title.trim()) nextErrors.title = 'L’intitulé est obligatoire.';
    if (!taskForm.assignee.trim()) nextErrors.assignee = 'Le responsable est obligatoire.';
    if (!taskForm.dueDate) nextErrors.dueDate = 'L’échéance est obligatoire.';
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
    setTasks((current) => [{ id: `T-${Date.now()}`, ...taskForm, title: taskForm.title.trim(), assignee: taskForm.assignee.trim(), status: 'open' }, ...current]);
    setTaskForm({ title: '', projectId: projects[0]?.id ?? '', assignee: '', dueDate: '' });
    setErrors({});
    showFeedback('Suivi ajouté.');
  };

  const toggleActivityRead = (id) => setReadActivity((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const toggleNotificationRead = (id) => setReadNotifications((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const completeTask = (id) => { setTasks((current) => current.map((task) => task.id === id ? { ...task, status: 'completed' } : task)); showFeedback('Suivi marqué comme terminé.'); };

  return (
    <section className="collab-module" aria-label="Collaboration et activité projet">
      <header className="collab-header">
        <div>
          <p className="collab-brand">TAQADDUM</p>
          <h2>Collaboration & activité projet</h2>
          <p>Espace de coordination simulé — {user?.name ?? 'Utilisateur de démonstration'}.</p>
        </div>
        <span className="collab-demo-badge">Contenu de démonstration</span>
      </header>

      {feedback && <div className="collab-feedback" role="status">{feedback}</div>}

      <div className="collab-layout">
        <nav className="collab-nav">
          {VIEWS.map((item) => <button key={item.id} type="button" className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)}>{item.label}</button>)}
          <div className="collab-nav-section">Projet</div>
          <select value={selectedProject} onChange={(event) => setSelectedProject(event.target.value)}>
            <option value="all">Tous les projets</option>
            {projects.map((project) => <option key={project.id ?? project.name} value={project.id ?? project.name}>{project.name ?? project.title}</option>)}
          </select>
          <div className="collab-nav-section">Notifications</div>
          <div className="collab-notifications">
            {notifications.map((notification) => (
              <button key={notification.id} type="button" className={readNotifications.has(notification.id) ? 'read' : 'unread'} onClick={() => toggleNotificationRead(notification.id)}>
                <strong>{notification.title}</strong>
                <span>{notification.detail}</span>
                {!readNotifications.has(notification.id) && <i className="collab-unread-dot" />}
              </button>
            ))}
          </div>
        </nav>

        <main className="collab-content">
          <div className="collab-content-toolbar">
            <input type="search" placeholder="Rechercher dans la collaboration…" value={search} onChange={(event) => setSearch(event.target.value)} />
            {view === 'activity' && <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">Tous les types</option>{ACTIVITY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select>}
            {view === 'followups' && <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Tous les statuts</option>{Object.entries(TASK_STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}
          </div>

          {view === 'activity' && (
            <div className="collab-feed">
              {filteredActivity.length === 0 && <div className="collab-empty"><strong>Aucune activité</strong><p>Aucune activité ne correspond au projet ou aux filtres sélectionnés.</p></div>}
              {filteredActivity.map((item) => (
                <article key={item.id} className={`collab-activity ${readActivity.has(item.id) ? 'read' : 'unread'}`}>
                  <span className="collab-avatar">{initials(item.actor)}</span>
                  <div><strong>{item.actor}</strong> <span>{item.action}</span><div className="collab-meta">{item.type} · {item.time}{item.projectId ? ` · ${projectTitle(projects, item.projectId)}` : ''}</div></div>
                  <button type="button" onClick={() => toggleActivityRead(item.id)}>{readActivity.has(item.id) ? 'Marquer non lu' : 'Marquer lu'}</button>
                </article>
              ))}
            </div>
          )}

          {view === 'discussions' && (
            <div className="collab-discussions">
              {filteredDiscussions.length === 0 && <div className="collab-empty"><strong>Aucune discussion</strong><p>Sélectionnez un autre projet pour afficher les discussions associées.</p></div>}
              {filteredDiscussions.map((discussion) => (
                <section key={discussion.id} className="collab-thread">
                  <h3>{discussion.title}</h3>
                  <p className="collab-meta">{projectTitle(projects, discussion.projectId)}</p>
                  {discussion.messages.map((message) => (
                    <article key={message.id} className="collab-message"><span className="collab-avatar">{initials(message.author)}</span><div><div className="collab-message-head"><strong>{message.author}</strong><span>{message.role} · {message.time}</span></div><p>{message.message}</p></div></article>
                  ))}
                  <form onSubmit={submitMessage} className="collab-form">
                    <select value={messageForm.discussionId} onChange={(event) => setMessageForm((current) => ({ ...current, discussionId: event.target.value }))}>
                      {visibleDiscussions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                    </select>
                    <textarea placeholder="Ajouter un message…" value={messageForm.discussionId === discussion.id ? messageForm.message : ''} onChange={(event) => setMessageForm({ discussionId: discussion.id, message: event.target.value })} />
                    {errors.message && <span className="collab-error">{errors.message}</span>}
                    <button type="submit">Publier</button>
                  </form>
                </section>
              ))}
            </div>
          )}

          {view === 'announcements' && (
            <div className="collab-announcements">
              {announcements.map((announcement) => (
                <article key={announcement.id} className={`collab-announcement ${announcement.priority}`}>
                  <div className="collab-announcement-head"><strong>{announcement.title}</strong><span>{announcement.priority === 'high' ? 'Priorité haute' : 'Priorité normale'}</span></div>
                  <p>{announcement.message}</p>
                  <div className="collab-meta">{announcement.author} · {announcement.date}</div>
                </article>
              ))}
            </div>
          )}

          {view === 'followups' && (
            <div className="collab-followups">
              <form onSubmit={submitTask} className="collab-task-form">
                <label>Intitulé<input value={taskForm.title} onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} />{errors.title && <span className="collab-error">{errors.title}</span>}</label>
                <label>Projet<select value={taskForm.projectId} onChange={(event) => setTaskForm((current) => ({ ...current, projectId: event.target.value }))}>{projects.map((project) => <option key={project.id ?? project.name} value={project.id ?? project.name}>{project.name ?? project.title}</option>)}</select></label>
                <label>Responsable<input value={taskForm.assignee} onChange={(event) => setTaskForm((current) => ({ ...current, assignee: event.target.value }))} />{errors.assignee && <span className="collab-error">{errors.assignee}</span>}</label>
                <label>Échéance<input type="date" value={taskForm.dueDate} onChange={(event) => setTaskForm((current) => ({ ...current, dueDate: event.target.value }))} />{errors.dueDate && <span className="collab-error">{errors.dueDate}</span>}</label>
                <button type="submit">Ajouter</button>
              </form>
              {filteredTasks.length === 0 && <div className="collab-empty"><strong>Aucun suivi</strong><p>Aucun suivi ne correspond aux filtres sélectionnés.</p></div>}
              {filteredTasks.map((task) => (
                <article key={task.id} className={`collab-task ${task.status}`}>
                  <div><strong>{task.title}</strong><span>{projectTitle(projects, task.projectId)} · {task.assignee} · {task.dueDate}</span></div>
                  <span className={`collab-task-status ${task.status}`}>{TASK_STATUS[task.status]}</span>
                  {task.status !== 'completed' && <button type="button" onClick={() => completeTask(task.id)}>Terminer</button>}
                </article>
              ))}
            </div>
          )}
        </main>

        <aside className="collab-sidebar">
          <h3>Contexte projet</h3>
          {selectedProject === 'all' ? <p>Sélectionnez un projet pour concentrer l’activité, les discussions et les suivis.</p> : <><strong>{projectTitle(projects, selectedProject)}</strong><p>{normalizedActivity.filter((item) => item.projectId === selectedProject).length} activité(s) · {visibleDiscussions.filter((discussion) => discussion.projectId === selectedProject).length} discussion(s)</p></>}
          <h3>Notifications</h3>
          <p>{unreadNotifications.length} notification(s) non lue(s)</p>
          <div className="collab-priority">
            <span className="high" />Priorité haute
            <span className="medium" />Priorité normale
          </div>
        </aside>
      </div>
    </section>
  );
}

export default CollaborationModule;
