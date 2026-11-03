import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { AttributionControl, GeoJSON, LayerGroup, MapContainer, Marker, Pane, Popup, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import L from './leafletSetup.js';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { MarkerClusterLayer } from './MarkerClusterLayer.jsx';
import { pinIcon } from './markerIcons.js';
import ProjectInfo from './ProjectInfo.jsx';
import { ALGERIA_VIEW_BOUNDS, MAP_MAX_BOUNDS, NEUTRAL_COLOR, STATUS_COLORS, featureForWilaya, wilayaKey } from './mapUtils.js';
import './AlgeriaProjectMap.css';

/*
 * Everything that touches Leaflet lives here, so the rest of the module (filters, panels, i18n)
 * stays plain React and this file — with Leaflet, the cluster plugin and its CSS — can be loaded
 * on demand when the map route is opened.
 *
 * The <MapContainer> is created once. Changing the base map swaps one <TileLayer>; toggling a
 * layer adds or removes that layer only; changing filters only changes the markers' props.
 */

const BRAND = '#2F80ED';
const LEAFLET_PREFIX = '<a href="https://leafletjs.com" title="Leaflet" target="_blank" rel="noopener noreferrer">Leaflet</a>';

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

/* ── Base map ────────────────────────────────────────────────────────────── */

function BasemapLayer({ basemap, onHealth }) {
  const failures = useRef(0);

  // A new base map starts healthy; three tile errors in a row mean the provider is unreachable.
  useEffect(() => {
    failures.current = 0;
    onHealth(true);
  }, [basemap.id, onHealth]);

  const eventHandlers = useMemo(() => ({
    tileerror: () => {
      failures.current += 1;
      if (failures.current >= 3) onHealth(false);
    },
    tileload: () => {
      failures.current = 0;
      onHealth(true);
    }
  }), [onHealth]);

  return (
    <TileLayer
      key={basemap.id}
      url={basemap.url}
      attribution={basemap.attribution}
      maxZoom={basemap.maxZoom}
      maxNativeZoom={basemap.maxNativeZoom}
      eventHandlers={eventHandlers}
    />
  );
}

/* ── Wilaya boundaries / status shading / selection ─────────────────────── */

function WilayaLayers({ geo, layers, basemapId, summary, selectable, selectedWilaya, onSelectWilaya, wilayaIndex, labelFor, t }) {
  const selectedKey = selectedWilaya ? wilayaKey(selectedWilaya) : null;
  const selectedFeature = selectedKey ? featureForWilaya(wilayaIndex, selectedWilaya) : null;
  const geoRef = useRef(null);
  // The handlers are bound once per feature, so they read the latest values through this ref.
  const live = useRef({});
  const outline = basemapId === 'satellite' ? '#ffffff' : '#475569';

  const styleFor = useCallback((feature) => {
    const key = wilayaKey(feature.properties.name);
    const info = summary.get(key);
    const shade = layers.wilayaStatus && info?.status ? STATUS_COLORS[info.status] : null;
    return {
      stroke: layers.boundaries,
      color: outline,
      weight: 1,
      opacity: 0.75,
      fill: true,
      fillColor: shade ?? BRAND,
      fillOpacity: shade ? 0.32 : 0,
      lineJoin: 'round'
    };
  }, [layers.boundaries, layers.wilayaStatus, outline, summary]);

  live.current = { styleFor, summary, selectable, onSelectWilaya, labelFor, t };

  const onEachFeature = useCallback((feature, layer) => {
    const key = wilayaKey(feature.properties.name);
    layer.bindTooltip(() => {
      const { summary: current, labelFor: label, t: translate } = live.current;
      const name = label(feature.properties.name);
      const count = current.get(key)?.count ?? 0;
      return count ? translate('map.tooltip.wilaya', { name, n: count }) : translate('map.tooltip.noProject', { name });
    }, { sticky: true, direction: 'top', className: 'apm-tooltip', opacity: 1 });
    layer.on({
      click: () => {
        const target = live.current.selectable.get(key);
        if (target) live.current.onSelectWilaya(target.name);
      },
      mouseover: (event) => {
        if (live.current.selectable.has(key)) event.target.setStyle({ weight: 2.5, color: BRAND, opacity: 1 });
      },
      mouseout: (event) => event.target.setStyle(live.current.styleFor(feature))
    });
  }, []);

  if (!geo) return null;
  const showBase = layers.boundaries || layers.wilayaStatus;

  return (
    <>
      <Pane name="apm-wilayas" style={{ zIndex: 350 }}>
        {showBase ? <GeoJSON ref={geoRef} data={geo} style={styleFor} onEachFeature={onEachFeature} /> : null}
      </Pane>
      <Pane name="apm-wilaya-selected" style={{ zIndex: 360 }}>
        {selectedFeature ? (
          <GeoJSON
            key={selectedFeature.properties.code}
            data={selectedFeature}
            interactive={false}
            style={{ color: BRAND, weight: 3, opacity: 1, fill: true, fillColor: BRAND, fillOpacity: 0.1 }}
          />
        ) : null}
      </Pane>
    </>
  );
}

/* ── Markers ─────────────────────────────────────────────────────────────── */

const ProjectMarker = memo(function ProjectMarker({ project, color, selected, registry, onSelect, onOpenProject, onZoomProject, t, fmt, lang, dir, wilayaName }) {
  const { latitude, longitude, precision } = project.location;
  const approximate = precision !== 'recorded';
  const icon = useMemo(() => pinIcon({ color, selected, approximate }), [color, selected, approximate]);
  const eventHandlers = useMemo(() => ({ click: () => onSelect(project.id) }), [onSelect, project.id]);
  const setRef = useCallback((marker) => {
    if (marker) registry.set(project.id, marker);
    else registry.delete(project.id);
  }, [registry, project.id]);

  return (
    <Marker
      ref={setRef}
      position={[latitude, longitude]}
      icon={icon}
      title={project.name ?? project.id}
      alt={project.name ?? project.id}
      riseOnHover
      zIndexOffset={selected ? 1000 : 0}
      eventHandlers={eventHandlers}
    >
      <Popup className="apm-popup" minWidth={250} maxWidth={320} autoPanPadding={[24, 24]}>
        <div dir={dir} lang={lang}>
          <ProjectInfo project={project} t={t} fmt={fmt} wilayaName={wilayaName} compact />
          <div className="apm-actions">
            <button type="button" className="apm-btn is-primary" onClick={() => onOpenProject(project.id)}>{t('action.openProjectSheet')}</button>
            <button type="button" className="apm-btn" onClick={() => onZoomProject(project.id)}>{t('map.popup.zoom')}</button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
});

/* ── Controller: size, view requests, focus, fit ─────────────────────────── */

function MapController({ projects, viewRequest, focusRequest, selectedFeature, selectedProjectId, registry, clusterRef }) {
  const map = useMap();
  const reduce = prefersReducedMotion();
  const projectsRef = useRef(projects);
  projectsRef.current = projects;

  // Keep tiles aligned whenever the container changes size (sidebar, panels, window, language).
  useEffect(() => {
    const container = map.getContainer();
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    });
    observer.observe(container);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [map]);

  const fitProjects = useCallback((list) => {
    if (!list.length) {
      map.fitBounds(ALGERIA_VIEW_BOUNDS, { padding: [6, 6], animate: !reduce });
      return;
    }
    const bounds = L.latLngBounds(list.map((project) => [project.location.latitude, project.location.longitude]));
    if (list.length === 1) map.flyTo(bounds.getCenter(), Math.max(map.getZoom(), 9), { animate: !reduce, duration: 0.6 });
    else map.fitBounds(bounds, { padding: [56, 56], maxZoom: 9, animate: !reduce });
  }, [map, reduce]);

  // "Whole Algeria" / "Fit to projects" buttons.
  useEffect(() => {
    if (!viewRequest) return;
    if (viewRequest.type === 'country') map.fitBounds(ALGERIA_VIEW_BOUNDS, { padding: [6, 6], animate: !reduce });
    else fitProjects(projectsRef.current);
  }, [viewRequest, map, reduce, fitProjects]);

  // Selecting a wilaya (map, list, filter or another module) frames it.
  useEffect(() => {
    if (!selectedFeature) return;
    const bounds = L.geoJSON(selectedFeature).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 9, animate: !reduce });
  }, [selectedFeature, map, reduce]);

  // Filters: only move the view when a result would otherwise be off-screen.
  const signature = projects.map((project) => project.id).join('|');
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const list = projectsRef.current;
    if (selectedFeature || !list.length) return;
    const bounds = L.latLngBounds(list.map((project) => [project.location.latitude, project.location.longitude]));
    if (!map.getBounds().contains(bounds)) fitProjects(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a change of the visible set should react
  }, [signature]);

  // Selecting a project from the list: bring it into view and open its popup.
  useEffect(() => {
    if (!focusRequest) return undefined;
    const { id } = focusRequest;
    const project = projectsRef.current.find((item) => item.id === id);
    if (!project) return undefined;
    let opened = false;
    const open = () => {
      if (opened) return;
      opened = true;
      map.off('moveend', open);
      registry.get(id)?.openPopup();
    };
    const marker = registry.get(id);
    const group = clusterRef.current;
    if (marker && group?.hasLayer?.(marker) && group.zoomToShowLayer) {
      group.zoomToShowLayer(marker, open);
      return undefined;
    }
    map.once('moveend', open);
    map.flyTo([project.location.latitude, project.location.longitude], Math.max(map.getZoom(), 9), { animate: !reduce, duration: 0.6 });
    const fallback = setTimeout(open, 1100);
    return () => {
      clearTimeout(fallback);
      map.off('moveend', open);
    };
  }, [focusRequest, map, registry, clusterRef, reduce]);

  // Deselecting closes the popup.
  useEffect(() => {
    if (!selectedProjectId) map.closePopup();
  }, [selectedProjectId, map]);

  return null;
}

/* ── Map ─────────────────────────────────────────────────────────────────── */

export default function ProjectLeafletMap({
  projects, basemap, layers, colorBy, sectorColors, selectedProjectId, onSelectProject, onOpenProject,
  geo, wilayaIndex, wilayaSummary, selectableWilayas, selectedWilaya, onSelectWilaya,
  focusRequest, viewRequest, onTileHealth, labelWilaya, t, fmt, lang, dir
}) {
  const registry = useRef(new Map()).current;
  const clusterRef = useRef(null);
  const reduce = useMemo(prefersReducedMotion, []);
  const rtl = dir === 'rtl';

  const selectedFeature = useMemo(
    () => (selectedWilaya ? featureForWilaya(wilayaIndex, selectedWilaya) : null),
    [selectedWilaya, wilayaIndex]
  );

  const colorFor = useCallback((project) => {
    if (colorBy === 'sector') return sectorColors[project.sector] ?? NEUTRAL_COLOR;
    return STATUS_COLORS[project.status] ?? NEUTRAL_COLOR;
  }, [colorBy, sectorColors]);

  const zoomToProject = useCallback((id) => {
    onSelectProject(id, { focus: true });
  }, [onSelectProject]);

  const Container = layers.clusters ? MarkerClusterLayer : LayerGroup;
  const containerProps = layers.clusters ? { ref: clusterRef, animate: !reduce } : {};
  if (!layers.clusters) clusterRef.current = null;

  return (
    <MapContainer
      className="apm-leaflet"
      bounds={ALGERIA_VIEW_BOUNDS}
      boundsOptions={{ padding: [6, 6] }}
      maxBounds={MAP_MAX_BOUNDS}
      maxBoundsViscosity={0.7}
      minZoom={3}
      maxZoom={17}
      zoomSnap={0.25}
      zoomControl={false}
      attributionControl={false}
      zoomAnimation={!reduce}
      fadeAnimation={!reduce}
      markerZoomAnimation={!reduce}
      style={{ height: '100%', width: '100%' }}
    >
      {/* The attribution control must exist BEFORE the tile layer is added, so that Leaflet counts each
          layer's attribution exactly once and removes it when the base map is switched. */}
      <AttributionControl position={rtl ? 'bottomleft' : 'bottomright'} prefix={LEAFLET_PREFIX} />
      <ZoomControl position={rtl ? 'topright' : 'topleft'} zoomInTitle={t('map.zoomIn')} zoomOutTitle={t('map.zoomOut')} />
      <BasemapLayer basemap={basemap} onHealth={onTileHealth} />
      <MapController
        projects={projects}
        viewRequest={viewRequest}
        focusRequest={focusRequest}
        selectedFeature={selectedFeature}
        selectedProjectId={selectedProjectId}
        registry={registry}
        clusterRef={clusterRef}
      />
      <WilayaLayers
        geo={geo}
        layers={layers}
        basemapId={basemap.id}
        summary={wilayaSummary}
        selectable={selectableWilayas}
        selectedWilaya={selectedWilaya}
        onSelectWilaya={onSelectWilaya}
        wilayaIndex={wilayaIndex}
        labelFor={labelWilaya}
        t={t}
      />
      {layers.projects ? (
        <Container key={layers.clusters ? 'clustered' : 'plain'} {...containerProps}>
          {projects.map((project) => (
            <ProjectMarker
              key={project.id}
              project={project}
              color={colorFor(project)}
              selected={project.id === selectedProjectId}
              registry={registry}
              onSelect={onSelectProject}
              onOpenProject={onOpenProject}
              onZoomProject={zoomToProject}
              t={t}
              fmt={fmt}
              lang={lang}
              dir={dir}
              wilayaName={labelWilaya(project.wilaya)}
            />
          ))}
        </Container>
      ) : null}
    </MapContainer>
  );
}
