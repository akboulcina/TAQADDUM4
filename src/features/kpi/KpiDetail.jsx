import { useApp } from '../../context/AppContext.jsx';
import { ALERT_RULES, EXCEL_ROLES } from '../../kpi/registry.js';
import { formatValue, isNotOperational, unitKey } from '../../kpi/catalogue.js';
import { StatePill, StatusPill, Tag, reasonText, useLabels } from './kpiUi.jsx';
import KpiTrendPanel from './KpiTrendPanel.jsx';

const DISTRIBUTION_ORDER = ['green', 'orange', 'red', 'informational', 'not_evaluable'];

function Section({ title, children }) {
  return <section className="kpr-section"><h4>{title}</h4>{children}</section>;
}

function Facts({ items }) {
  return <dl className="kpr-facts">{items.filter(Boolean).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

function ThresholdBlock({ kpi, result, labels }) {
  const { t, fmt } = useApp();
  const th = result?.thresholds;
  const num = (v) => (v === null || v === undefined ? '—' : `${fmt.number(v, 2)}`);
  const hasNumeric = kpi.greenThreshold !== null || kpi.redThreshold !== null;
  return (
    <Section title={t('kpr.detail.thresholds')}>
      <Facts items={[
        [t('kpr.filter.direction'), t(`kpr.direction.${kpi.direction}`)],
        hasNumeric ? [t('kpr.detail.thresholdGreen'), num(th?.green ?? kpi.greenThreshold)] : null,
        hasNumeric ? [t('kpr.detail.thresholdRed'), num(th?.red ?? kpi.redThreshold)] : [t('kpr.detail.thresholds'), t('kpr.detail.noNumericThreshold')]
      ]} />
      <ul className="kpr-rule-texts">
        <li className="g"><b>{t('kpr.status.green')}</b> {kpi.greenText}</li>
        <li className="o"><b>{t('kpr.status.orange')}</b> {kpi.orangeText}</li>
        <li className="r"><b>{t('kpr.status.red')}</b> {kpi.redText}</li>
      </ul>
      <p className="kpr-note">{t('kpr.detail.thresholdsProvisional')}</p>
      {th?.overridden ? <p className="kpr-note kpr-warn">{t('kpr.detail.thresholdsOverridden', { green: num(kpi.greenThreshold), red: num(kpi.redThreshold) })}</p> : null}
      {result?.statusBasis ? <p className="kpr-note">{t(`kpr.statusBasis.${result.statusBasis}`)}</p> : null}
    </Section>
  );
}

function Distribution({ distribution, t }) {
  return (
    <div className="kpr-dist" role="list">
      {DISTRIBUTION_ORDER.map((status) => <span key={status} role="listitem" className={`kpr-dist-chip kpr-status-${status === 'informational' ? 'info' : status === 'not_evaluable' ? 'muted' : status}`}><i aria-hidden="true" />{t(`kpr.status.${status}`)} <b>{distribution[status] ?? 0}</b></span>)}
    </div>
  );
}

export default function KpiDetail({ row, scope, report, onClose }) {
  const { t, fmt } = useApp();
  const labels = useLabels();
  const { kpi, meta, result } = row;
  const value = formatValue(result, kpi.unit, { fmt, t });
  const isDistribution = result?.valueKind === 'distribution';
  const alerts = ALERT_RULES.filter((rule) => rule.kpiIds.includes(kpi.id));
  const coverage = result?.detail?.coverage;
  const projectName = (id) => report.projects.find((p) => p.id === id)?.name ?? id;
  const ownerLine = result?.owner ?? { dataOwner: kpi.dataOwner, kpiOwner: kpi.kpiOwner };
  const unitLabel = t(`kpr.unit.${unitKey(kpi.unit)}`);
  const weights = result?.detail?.weights;

  return (
    <aside className="kpr-detail" aria-label={`${kpi.id} — ${kpi.name}`}>
      <header className="kpr-detail-head">
        <div>
          <p className="kpr-detail-id">{kpi.id} · {t(`kpr.family.${kpi.family}`)}</p>
          <h3>{kpi.name}</h3>
          <div className="kpr-tags">
            <Tag tone={kpi.importance === 'S' ? 'strategic' : kpi.importance === 'M' ? 'must' : 'plain'}>{t(`kpr.importance.${kpi.importance}`)}</Tag>
            <Tag tone={kpi.phase === 'MVP' ? 'plain' : 'phase'} title={t(`kpr.phaseHint.${kpi.phase}`)}>{t(`kpr.phase.${kpi.phase}`)}</Tag>
            <Tag title={t(`kpr.levelHint.${row.level}`)}>{t(`kpr.level.${row.level}`)}</Tag>
          </div>
        </div>
        <button type="button" className="kpr-close" onClick={onClose} aria-label={t('kpr.detail.close')}>×</button>
      </header>

      {isNotOperational(kpi) ? <p className="kpr-banner kpr-banner-phase">{t(`kpr.phaseHint.${kpi.phase}`)} {t('kpr.notice.phases')}</p> : null}

      <div className="kpr-value-card">
        <span className="kpr-value-label">{t('kpr.detail.value')}</span>
        {isDistribution ? <Distribution distribution={result.detail.distribution} t={t} /> : (
          <strong className={`kpr-value${value === null ? ' none' : ''}`}>{value ?? t('kpr.noValue')}</strong>
        )}
        <div className="kpr-value-meta">
          <StatusPill status={result?.status} />
          <StatePill state={result?.state} />
          {result ? <Tag title={t('kpr.readiness.label')}>{t(`kpr.readiness.${result.readiness}`)}</Tag> : null}
          {result ? <Tag title={t('kpr.confidence.label')}>{t('kpr.confidence.label')} : {t(`kpr.confidence.${result.confidence}`)}</Tag> : null}
        </div>
        {result?.state ? <p className="kpr-note">{t(`kpr.stateHint.${result.state}`)}</p> : null}
        {result?.state === 'requires_validation' && value !== null ? <p className="kpr-note kpr-warn">{t('kpr.detail.methodWarning')}</p> : null}
      </div>

      <KpiTrendPanel kpi={kpi} result={result} history={result?.history ?? []} />

      {!result ? <p className="kpr-banner">{t('kpr.detail.perProjectNone')} {t('kpr.scope.projectHint')}</p> : null}

      {result?.reasons?.length ? (
        <Section title={t('kpr.detail.reasons')}>
          <ul className="kpr-list">{result.reasons.map((reason, i) => <li key={`${reason.code}-${i}`}>{reasonText(labels, reason)}</li>)}</ul>
        </Section>
      ) : null}

      {result?.missing?.length ? (
        <Section title={t('kpr.detail.missing')}>
          <ul className="kpr-list kpr-missing">{result.missing.map((f) => <li key={f}>{labels.field(f)} <code>{f}</code></li>)}</ul>
          <p className="kpr-note">{t('kpr.detail.missingOwner', { owner: ownerLine.dataOwner, kpiOwner: ownerLine.kpiOwner })}</p>
        </Section>
      ) : null}

      <Section title={t('kpr.detail.definition')}>
        <p className="kpr-source" lang="fr">{kpi.definition}</p>
        <p className="kpr-note">{t('kpr.notice.sourceText')}</p>
      </Section>
      <Section title={t('kpr.detail.formula')}>
        <p className="kpr-source kpr-formula" lang="fr">{kpi.formula}</p>
        <Facts items={[[t('kpr.detail.unit'), `${kpi.unit}${unitLabel ? ` — ${unitLabel}` : ''}`], [t('kpr.detail.calculability'), kpi.calculability]]} />
      </Section>

      <ThresholdBlock kpi={kpi} result={result} labels={labels} />

      {scope === 'portfolio' || result ? (
        <Section title={t('kpr.detail.aggregation')}>
          <p><b>{t(`kpr.aggregation.${meta.aggregation}`)}</b></p>
          <p className="kpr-note">{t(`kpr.aggregationDoc.${meta.aggregation}`)}</p>
          <p className="kpr-note">{t('kpr.detail.population', { population: t(`kpr.population.${meta.population}`) })}</p>
          {coverage ? (
            <p className="kpr-note">{t('kpr.detail.coverage', { used: coverage.used, total: coverage.population })}{coverage.notApplicable ? ` · ${t('kpr.detail.notApplicableCount', { n: coverage.notApplicable })}` : ''}</p>
          ) : null}
          {coverage?.excluded?.length ? (
            <details className="kpr-excluded">
              <summary>{t('kpr.detail.excluded')} ({coverage.excluded.length})</summary>
              <ul className="kpr-list">{coverage.excluded.map((e) => <li key={e.projectId}><b>{projectName(e.projectId)}</b> — {t(`kpr.state.${e.state}`)}{e.missing?.length ? ` : ${labels.fields(e.missing)}` : ''}</li>)}</ul>
            </details>
          ) : null}
        </Section>
      ) : null}

      {weights ? (
        <Section title={t('kpr.detail.weights')}>
          <Facts items={Object.entries(weights).map(([key, w]) => [key, `${fmt.number(w * 100, 0)} %`])} />
        </Section>
      ) : null}

      {result?.detail?.contractors?.length && kpi.id === 'CO2' ? (
        <Section title={t('kpr.detail.contractors')}>
          <Facts items={result.detail.contractors.map((c) => [c.id, fmt.percent(c.share, 1)])} />
        </Section>
      ) : null}

      {result?.detail?.markets?.length && meta.level === 'market' && Array.isArray(result.detail.markets) && typeof result.detail.markets[0] === 'object' ? (
        <Section title={t('kpr.detail.markets')}>
          <Facts items={result.detail.markets.map((m) => [`${m.projectId ? `${m.projectId} · ` : ''}${m.id}`, formatValue({ value: m.value }, kpi.unit, { fmt, t }) ?? t('kpr.noValue')])} />
        </Section>
      ) : null}

      {result?.detail?.byCause ? (
        <Section title={t('kpr.detail.byCause')}>
          <Facts items={Object.entries(result.detail.byCause).map(([cause, n]) => [t(`kpr.cause.${cause}`), n])} />
        </Section>
      ) : null}

      {scope === 'portfolio' && meta.hasProjectValue ? (
        <Section title={t('kpr.detail.perProject')}>
          <table className="kpr-mini">
            <tbody>
              {report.projects.map((p) => {
                const r = p.kpis[kpi.id];
                const v = formatValue(r, kpi.unit, { fmt, t });
                return <tr key={p.id}><th scope="row">{p.name}</th><td>{v ?? <span className="kpr-dim">{t('kpr.noValue')}</span>}</td><td><StatusPill status={r.status} /></td><td><StatePill state={r.state} /></td></tr>;
              })}
            </tbody>
          </table>
        </Section>
      ) : null}
      {scope === 'portfolio' && !meta.hasProjectValue ? <p className="kpr-note">{t('kpr.detail.perProjectNone')}</p> : null}

      <Section title={t('kpr.detail.sources')}>
        <Facts items={[
          [t('kpr.detail.tables'), kpi.dataSourceTables.join(', ')],
          [t('kpr.detail.dataOwner'), kpi.dataOwner],
          [t('kpr.detail.kpiOwner'), kpi.kpiOwner],
          [t('kpr.detail.frequency'), kpi.targetFrequency],
          [t('kpr.detail.dataAsOf'), result?.dataAsOf ? fmt.date(result.dataAsOf) : t('kpr.detail.dataAsOfNone')],
          [t('kpr.detail.computedOn'), fmt.date(report.referenceDate)]
        ]} />
      </Section>

      <Section title={t('kpr.detail.roles')}>
        <ul className="kpr-roles">
          {EXCEL_ROLES.map((role) => {
            const access = kpi.roleAccess[role.key];
            return <li key={role.key}><span>{t(`kpr.excelRole.${role.key}`)}</span><b className={`kpr-access kpr-access-${access ?? 'none'}`}>{access ? `${access} · ${t(`kpr.roleAccess.${access}`)}` : t('kpr.roleAccess.none')}</b></li>;
          })}
        </ul>
        <p className="kpr-note">{t('kpr.detail.rolesNote')}</p>
      </Section>

      <Section title={t('kpr.detail.alerts')}>
        {alerts.length ? (
          <ul className="kpr-list">{alerts.map((rule) => <li key={rule.id}><b>{rule.id}</b> <span lang="fr">{rule.name}</span> <Tag tone={rule.level === 'ROUGE' ? 'strategic' : 'phase'}>{t(`kpr.alertLevel.${rule.level}`)}</Tag></li>)}</ul>
        ) : <p className="kpr-note">{t('kpr.detail.alertsNone')}</p>}
        {alerts.length ? <p className="kpr-note">{t('kpr.detail.alertsNote')}</p> : null}
      </Section>

      <Section title={t('kpr.detail.justification')}>
        <p className="kpr-source" lang="fr">{kpi.justification}</p>
      </Section>
    </aside>
  );
}
