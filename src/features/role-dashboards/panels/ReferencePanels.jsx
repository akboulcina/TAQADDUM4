import { useMemo } from 'react';
import { useApp } from '../../../context/AppContext.jsx';
import ChartCard from '../../../components/ChartCard.jsx';
import ExecutiveAlerts from '../../executive-dashboard/components/ExecutiveAlerts.jsx';
import { buildRows, formatValue } from '../../../kpi/catalogue.js';
import { StatePill, StatusPill } from '../../kpi/kpiUi.jsx';
import { PENDING_DECISIONS } from '../../../roles/roleReference.js';
import '../../kpi/KpiCatalogue.css';
import { Empty, Pill, Row } from './ui.jsx';

/*
 * Panels that render what the workbook says a role may see. They never decide
 * visibility themselves: every list below is filtered through `access`
 * (canViewKpi / canViewRuleAlert), on the already-scoped data of useRoleScope().
 */

const RIGHT_TONE = { R: 'success', S: 'info', V: 'neutral' };
const IMPORTANCE_RANK = { S: 0, M: 1, A: 2 };
const RIGHT_RANK = { R: 0, S: 1, V: 2 };

/**
 * Rule alerts of the persona (D = must act, I = informed), on its scoped projects only.
 * props: titleKey, subtitleKey, emptyKey, severities ('critical' | 'high'), limit
 */
export function RuleAlertsPanel({ scope, nav, props = {} }) {
  const { t, access } = useApp();
  const profile = access.reference;
  const alerts = scope.openAlerts
    .filter((alert) => !props.severities || props.severities.includes(alert.severity))
    .slice(0, props.limit ?? 5);
  const mine = useMemo(() => scope.ruleEvaluations.filter((item) => access.alertRecipientCode(item.ruleId)), [scope.ruleEvaluations, access]);
  const inconclusive = mine.filter((item) => item.status !== 'evaluable').length;
  const hasRole = profile.alerts.visible.length > 0;

  return (
    <div className="rd-alerts-wrap">
      <ExecutiveAlerts
        alerts={alerts}
        title={t(props.titleKey ?? 'panel.ruleAlerts.title')}
        subtitle={props.subtitleKey ? t(props.subtitleKey) : undefined}
        emptyLabel={hasRole ? (props.emptyKey ? t(props.emptyKey) : t('panel.ruleAlerts.empty')) : t('panel.ruleAlerts.noRole')}
        onViewAll={access.canAccessRoute('alerts') ? () => nav.navigate('alerts') : undefined}
        onOpenProject={nav.openProject}
      />
      <p className="rd-hint rd-coverage">
        {hasRole
          ? t('panel.ruleAlerts.coverage', { d: profile.alerts.decide.length, i: profile.alerts.inform.length, bad: inconclusive, all: mine.length })
          : t('panel.ruleAlerts.noRoleHint')}
      </p>
    </div>
  );
}

/**
 * Compact list of the referentiel KPIs the persona may see, chosen by the workspace config.
 * props: titleKey, subtitleKey, families[], rights[] (subset of R,S,V), importance[], sort ('right' | 'importance'), limit
 * KPIs the persona cannot see never reach the list (access.canViewKpi), whatever the props ask for.
 */
export function KpiShelfPanel({ scope, nav, props = {} }) {
  const { t, fmt, access } = useApp();
  const rows = useMemo(() => (scope.kpiReport ? buildRows(scope.kpiReport) : []), [scope.kpiReport]);

  const candidates = rows
    .filter(({ kpi }) => access.canViewKpi(kpi.id))
    .filter(({ kpi }) => !props.families || props.families.includes(kpi.family))
    .filter(({ kpi }) => !props.rights || props.rights.includes(access.kpiRight(kpi.id)))
    .filter(({ kpi }) => !props.importance || props.importance.includes(kpi.importance));
  const hasValue = (row) => row.result && row.result.value !== null && row.result.value !== undefined;
  const sorted = [...candidates].sort((a, b) => (
    Number(hasValue(b)) - Number(hasValue(a))
    || (props.sort === 'importance' ? IMPORTANCE_RANK[a.kpi.importance] - IMPORTANCE_RANK[b.kpi.importance] : 0)
    || RIGHT_RANK[access.kpiRight(a.kpi.id)] - RIGHT_RANK[access.kpiRight(b.kpi.id)]
  ));
  const shown = sorted.slice(0, props.limit ?? 6);
  const valued = candidates.filter(hasValue).length;

  return (
    <ChartCard
      title={t(props.titleKey ?? 'kpr.panel.title')}
      subtitle={props.subtitleKey ? t(props.subtitleKey) : undefined}
      action={access.canAccessRoute('kpi') && access.reference.kpi.visible.length ? <button type="button" className="rd-button ghost" onClick={() => nav.navigate('kpi')}>{t('kpr.panel.open')}</button> : null}
    >
      {!access.reference.kpi.visible.length ? <Empty>{t('shelf.noRole')}</Empty> : shown.length === 0 ? <Empty>{t('shelf.none')}</Empty> : (
        <>
          <p className="kpr-note">{t('shelf.counts', { shown: shown.length, total: candidates.length, valued })}</p>
          <div className="rd-list">
            {shown.map(({ kpi, result }) => {
              const right = access.kpiRight(kpi.id);
              const value = hasValue({ result }) ? formatValue(result, kpi.unit, { fmt, t }) : null;
              return (
                <Row
                  key={kpi.id}
                  title={<><span>{kpi.id}</span> <span className="rd-inline" lang="fr">{kpi.name}</span></>}
                  meta={<><Pill tone={RIGHT_TONE[right]}>{right} · {t(`kpr.roleAccess.${right}`)}</Pill> {value === null ? <StatePill state={result?.state ?? 'not_implemented'} /> : null}</>}
                  aside={value === null ? <span className="kpr-dim">{t('kpr.noValue')}</span> : <><strong>{value}</strong> <StatusPill status={result.status} /></>}
                />
              );
            })}
          </div>
        </>
      )}
    </ChartCard>
  );
}

/** Open decisions of roleReference.js that concern the persona — what is NOT resolved and what the app does meanwhile. */
export function PendingDecisionsPanel({ props = {} }) {
  const { t, user } = useApp();
  const decisions = useMemo(() => {
    return PENDING_DECISIONS.filter((decision) => decision.affects.includes(user?.id));
  }, [user]);

  return (
    <ChartCard title={t(props.titleKey ?? 'panel.pending.title')} subtitle={t(props.subtitleKey ?? 'panel.pending.subtitle')}>
      {decisions.length === 0 ? <Empty>{t('panel.pending.empty')}</Empty> : (
        <div className="rd-list">
          {decisions.map((decision) => (
            <Row
              key={decision.id}
              title={<><span>{decision.id}</span> <span className="rd-inline" lang="fr">{decision.subject}</span></>}
              meta={<span lang="fr">{decision.safeDefault}</span>}
              aside={<Pill tone="warning">{t('panel.pending.open')}</Pill>}
            />
          ))}
        </div>
      )}
    </ChartCard>
  );
}
