import { useApp } from '../../../context/AppContext.jsx';
import PortfolioHealth from '../../executive-dashboard/components/PortfolioHealth.jsx';
import BudgetPerformance from '../../executive-dashboard/components/BudgetPerformance.jsx';
import AlgeriaMapPreview from '../../executive-dashboard/components/AlgeriaMapPreview.jsx';
import PriorityProjects from '../../executive-dashboard/components/PriorityProjects.jsx';
import ExecutiveAlerts from '../../executive-dashboard/components/ExecutiveAlerts.jsx';

// Thin adapters: the original executive widgets, fed with the persona's SCOPED data.

export function HealthPanel({ scope }) {
  return <PortfolioHealth projects={scope.projects} />;
}

export function BudgetPanel({ scope }) {
  return <BudgetPerformance projects={scope.projects} />;
}

export function SiteMapPanel({ scope, nav, props }) {
  const { access } = useApp();
  const mapAllowed = access.canAccessRoute('map');
  return (
    <AlgeriaMapPreview
      sites={scope.sites}
      limit={props?.primaryCta ? 8 : 5}
      onOpenMap={mapAllowed ? () => nav.navigate('map') : undefined}
      onSelectWilaya={mapAllowed ? nav.openWilaya : undefined}
    />
  );
}

export function PriorityProjectsPanel({ scope, nav }) {
  return <PriorityProjects projects={scope.projects} onOpenProject={nav.openProject} />;
}

/** Open alerts of the persona's alert view (see `alertView` in roleConfig.js). */
export function AlertListPanel({ scope, nav, props }) {
  const { t, access } = useApp();
  const alerts = scope.openAlerts
    .filter((alert) => !props.severities || props.severities.includes(alert.severity))
    .slice(0, props.limit ?? 5);
  return (
    <ExecutiveAlerts
      alerts={alerts}
      title={t(props.titleKey)}
      subtitle={props.subtitleKey ? t(props.subtitleKey) : undefined}
      emptyLabel={props.emptyKey ? t(props.emptyKey) : undefined}
      onViewAll={access.canAccessRoute('alerts') ? () => nav.navigate('alerts') : undefined}
      onOpenProject={nav.openProject}
    />
  );
}
