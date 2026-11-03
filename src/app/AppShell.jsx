import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useDemoState } from '../context/DemoStateContext.jsx';
import { useRoleScope } from '../roles/useRoleScope.js';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import AccessRestricted from './AccessRestricted.jsx';
import { getRoute } from './routes.jsx';
import RoleDashboard from '../features/role-dashboards/RoleDashboard.jsx';
import PortfolioModule from '../features/portfolio/PortfolioModule.jsx';
import { AlgeriaProjectMap } from '../features/map/AlgeriaProjectMap.jsx';
import { EMPTY_FILTERS } from '../features/map/mapUtils.js';
import { KpiModule } from '../features/kpi/KpiModule.jsx';
import { AlertsModule } from '../features/alerts/AlertsModule.jsx';
import { CollaborationModule } from '../features/collaboration/CollaborationModule.jsx';
import { ProjectDetailsModule } from '../features/project-details/ProjectDetailsModule.jsx';
import ReportsModule from '../features/reports/ReportsModule.jsx';

// Routes on which the "limited to your assigned projects" notice is shown.
const SCOPED_ROUTES = new Set(['portfolio', 'alerts', 'reports', 'collaboration', 'project-details']);

export default function AppShell({ activeRoute, onNavigate }) {
  const { t, lang, dir, user, fmt, access } = useApp();
  const demo = useDemoState();
  const scope = useRoleScope();
  const [selectedProjectId, setSelectedProjectId] = useState(scope.defaultProjectId);
  const [selectedWilaya, setSelectedWilaya] = useState(null);
  const [selectedKpiId, setSelectedKpiId] = useState(null);
  // Map filters and the project highlighted on the map live here so they survive leaving the map and coming back.
  const [mapFilters, setMapFilters] = useState(EMPTY_FILTERS);
  const [mapProjectId, setMapProjectId] = useState(null);

  // ROUTE GUARD (demo-level): a route the role does not allow never renders, whatever called navigate().
  const allowed = access.canAccessRoute(activeRoute);
  const route = getRoute(activeRoute);
  const labelKey = allowed ? access.labelKeyFor(route.id, route.labelKey) : 'access.restricted.title';

  const selectedProject = useMemo(() => scope.projects.find((project) => project.id === selectedProjectId) ?? null, [scope.projects, selectedProjectId]);

  const nav = {
    navigate: onNavigate,
    // Only projects in the persona's scope can be opened.
    openProject: (projectId) => { if (scope.projectIds.has(projectId)) { setSelectedProjectId(projectId); onNavigate('project-details'); } },
    openWilaya: (wilaya) => { setSelectedWilaya(wilaya); onNavigate('map'); }
  };

  const activity = scope.activity.map((entry) => ({ ...entry, time: fmt.date(entry.time) }));

  const notice = (() => {
    if (access.scope === 'assigned' && SCOPED_ROUTES.has(route.id)) return t('notice.assignedScope', { n: scope.projects.length });
    if (route.id === 'alerts' && (access.alertView.categories || access.alertView.minSeverity)) return t('notice.alertView');
    if (route.id === 'project-details' && access.readOnly.projects) return t('notice.readOnlyProjects');
    return null;
  })();

  const renderRoute = () => {
    if (!allowed) return <AccessRestricted onBack={() => onNavigate(access.landing)} />;
    switch (route.id) {
      case 'dashboard':
        return <RoleDashboard scope={scope} nav={nav} />;
      case 'portfolio':
        return <PortfolioModule projects={scope.projects} user={user} canViewFinancials={access.canViewFinancials()} onSelectProject={nav.openProject} />;
      case 'map':
        return (
          <AlgeriaProjectMap
            sites={scope.sites}
            projects={scope.projects}
            selectedWilaya={selectedWilaya}
            onSelectWilaya={setSelectedWilaya}
            filters={mapFilters}
            onFiltersChange={setMapFilters}
            selectedProjectId={mapProjectId}
            onSelectProject={setMapProjectId}
            onOpenProject={nav.openProject}
          />
        );
      case 'kpi':
        return <KpiModule projects={scope.projects} user={user} financial={access.canViewFinancials()} selectedKpiId={selectedKpiId} />;
      case 'alerts':
        return (
          <AlertsModule
            projects={scope.projects}
            user={user}
            actionState={demo.alertStates}
            alertRecords={demo.alertRecords}
            notifications={demo.notifications}
            evaluations={scope.ruleEvaluations}
            onMarkNotificationRead={demo.markNotificationRead}
            onUpdateAssignment={demo.updateAlertAssignment}
            onAction={demo.actOnAlert}
            canAct={(alert, state) => access.canActOnRuleAlert(alert, state, scope.allProjectsById.get(alert.projectId))}
            onOpenProject={nav.openProject}
            onOpenKpi={(kpiId) => { if (access.canViewKpi(kpiId)) { setSelectedKpiId(kpiId); onNavigate('kpi'); } }}
            labels={{ noPermission: t('hint.noPermission') }}
          />
        );
      case 'collaboration':
        return <CollaborationModule user={user} projects={scope.projects} activity={activity} />;
      case 'project-details': {
        const workflow = selectedProject ? demo.workflow[selectedProject.id] : null;
        return (
          <ProjectDetailsModule
            key={selectedProject?.id ?? 'none'}
            project={selectedProject}
            user={user}
            onBack={() => onNavigate('portfolio')}
            workflow={workflow}
            onAdvance={(kind, itemId) => demo.advanceWorkflowItem(selectedProject.id, kind, itemId)}
            permissions={{
              update: access.canActOnProject('project.update', selectedProject),
              validate: access.canActOnProject('project.validate', selectedProject),
              note: access.canActOnProject('project.note', selectedProject),
              financial: access.canViewFinancials()
            }}
            labels={{ start: t('action.start'), validate: t('action.validate'), noPermission: t('hint.noPermission'), forbidden: t('notice.forbidden'), notesReadOnly: t('notice.notesReadOnly'), demoWorkflow: t('demo.workflowTag') }}
          />
        );
      }
      case 'reports':
        return <ReportsModule projects={scope.projects} user={user} canExport={access.can('report.export')} canViewFinancials={access.canViewFinancials()} labels={{ noPermission: t('hint.noPermission') }} />;
      default:
        return <AccessRestricted onBack={() => onNavigate(access.landing)} />;
    }
  };

  return (
    <div className="app-shell" dir={dir} lang={lang}>
      <Sidebar activeRoute={activeRoute} onNavigate={onNavigate} badges={scope.badges} />
      <div className="main-area">
        <TopBar labelKey={labelKey} openAlerts={scope.badges.alertsOpen} projectCount={scope.projects.length} />
        <main className="content">
          <div className="demo-banner"><span className="demo-dot" /><span>{t('demo.banner')}</span></div>
          {notice && route.id !== 'dashboard' && allowed ? <div className="access-notice" role="note">{notice}</div> : null}
          {renderRoute()}
          <footer className="app-footer">{t('footer.demo')} · {user.role[lang]}</footer>
        </main>
      </div>
    </div>
  );
}
