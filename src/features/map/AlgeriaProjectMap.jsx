import { Component, Suspense, lazy, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import ProjectInfo from './ProjectInfo.jsx';
import { BASEMAPS, DEFAULT_BASEMAP, getBasemap } from './basemaps.js';
import {
  EMPTY_FILTERS, NEUTRAL_COLOR, STATUS_COLORS, STATUS_ORDER,
  distinct, filterProjects, indexWilayas, normalizeProjects, sectorColors as buildSectorColors, summarizeWilayas, wilayaKey, wilayaLabel
} from './mapUtils.js';
import './AlgeriaProjectMap.css';

/*
 * Interactive map workspace: filters, base-map selector, layer panel, selection details and
 * a result list around a Leaflet map. The Leaflet code (ProjectLeafletMap) and the wilaya
 * boundaries are loaded on demand, so opening any other module costs nothing.
 *
 * Props (all optional except `projects`):
 *   projects, sites                      scoped project records / territorial records (only the wilaya names are used)
 *   selectedWilaya, onSelectWilaya       shared wilaya selection (controlled when `selectedWilaya` is passed)
 *   filters, onFiltersChange             { query, status, sector } — controlled when `filters` is passed
 *   selectedProjectId, onSelectProject   project highlighted on the map — controlled when passed
 *   onOpenProject(projectId)             opens the existing project-details route
 */

/* ── small helpers ──────────────────────────────────────────────────────── */

// A value that the parent may own (controlled) or that the module keeps itself.
function useControllable(controlled, onChange, initial) {
  const [internal, setInternal] = useState(initial);
  const isControlled = controlled !== undefined;
  const set = useCallback((next) => {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }, [isControlled, onChange]);
  return [isControlled ? controlled : internal, set];
}

function useWilayaGeometry() {
  const [state, setState] = useState({ data: null, failed: false });
  useEffect(() => {
    let cancelled = false;
    import('./data/algeria-wilayas.geo.json')
      .then((module) => { if (!cancelled) setState({ data: module.default, failed: false }); })
      .catch(() => { if (!cancelled) setState({ data: null, failed: true }); });
    return () => { cancelled = true; };
  }, []);
  return state;
}

class MapErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    // The map failing must never take the application down with it.
    console.error('[TAQADDUM map]', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const { t, onRetry } = this.props;
    return (
      <div className="apm-stage-message" role="alert">
        <strong>{t('map.error.title')}</strong>
        <p>{t('map.error.body')}</p>
        <button type="button" className="apm-btn is-primary" onClick={() => { this.setState({ failed: false }); onRetry(); }}>{t('map.error.retry')}</button>
      </div>
    );
  }
}

const PrecisionKey = () => (
  <svg viewBox="0 0 28 14" width="22" height="11" aria-hidden="true" focusable="false">
    <ellipse cx="14" cy="7" rx="11" ry="5" fill="rgba(255,255,255,.5)" stroke="#16202c" strokeOpacity=".7" strokeWidth="1.4" strokeDasharray="2.4 2" />
  </svg>
);

/* ── component ──────────────────────────────────────────────────────────── */

export function AlgeriaProjectMap({
  sites = [], projects = [], selectedWilaya, onSelectWilaya, filters, onFiltersChange, selectedProjectId, onSelectProject, onOpenProject
}) {
  const { t, lang, dir, fmt } = useApp();

  const [wilaya, setWilaya] = useControllable(selectedWilaya, onSelectWilaya, null);
  const [filterState, setFilters] = useControllable(filters, onFiltersChange, EMPTY_FILTERS);
  const [projectId, setProjectId] = useControllable(selectedProjectId, onSelectProject, null);

  const [basemapId, setBasemapId] = useState(DEFAULT_BASEMAP);
  const [layers, setLayers] = useState({ projects: true, clusters: true, boundaries: true, wilayaStatus: false });
  const [colorBy, setColorBy] = useState('status');
  const [tilesHealthy, setTilesHealthy] = useState(true);
  const [focusRequest, setFocusRequest] = useState(null);
  const [viewRequest, setViewRequest] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const geometry = useWilayaGeometry();
  const wilayaIndex = useMemo(() => indexWilayas(geometry.data), [geometry.data]);
  // Re-created on retry so a failed dynamic import is attempted again.
  const LeafletMap = useMemo(() => lazy(() => import('./ProjectLeafletMap.jsx')), [attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  const basemap = getBasemap(basemapId);
  const labelWilaya = useCallback((name) => wilayaLabel(wilayaIndex, name, lang), [wilayaIndex, lang]);

  /* data */
  const all = useMemo(() => normalizeProjects(projects), [projects]);
  const query = useDeferredValue(filterState.query);
  const criteria = useMemo(() => ({ query, status: filterState.status, sector: filterState.sector }), [query, filterState.status, filterState.sector]);
  const filteredAnyWilaya = useMemo(() => filterProjects(all, criteria), [all, criteria]);
  const visible = useMemo(() => (wilaya ? filteredAnyWilaya.filter((project) => wilayaKey(project.wilaya) === wilayaKey(wilaya)) : filteredAnyWilaya), [filteredAnyWilaya, wilaya]);
  const located = useMemo(() => visible.filter((project) => project.location), [visible]);
  const unlocated = useMemo(() => visible.filter((project) => !project.location), [visible]);

  const wilayaNames = useMemo(() => {
    const fromSites = (Array.isArray(sites) ? sites : []).map((site) => ({ wilaya: site?.wilaya ?? site?.name ?? null }));
    return distinct([...fromSites, ...all], 'wilaya');
  }, [sites, all]);
  const sectors = useMemo(() => distinct(all, 'sector'), [all]);
  const sectorColors = useMemo(() => buildSectorColors(all), [all]);
  const selectableWilayas = useMemo(() => summarizeWilayas(all), [all]);
  const wilayaSummary = useMemo(() => summarizeWilayas(filteredAnyWilaya), [filteredAnyWilaya]);

  const selectedProject = useMemo(() => visible.find((project) => project.id === projectId) ?? null, [visible, projectId]);
  const hasApproximate = located.some((project) => project.location.precision !== 'recorded');
  const filtersActive = filterState.query !== '' || filterState.status !== 'all' || filterState.sector !== 'all' || Boolean(wilaya);

  // A project hidden by the filters must not stay selected.
  useEffect(() => {
    if (projectId && !visible.some((project) => project.id === projectId)) setProjectId(null);
  }, [projectId, visible, setProjectId]);

  /* actions */
  const patchFilters = (patch) => setFilters({ ...filterState, ...patch });
  const selectProject = useCallback((id, options) => {
    setProjectId(id);
    if (options?.focus) setFocusRequest({ id, nonce: Date.now() });
  }, [setProjectId]);
  const selectWilaya = useCallback((name) => {
    setProjectId(null);
    setWilaya(name && wilaya && wilayaKey(name) === wilayaKey(wilaya) ? null : name);
  }, [setProjectId, setWilaya, wilaya]);
  const reset = () => {
    setFilters(EMPTY_FILTERS);
    setProjectId(null);
    setWilaya(null);
    setViewRequest({ type: 'country', nonce: Date.now() });
  };
  const toggleLayer = (key) => setLayers((current) => ({ ...current, [key]: !current[key] }));
  const handleHealth = useCallback((healthy) => setTilesHealthy(healthy), []);
  const stableOpenProject = useCallback((id) => onOpenProject?.(id), [onOpenProject]);

  const statusLabel = (status) => t(`status.${status}`);
  const colorOf = (project) => (colorBy === 'sector' ? sectorColors[project.sector] : STATUS_COLORS[project.status]) ?? NEUTRAL_COLOR;

  return (
    <section className="apm" aria-label={t('map.title')} dir={dir}>
      <header className="apm-header">
        <div>
          <h2>{t('map.title')}</h2>
          <p>{t('map.subtitle')}</p>
        </div>
        <span className="apm-badge">{t('map.demoBadge')}</span>
      </header>

      <div className="apm-filters" role="search">
        <label className="apm-field is-search">
          <span>{t('map.search.label')}</span>
          <input
            type="search"
            value={filterState.query}
            placeholder={t('map.search.placeholder')}
            onChange={(event) => patchFilters({ query: event.target.value })}
            autoComplete="off"
          />
        </label>
        <label className="apm-field">
          <span>{t('map.filter.wilaya')}</span>
          <select value={wilaya ?? 'all'} onChange={(event) => { setProjectId(null); setWilaya(event.target.value === 'all' ? null : event.target.value); }}>
            <option value="all">{t('map.filter.allWilayas')}</option>
            {wilayaNames.map((name) => <option key={name} value={name}>{labelWilaya(name)}</option>)}
          </select>
        </label>
        <label className="apm-field">
          <span>{t('map.filter.sector')}</span>
          <select value={filterState.sector} onChange={(event) => patchFilters({ sector: event.target.value })}>
            <option value="all">{t('map.filter.allSectors')}</option>
            {sectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
          </select>
        </label>
        <label className="apm-field">
          <span>{t('map.filter.status')}</span>
          <select value={filterState.status} onChange={(event) => patchFilters({ status: event.target.value })}>
            <option value="all">{t('map.filter.allStatuses')}</option>
            {STATUS_ORDER.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
          </select>
        </label>
        <button type="button" className="apm-btn" onClick={reset} disabled={!filtersActive}>{t('map.filter.reset')}</button>
      </div>

      <div className="apm-workspace">
        <div className="apm-stage-card">
          <div className="apm-stage-bar">
            <div className="apm-basemaps" role="radiogroup" aria-label={t('map.basemap.label')}>
              <span className="apm-basemaps-label" aria-hidden="true">{t('map.basemap.label')}</span>
              {BASEMAPS.map((item) => (
                <label key={item.id} className="apm-seg">
                  <input type="radio" name="apm-basemap" value={item.id} checked={basemapId === item.id} onChange={() => setBasemapId(item.id)} />
                  <span>{t(item.labelKey)}</span>
                </label>
              ))}
            </div>
            <p className="apm-count" aria-live="polite">
              {t('map.count.shown', { shown: fmt.int(visible.length), total: fmt.int(all.length) })}
              {unlocated.length > 0 ? <span> — {t('map.count.unlocated', { n: fmt.int(unlocated.length) })}</span> : null}
            </p>
          </div>

          {!tilesHealthy ? (
            <div className="apm-alert" role="status">{t('map.basemap.tileError', { name: t(basemap.labelKey) })}</div>
          ) : null}

          <div className="apm-stage">
            <MapErrorBoundary t={t} onRetry={() => setAttempt((value) => value + 1)}>
              <Suspense fallback={<div className="apm-stage-message" role="status"><span className="apm-spinner" aria-hidden="true" />{t('map.loading')}</div>}>
                <LeafletMap
                  projects={located}
                  basemap={basemap}
                  layers={layers}
                  colorBy={colorBy}
                  sectorColors={sectorColors}
                  selectedProjectId={selectedProject?.id ?? null}
                  onSelectProject={selectProject}
                  onOpenProject={stableOpenProject}
                  geo={geometry.data}
                  wilayaIndex={wilayaIndex}
                  wilayaSummary={wilayaSummary}
                  selectableWilayas={selectableWilayas}
                  selectedWilaya={wilaya}
                  onSelectWilaya={selectWilaya}
                  focusRequest={focusRequest}
                  viewRequest={viewRequest}
                  onTileHealth={handleHealth}
                  labelWilaya={labelWilaya}
                  t={t}
                  fmt={fmt}
                  lang={lang}
                  dir={dir}
                />
              </Suspense>
            </MapErrorBoundary>
            <div className="apm-tools">
              <button type="button" className="apm-btn is-floating" onClick={() => setViewRequest({ type: 'country', nonce: Date.now() })}>{t('map.view.reset')}</button>
              <button type="button" className="apm-btn is-floating" onClick={() => setViewRequest({ type: 'fit', nonce: Date.now() })} disabled={!located.length}>{t('map.view.fit')}</button>
            </div>
          </div>

          <div className="apm-stage-foot">
            {basemap.nonCommercial ? <p className="apm-note is-warning">{t('map.basemap.nonCommercial')}</p> : null}
            <p className="apm-note">{t('map.keyboard')}</p>
            <details className="apm-sources">
              <summary>{t('map.sources.title')}</summary>
              <ul>
                {BASEMAPS.map((item) => (
                  <li key={item.id}>
                    {t(item.sourceKey)} <a href={item.policyUrl} target="_blank" rel="noopener noreferrer">{t('map.sources.terms')}</a>
                  </li>
                ))}
                <li>{t('map.layers.boundariesNote')}</li>
                <li>{t('map.sources.offline')}</li>
              </ul>
            </details>
          </div>
        </div>

        <aside className="apm-side" aria-label={t('map.layers.title')}>
          <section className="apm-card">
            <h3>{t('map.layers.title')}</h3>
            <div className="apm-checks">
              <label><input type="checkbox" checked={layers.projects} onChange={() => toggleLayer('projects')} /><span>{t('map.layers.projects')}</span></label>
              <label className="is-sub"><input type="checkbox" checked={layers.clusters} disabled={!layers.projects} onChange={() => toggleLayer('clusters')} /><span>{t('map.layers.clusters')}</span></label>
              <label><input type="checkbox" checked={layers.boundaries} disabled={!geometry.data} onChange={() => toggleLayer('boundaries')} /><span>{t('map.layers.boundaries')}</span></label>
              <label><input type="checkbox" checked={layers.wilayaStatus} disabled={!geometry.data} onChange={() => toggleLayer('wilayaStatus')} /><span>{t('map.layers.wilayaStatus')}</span></label>
            </div>
            {geometry.failed ? <p className="apm-note is-warning">{t('map.error.title')}</p> : null}

            <fieldset className="apm-radios" disabled={!layers.projects}>
              <legend>{t('map.layers.colorBy')}</legend>
              <label><input type="radio" name="apm-color" checked={colorBy === 'status'} onChange={() => setColorBy('status')} /><span>{t('map.layers.colorStatus')}</span></label>
              <label><input type="radio" name="apm-color" checked={colorBy === 'sector'} onChange={() => setColorBy('sector')} /><span>{t('map.layers.colorSector')}</span></label>
            </fieldset>

            <ul className="apm-legend">
              {colorBy === 'status'
                ? STATUS_ORDER.map((status) => <li key={status}><i style={{ background: STATUS_COLORS[status] }} />{statusLabel(status)}</li>)
                : sectors.map((sector) => <li key={sector}><i style={{ background: sectorColors[sector] ?? NEUTRAL_COLOR }} />{sector}</li>)}
              {hasApproximate ? <li className="is-approx"><PrecisionKey />{t('map.legend.approx')}</li> : null}
            </ul>
          </section>

          <section className="apm-card" aria-live="polite">
            {selectedProject ? (
              <>
                <div className="apm-card-head">
                  <h3>{t('map.panel.selected')}</h3>
                  <button type="button" className="apm-link" onClick={() => setProjectId(null)}>{t('map.panel.clear')}</button>
                </div>
                <ProjectInfo project={selectedProject} t={t} fmt={fmt} wilayaName={labelWilaya(selectedProject.wilaya)} />
                <div className="apm-actions">
                  <button type="button" className="apm-btn is-primary" onClick={() => stableOpenProject(selectedProject.id)}>{t('action.openProjectSheet')}</button>
                  {selectedProject.location ? <button type="button" className="apm-btn" onClick={() => selectProject(selectedProject.id, { focus: true })}>{t('map.popup.zoom')}</button> : null}
                </div>
              </>
            ) : wilaya ? (
              <>
                <div className="apm-card-head">
                  <h3>{t('map.wilaya.selected')}</h3>
                  <button type="button" className="apm-link" onClick={() => setWilaya(null)}>{t('map.wilaya.clear')}</button>
                </div>
                <p className="apm-wilaya-name">{labelWilaya(wilaya)}</p>
                <p className="apm-muted">{selectableWilayas.has(wilayaKey(wilaya)) ? t('map.count.shown', { shown: fmt.int(visible.length), total: fmt.int(selectableWilayas.get(wilayaKey(wilaya)).count) }) : t('map.wilaya.noProject')}</p>
              </>
            ) : (
              <>
                <h3>{t('map.panel.selected')}</h3>
                <p className="apm-muted">{t('map.panel.hint')}</p>
              </>
            )}
          </section>

          <section className="apm-card">
            <h3>{t('map.panel.results')} <span className="apm-pill">{fmt.int(visible.length)}</span></h3>
            {visible.length === 0 ? (
              <p className="apm-muted">{t('map.panel.empty')}</p>
            ) : (
              <ul className="apm-results">
                {visible.map((project) => (
                  <li key={project.id}>
                    <button type="button" className={project.id === selectedProject?.id ? 'is-active' : ''} aria-current={project.id === selectedProject?.id ? 'true' : undefined} onClick={() => selectProject(project.id, { focus: Boolean(project.location) })}>
                      <i className="apm-dot" style={{ background: colorOf(project) }} aria-hidden="true" />
                      <span className="apm-result-text">
                        <strong>{project.name ?? t('map.field.missing')}</strong>
                        <small>{project.id} · {labelWilaya(project.wilaya) ?? t('map.field.missing')}</small>
                        {!project.location ? <small className="apm-result-issue">{t('map.panel.unlocated')} — {t(`map.issue.${project.locationIssue ?? 'missing'}`)}</small> : null}
                      </span>
                      {project.status ? <StatusBadge status={project.status} label={statusLabel(project.status)} /> : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}

export default AlgeriaProjectMap;
