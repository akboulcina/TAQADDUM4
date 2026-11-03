/*
 * DEMONSTRATION WORKFLOW STATE — milestones and deliverables.
 *
 * The project dataset has no milestone or deliverable records. The Project Details
 * module already shipped with one generic template (4 milestones, 3 deliverables)
 * shown for every project; it now lives here so that the role dashboards and the
 * project sheet read and write the same state. Each project gets its own copy of
 * the template, completed projects get a fully validated copy. This is labelled
 * "demo workflow" wherever it is displayed: it is NOT operational data.
 */

export const DEMO_MILESTONES = [
  { id: 'MS1', title: 'Validation des études', date: '2026-03-15', status: 'completed' },
  { id: 'MS2', title: 'Démarrage des travaux', date: '2026-06-01', status: 'completed' },
  { id: 'MS3', title: 'Réception intermédiaire', date: '2026-11-30', status: 'upcoming' },
  { id: 'MS4', title: 'Réception définitive', date: '2027-06-30', status: 'upcoming' }
];

export const DEMO_DELIVERABLES = [
  { id: 'DL1', title: 'Rapport d’études techniques', status: 'validé' },
  { id: 'DL2', title: 'Dossier d’exécution', status: 'en cours' },
  { id: 'DL3', title: 'Rapport d’avancement trimestriel', status: 'attendu' }
];

/*
 * Two-step flow. The role that executes (project.update) moves an item to its
 * in-progress state; the role that approves (project.validate) closes it.
 * Statuses keep their original strings so the Project Details module is unchanged.
 */
export const WORKFLOW_FLOW = {
  milestone: [
    { from: 'upcoming', to: 'inProgress', permission: 'project.update' },
    { from: 'inProgress', to: 'completed', permission: 'project.validate' }
  ],
  deliverable: [
    { from: 'attendu', to: 'en cours', permission: 'project.update' },
    { from: 'en cours', to: 'validé', permission: 'project.validate' }
  ]
};

/** Next transition for an item, or null when it is already in its final state. */
export function nextStep(kind, status) {
  return WORKFLOW_FLOW[kind]?.find((step) => step.from === status) ?? null;
}

/** Stable translation-key suffix for an item status (see i18n `wf.*`). */
export const WORKFLOW_STATUS_KEY = {
  upcoming: 'upcoming', inProgress: 'inProgress', completed: 'completed',
  attendu: 'expected', 'en cours': 'inProgress', 'validé': 'validated'
};

export function createInitialWorkflow(projects) {
  const workflow = {};
  projects.forEach((project) => {
    const id = project.id ?? project.code;
    const done = project.status === 'completed';
    workflow[id] = {
      milestones: DEMO_MILESTONES.map((item) => ({ ...item, status: done ? 'completed' : item.status })),
      deliverables: DEMO_DELIVERABLES.map((item) => ({ ...item, status: done ? 'validé' : item.status }))
    };
  });
  return workflow;
}
