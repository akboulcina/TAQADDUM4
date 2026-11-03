/*
 * Supplied alerts and map marker coordinates.
 *
 * KPI values are NOT stored here any more: the former `executiveKpis` list
 * (24 projects, 38,6 Mds DZD…) contradicted the 8-project dataset in projects.js.
 * Every KPI is now derived from the projects (see src/roles/portfolio.js).
 *
 * Alert `category` drives role-specific alert views:
 *   schedule | budget | risk | reporting
 */
export const executiveAlerts = [
  { id: 'ALR-118', severity: 'critical', type: 'Retard critique', category: 'schedule', project: 'PRJ-2031', title: 'Retard critique sur le lot structurel', detail: 'Le jalon de réception structurelle est dépassé de 23 jours. Une décision d’arbitrage est requise avant le 15 novembre.', owner: 'Nadia Cherif', date: '2026-10-27' },
  { id: 'ALR-116', severity: 'high', type: 'Dépendance fournisseur', category: 'risk', project: 'PRJ-2035', title: 'Dépendance fournisseur non résolue', detail: 'Le fournisseur d’infrastructure cloud n’a pas confirmé la livraison du lot 3. Impact estimé : 6 semaines.', owner: 'Yacine Hamdi', date: '2026-10-26' },
  { id: 'ALR-114', severity: 'high', type: 'Risque terrain', category: 'risk', project: 'PRJ-2015', title: 'Risque climatique sur les vestiges', detail: 'Les précipitations prévues peuvent affecter les zones de fouille et les équipements de numérisation.', owner: 'Sofiane Merabet', date: '2026-10-25' },
  { id: 'ALR-112', severity: 'medium', type: 'Écart budgétaire', category: 'budget', project: 'PRJ-2024', title: 'Écart de consommation budgétaire', detail: 'Les paiements (48 % du budget) sont inférieurs de 10 points à l’avancement physique (58 %) : l’écart est à justifier avant la prochaine revue.', owner: 'Karim Benali', date: '2026-10-24' }
];

/*
 * Marker coordinates only. Progress, status and project count of each wilaya are
 * derived from the projects (deriveSites) so a marker can never disagree with the
 * project it represents.
 */
export const territorialSites = [
  { wilaya: 'Alger', x: 292, y: 118 },
  { wilaya: 'Oran', x: 148, y: 122 },
  { wilaya: 'Blida', x: 276, y: 132 },
  { wilaya: 'Sétif', x: 372, y: 104 },
  { wilaya: 'Constantine', x: 408, y: 126 },
  { wilaya: 'Annaba', x: 468, y: 116 },
  { wilaya: 'Batna', x: 396, y: 152 },
  { wilaya: 'Biskra', x: 352, y: 184 }
];
