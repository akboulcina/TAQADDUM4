const iconPaths = {
  dashboard: 'M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-4H4v4Zm10-11h6V4h-6v5Z',
  portfolio: 'M3 7h18v12H3zM8 7V5h8v2',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14',
  performance: 'M4 20V10m5 10V4m5 16v-7m5 7V8',
  alerts: 'M12 4a6 6 0 0 1 6 6v4l2 3H4l2-3v-4a6 6 0 0 1 6-6Zm-2 16h4',
  collaboration: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20c0-3 3-5 6-5s6 2 6 5m2-5c3 0 6 2 6 5',
  projects: 'M6 3h9l4 4v14H6zM9 12h7M9 16h7',
  reports: 'M6 3h9l4 4v14H6zM9 12h7M9 16h5'
};

export const routes = [
  { id: 'dashboard', section: 'pilotage', labelKey: 'nav.dashboard', icon: 'dashboard' },
  { id: 'portfolio', section: 'pilotage', labelKey: 'nav.portfolio', icon: 'portfolio' },
  { id: 'map', section: 'pilotage', labelKey: 'nav.map', icon: 'map' },
  { id: 'kpi', section: 'pilotage', labelKey: 'nav.performance', icon: 'performance' },
  { id: 'alerts', section: 'pilotage', labelKey: 'nav.alerts', icon: 'alerts', badge: 7 },
  { id: 'collaboration', section: 'operations', labelKey: 'nav.collaboration', icon: 'collaboration' },
  { id: 'project-details', section: 'operations', labelKey: 'nav.projects', icon: 'projects' },
  { id: 'reports', section: 'operations', labelKey: 'nav.reports', icon: 'reports' }
];

export function getRoute(routeId) {
  return routes.find((route) => route.id === routeId) ?? routes[0];
}

export function getIconPath(name) {
  return iconPaths[name] ?? iconPaths.dashboard;
}
