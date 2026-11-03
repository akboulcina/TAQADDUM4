import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { KPI_IDS } from '../../kpi/registry.js';
import { CALC_STATES, DIRECTION, LEVEL } from '../../kpi/constants.js';
import { EMPTY_FILTERS, buildRows, filterRows, formatValue, isNotOperational, personaRole, restrictRows, summarizeRows } from '../../kpi/catalogue.js';
import { FAMILIES } from '../../kpi/registry.js';
import KpiDetail from './KpiDetail.jsx';
import { StatePill, StatusPill, Tag } from './kpiUi.jsx';
import './KpiCatalogue.css';

const DIRECTIONS = Object.values(DIRECTION);
const LEVELS = Object.values(LEVEL);

function Select({ label, value, onChange, children }) {
  return <label className="kpr-field"><span>{label}</span><select value={value} onChange={(e) => onChange(e.target.value)}>{children}</select></label>;
}

function DataQuality({ report }) {
  const { t, fmt } = useApp();
  const [open, setOpen] = useState(false);
  const { DO1, DO2, DO3, issues } = report.dataQuality;
  const inconsistent = issues.filter((i) => i.category === 'inconsistent').length;
  const show = (r, unit) => formatValue(r, unit, { fmt, t }) ?? t('kpr.noValue');
  return (
    <section className="kpr-dq" aria-label={t('kpr.dq.title')}>
      <div className="kpr-dq-head">
        <div><h3>{t('kpr.dq.title')}</h3><p>{t('kpr.dq.subtitle')}</p></div>
        <button type="button" className="kpr-link" onClick={() => setOpen(!open)} aria-expanded={open}>{t('kpr.dq.open')}</button>
      </div>
      <div className="kpr-dq-tiles">
        {[[DO1, 'ratio'], [DO2, '%'], [DO3, '%']].map(([r, unit]) => (
          <div key={r.id} className="kpr-dq-tile">
            <span>{r.id}</span>
            <strong>{show(r, unit)}</strong>
            <StateAndStatus r={r} />
          </div>
        ))}
        <div className="kpr-dq-tile"><span>{t('kpr.dq.checks')}</span><strong>{inconsistent}</strong><small>{inconsistent ? t('kpr.dq.issues', { n: inconsistent }) : t('kpr.dq.noIssues')}</small><small>{t('kpr.dq.missingCount', { n: issues.length - inconsistent })}</small></div>
      </div>
      {open ? (
        issues.length ? (
          <table className="kpr-mini kpr-dq-table">
            <thead><tr><th>{t('kpr.dq.project')}</th><th>{t('kpr.dq.field')}</th><th>{t('kpr.dq.issue')}</th></tr></thead>
            <tbody>{issues.map((issue, i) => (
              <tr key={i}><td>{report.projects.find((p) => p.id === issue.projectId)?.name ?? issue.projectId ?? '—'}</td><td>{issue.field ? (t(`kpr.field.${issue.field}`) !== `kpr.field.${issue.field}` ? t(`kpr.field.${issue.field}`) : issue.field) : '—'}</td><td>{t(`kpr.issue.${issue.code}`, { value: issue.value ?? '', count: issue.params?.count ?? '' })}</td></tr>
            ))}</tbody>
          </table>
        ) : <p className="kpr-note">{t('kpr.dq.noIssues')}</p>
      ) : null}
    </section>
  );
}

function StateAndStatus({ r }) {
  return <div className="kpr-dq-badges"><StatePill state={r.state} /><StatusPill status={r.status} /></div>;
}

function Summary({ rows }) {
  const { t } = useApp();
  const s = summarizeRows(rows);
  const tiles = [
    ['total', s.total], ['calculated', s.calculated], ['partial', s.partial], ['missing', s.missing], ['notApplicable', s.notApplicable], ['review', s.review], ['operational', s.operational]
  ];
  return <div className="kpr-summary" role="list">{tiles.map(([key, n]) => <div key={key} role="listitem" className={`kpr-sum kpr-sum-${key}`}><strong>{n}</strong><span>{t(`kpr.summary.${key}`)}</span></div>)}</div>;
}

export default function KpiCatalogue({ report, projects, initialSelectedId = null }) {
  const { t, fmt, user, access } = useApp();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [scope, setScope] = useState('portfolio');
  const [projectId, setProjectId] = useState(() => report.projects[0]?.id ?? null);
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  useEffect(() => { if (initialSelectedId) setSelectedId(initialSelectedId); }, [initialSelectedId]);

  const effectiveProject = report.projects.some((p) => p.id === projectId) ? projectId : report.projects[0]?.id ?? null;
  // Visibility first: rows the persona may not see (blank in 03_Matrice_Roles) are removed before anything else.
  const rows = useMemo(() => restrictRows(buildRows(report, { scope, projectId: effectiveProject }), access.canViewKpi), [report, scope, effectiveProject, access]);
  const profile = access.reference.kpi;
  const role = personaRole(user?.id);
  const visible = useMemo(() => filterRows(rows, filters, { persona: user?.id }), [rows, filters, user]);
  const selected = rows.find((r) => r.kpi.id === selectedId) ?? null;
  const set = (key) => (value) => setFilters((f) => ({ ...f, [key]: value }));
  const filtersActive = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  return (
    <div className="kpr-catalogue">
      <div className="kpr-notices">
        <p className="kpr-banner kpr-banner-prov">{t('kpr.notice.thresholds')}</p>
        <p className="kpr-banner kpr-banner-phase">{t('kpr.notice.phases')}</p>
        <p className="kpr-banner">{t('kpr.notice.demo')}</p>
      </div>

      <div className="kpr-meta">
        <span className="kpr-asof">{t('kpr.asOf', { date: fmt.date(report.referenceDate) })}</span>
        <span>{t('kpr.population', { active: report.population.active, total: report.population.total })}</span>
      </div>

      <p className="kpr-note kpr-roleview" role="note">{t('kpr.roleView', { role: t(`kpr.excelRole.${role}`), visible: profile.visible.length, owned: profile.owned.length, feeds: profile.contributes.length, view: profile.readOnly.length, hidden: profile.hidden.length })}</p>
      <Summary rows={rows} />
      {['DO1', 'DO2', 'DO3'].every((id) => access.canViewKpi(id)) ? <DataQuality report={report} /> : null}

      <section className="kpr-controls" aria-label={t('kpr.filter.search')}>
        <div className="kpr-scope" role="group" aria-label={t('kpr.scope.label')}>
          {['portfolio', 'project'].map((value) => (
            <button key={value} type="button" className={scope === value ? 'on' : ''} aria-pressed={scope === value} onClick={() => setScope(value)}>{t(`kpr.scope.${value}`)}</button>
          ))}
        </div>
        {scope === 'project' ? (
          <Select label={t('kpr.scope.projectSelect')} value={effectiveProject ?? ''} onChange={setProjectId}>
            {report.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        ) : null}
        <p className="kpr-note kpr-scope-hint">{t(scope === 'portfolio' ? 'kpr.scope.portfolioHint' : 'kpr.scope.projectHint')}</p>

        <label className="kpr-field kpr-search"><span>{t('kpr.filter.search')}</span>
          <input type="search" value={filters.query} placeholder={t('kpr.filter.searchPlaceholder')} onChange={(e) => set('query')(e.target.value)} />
        </label>
        <Select label={t('kpr.filter.id')} value={filters.id} onChange={set('id')}>
          <option value="">{t('kpr.filter.all')}</option>
          {KPI_IDS.filter((id) => access.canViewKpi(id)).map((id) => <option key={id} value={id}>{id}</option>)}
        </Select>
        <Select label={t('kpr.filter.family')} value={filters.family} onChange={set('family')}>
          <option value="">{t('kpr.filter.all')}</option>
          {FAMILIES.filter((f) => profile.families.includes(f.code)).map((f) => <option key={f.code} value={f.code}>{f.code} · {t(`kpr.family.${f.code}`)}</option>)}
        </Select>
        <Select label={t('kpr.filter.importance')} value={filters.importance} onChange={set('importance')}>
          <option value="">{t('kpr.filter.all')}</option>
          {['M', 'A', 'S'].map((i) => <option key={i} value={i}>{i} · {t(`kpr.importance.${i}`)}</option>)}
        </Select>
        <Select label={t('kpr.filter.phase')} value={filters.phase} onChange={set('phase')}>
          <option value="">{t('kpr.filter.all')}</option>
          {['MVP', 'V2', 'Vision'].map((p) => <option key={p} value={p}>{t(`kpr.phase.${p}`)}</option>)}
        </Select>
        <Select label={t('kpr.filter.state')} value={filters.state} onChange={set('state')}>
          <option value="">{t('kpr.filter.all')}</option>
          {CALC_STATES.map((s) => <option key={s} value={s}>{t(`kpr.state.${s}`)}</option>)}
        </Select>
        <Select label={t('kpr.filter.direction')} value={filters.direction} onChange={set('direction')}>
          <option value="">{t('kpr.filter.all')}</option>
          {DIRECTIONS.map((d) => <option key={d} value={d}>{t(`kpr.direction.${d}`)}</option>)}
        </Select>
        <Select label={t('kpr.filter.level')} value={filters.level} onChange={set('level')}>
          <option value="">{t('kpr.filter.all')}</option>
          {LEVELS.map((l) => <option key={l} value={l}>{t(`kpr.level.${l}`)}</option>)}
        </Select>
        {role ? (
          <label className="kpr-check"><input type="checkbox" checked={filters.mine} onChange={(e) => set('mine')(e.target.checked)} />{t('kpr.filter.roleMine', { role: t(`kpr.excelRole.${role}`) })}</label>
        ) : null}
        <div className="kpr-controls-foot">
          <span role="status">{t('kpr.filter.results', { n: visible.length })}</span>
          {filtersActive ? <button type="button" className="kpr-link" onClick={() => setFilters(EMPTY_FILTERS)}>{t('kpr.filter.reset')}</button> : null}
        </div>
      </section>

      <div className={`kpr-split${selected ? ' has-detail' : ''}`}>
        <div className="kpr-table-wrap">
          <table className="kpr-table">
            <thead>
              <tr><th>{t('kpr.col.id')}</th><th>{t('kpr.col.name')}</th><th>{t('kpr.col.value')}</th><th>{t('kpr.col.status')}</th><th>{t('kpr.col.state')}</th><th>{t('kpr.col.level')}</th></tr>
            </thead>
            <tbody>
              {visible.map(({ kpi, result, level }) => {
                const value = formatValue(result, kpi.unit, { fmt, t });
                const dist = result?.valueKind === 'distribution';
                const muted = isNotOperational(kpi);
                return (
                  <tr key={kpi.id} className={`${selectedId === kpi.id ? 'sel' : ''}${muted ? ' muted' : ''}`}>
                    <th scope="row">
                      <button type="button" className="kpr-rowbtn" onClick={() => setSelectedId(kpi.id)} aria-current={selectedId === kpi.id ? 'true' : undefined}>{kpi.id}</button>
                    </th>
                    <td className="kpr-name"><span lang="fr">{kpi.name}</span><span className="kpr-tags"><Tag tone={kpi.importance === 'S' ? 'strategic' : kpi.importance === 'M' ? 'must' : 'plain'}>{kpi.importance}</Tag><Tag tone={kpi.phase === 'MVP' ? 'plain' : 'phase'}>{t(`kpr.phase.${kpi.phase}`)}</Tag></span></td>
                    <td className="kpr-val">{dist ? t('kpr.distribution') : value ?? <span className="kpr-dim">{t('kpr.noValue')}</span>}</td>
                    <td><StatusPill status={result?.status} /></td>
                    <td><StatePill state={result?.state} /></td>
                    <td>{t(`kpr.level.${level}`)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 ? <p className="kpr-empty">{t('kpr.filter.none')}</p> : null}
        </div>
        {selected ? <KpiDetail row={selected} scope={scope} report={report} onClose={() => setSelectedId(null)} /> : <aside className="kpr-detail kpr-detail-empty"><p>{t('kpr.detail.empty')}</p></aside>}
      </div>
    </div>
  );
}
