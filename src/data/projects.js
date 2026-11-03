export const projects = [
  { id: 'PRJ-2041', name: 'Modernisation du réseau hydrographique de Constantine', wilaya: 'Constantine', sector: 'Hydraulique', budget: 4820000000, committed: 4180000000, paid: 2960000000, progress: 68, status: 'onTrack', priority: 'high', dueDate: '2027-06-30', manager: 'Sofiane Merabet' },
  { id: 'PRJ-2038', name: 'Numérisation 3D du patrimoine romain de Timgad', wilaya: 'Batna', sector: 'Culture & Patrimoine', budget: 1260000000, committed: 1120000000, paid: 740000000, progress: 74, status: 'onTrack', priority: 'high', dueDate: '2026-12-15', manager: 'Sofiane Merabet' },
  { id: 'PRJ-2035', name: 'Plateforme nationale de suivi des équipements publics', wilaya: 'Alger', sector: 'Transformation numérique', budget: 2350000000, committed: 1980000000, paid: 980000000, progress: 52, status: 'atRisk', priority: 'critical', dueDate: '2027-03-31', manager: 'Yacine Hamdi' },
  { id: 'PRJ-2031', name: 'Réhabilitation du pôle universitaire de Sétif', wilaya: 'Sétif', sector: 'Enseignement supérieur', budget: 3640000000, committed: 2870000000, paid: 1620000000, progress: 41, status: 'delayed', priority: 'critical', dueDate: '2026-11-30', manager: 'Nadia Cherif' },
  { id: 'PRJ-2028', name: 'Extension du réseau routier structurant de l’Est', wilaya: 'Annaba', sector: 'Infrastructures', budget: 7180000000, committed: 6420000000, paid: 4870000000, progress: 79, status: 'onTrack', priority: 'medium', dueDate: '2027-09-30', manager: 'Nadia Cherif' },
  { id: 'PRJ-2024', name: 'Observatoire territorial et géomatique de l’habitat', wilaya: 'Oran', sector: 'Aménagement du territoire', budget: 890000000, committed: 760000000, paid: 430000000, progress: 58, status: 'atRisk', priority: 'high', dueDate: '2027-01-31', manager: 'Lila Mansouri' },
  { id: 'PRJ-2019', name: 'Centre de conservation numérique des archives', wilaya: 'Blida', sector: 'Culture & Patrimoine', budget: 1540000000, committed: 1540000000, paid: 1490000000, progress: 96, status: 'completed', priority: 'medium', dueDate: '2026-08-31', manager: 'Amina Belkacem' },
  { id: 'PRJ-2015', name: 'Sécurisation et valorisation du Limes Africanus', wilaya: 'Biskra', sector: 'Culture & Patrimoine', budget: 1980000000, committed: 1340000000, paid: 610000000, progress: 34, status: 'delayed', priority: 'critical', dueDate: '2026-10-31', manager: 'Sofiane Merabet' }
];

export const projectStatuses = ['onTrack', 'atRisk', 'delayed', 'completed'];

export function countByStatus(items) {
  return projectStatuses.map((status) => ({ status, value: items.filter((project) => project.status === status).length }));
}

export function budgetBySector(items) {
  const sectors = [...new Set(items.map((project) => project.sector))];
  return sectors.map((sector) => {
    const sectorProjects = items.filter((project) => project.sector === sector);
    return { sector, committed: sectorProjects.reduce((total, project) => total + project.committed, 0), paid: sectorProjects.reduce((total, project) => total + project.paid, 0) };
  });
}
