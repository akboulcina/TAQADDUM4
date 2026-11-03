import { useApp } from '../../context/AppContext.jsx';
import PageHeader from '../../app/PageHeader.jsx';
import MetricCard from '../../components/MetricCard.jsx';
import { exportProjectsCsv } from '../../roles/exportCsv.js';
import { resolveKpiDefinition } from './kpiDefinitions.js';
import { PANELS } from './panels/index.js';
import '../executive-dashboard/ExecutiveDashboard.css';
import './RoleDashboard.css';

/*
 * Config-driven landing dashboard. What a persona sees — KPIs, panels, header
 * actions — is declared in src/roles/roleConfig.js (`dashboard`); this component
 * only renders that declaration against the persona's SCOPED data.
 *
 * Props:  scope  output of useRoleScope()
 *         nav    { navigate(routeId), openProject(projectId), openWilaya(name) }
 */
export function RoleDashboard({ scope, nav }) {
  const { t, lang, fmt, user, access } = useApp();
  const { dashboard } = access;
  const formatters = { t, ...fmt };

  const actions = dashboard.actions.filter((action) => (!action.permission || access.can(action.permission)) && (!action.route || access.canAccessRoute(action.route)));
  const runAction = (action) => {
    if (action.kind === 'export') exportProjectsCsv(scope.projects, `taqaddum-${user.id}-portfolio.csv`, { financial: access.canViewFinancials() });
    else nav.navigate(action.route);
  };

  return (
    <section className="role-dashboard" aria-label={t(dashboard.titleKey)}>
      <PageHeader
        title={t(dashboard.titleKey)}
        description={t(dashboard.descriptionKey)}
        actions={actions.map((action) => (
          <button key={action.id} type="button" className={`button${action.primary ? ' primary' : ''}`} onClick={() => runAction(action)}>{t(action.labelKey)}</button>
        ))}
      />
      <p className="role-context">
        <strong>{user.name}</strong> · {user.role[lang]} — {user.focus[lang]}
        {access.scope === 'assigned' ? <span className="rd-scope"> · {t('scope.assignedCount', { n: scope.projects.length })}</span> : null}
      </p>

      <section className="rd-kpis" aria-label={t('dashboard.kpis')}>
        {dashboard.kpis.map((id) => {
          const definition = resolveKpiDefinition(id);
          if (!definition) return null;
          const { value, note, tone } = definition.compute(scope, formatters);
          return <MetricCard key={id} label={definition.labelKey ? t(definition.labelKey) : definition.label} value={value} note={note} tone={tone} />;
        })}
      </section>

      {scope.projects.length === 0 ? (
        <section className="card"><div className="card-body"><p className="table-empty">{t('scope.empty')}</p></div></section>
      ) : (
        <div className="rd-panels">
          {dashboard.panels.map((panel) => {
            const Panel = PANELS[panel.component];
            if (!Panel) return null;
            return (
              <div key={panel.id} className={`rd-panel${panel.span === 'full' ? ' rd-span-full' : ''}`}>
                <Panel scope={scope} nav={nav} props={panel.props ?? {}} />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default RoleDashboard;
