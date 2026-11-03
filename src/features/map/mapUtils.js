import { projectLocations, LOCATION_PRECISION } from '../../data/projectLocations.js';
import { STATUS_RANK } from '../../roles/portfolio.js';

/* Pure helpers for the interactive map. No React, no Leaflet: also exercised by scripts/verify-map.mjs. */

export const STATUS_ORDER = ['onTrack', 'atRisk', 'delayed', 'completed'];
export const STATUS_COLORS = { onTrack: '#12805C', atRisk: '#D97706', delayed: '#B42318', completed: '#4B5565' };
// Hues kept away from the four status colours so "colour by sector" is never mistaken for a status.
export const SECTOR_PALETTE = ['#2F80ED', '#7C5CD6', '#C2408A', '#0E9AA7', '#8A6D3B', '#3730A3', '#6B7F1A', '#0369A1'];
export const NEUTRAL_COLOR = '#7D8B9A';

// Initial extent of the map (south-west, north-east): Algeria's territory with a small margin.
export const ALGERIA_VIEW_BOUNDS = [[18.9, -8.8], [37.2, 12.1]];
// Panning is limited to a wide region around Algeria so the user cannot lose the country. The limit must stay
// generous: Leaflet cancels any pan (including a popup's auto-pan) that would push the view outside it.
export const MAP_MAX_BOUNDS = [[-5, -40], [60, 50]];
// A coordinate outside this box is treated as a data error rather than plotted in the sea or in Europe.
const PLAUSIBLE_BOUNDS = { minLat: 17, maxLat: 39, minLng: -10, maxLng: 14 };

export const asNumber = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

/** Lower-case, accent-free, alphanumeric-only text, used for search and for wilaya name matching. */
export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
    .trim();
}

const isPlausible = (latitude, longitude) =>
  latitude >= PLAUSIBLE_BOUNDS.minLat && latitude <= PLAUSIBLE_BOUNDS.maxLat && longitude >= PLAUSIBLE_BOUNDS.minLng && longitude <= PLAUSIBLE_BOUNDS.maxLng;

/**
 * Where a project sits on the map.
 *   1. its own latitude/longitude (or lat/lon/lng)      → precision 'recorded'
 *   2. the labelled demo table in src/data/projectLocations.js
 *   3. nothing                                          → { location: null, locationIssue }
 * An invalid or implausible own coordinate is reported, never silently replaced by a guess.
 */
export function resolveLocation(project, id) {
  const latitude = asNumber(project.latitude) ?? asNumber(project.lat);
  const longitude = asNumber(project.longitude) ?? asNumber(project.lon) ?? asNumber(project.lng);
  const hasOwn = project.latitude != null || project.lat != null || project.longitude != null || project.lon != null || project.lng != null;
  if (latitude != null && longitude != null) {
    if (isPlausible(latitude, longitude)) return { location: { latitude, longitude, precision: LOCATION_PRECISION.RECORDED }, locationIssue: null };
    return { location: null, locationIssue: 'outOfRange' };
  }
  if (hasOwn) return { location: null, locationIssue: 'invalid' };
  const demo = projectLocations[id];
  if (demo && isPlausible(demo.latitude, demo.longitude)) {
    return { location: { latitude: demo.latitude, longitude: demo.longitude, precision: demo.precision, place: demo.place }, locationIssue: null };
  }
  return { location: null, locationIssue: 'missing' };
}

export function normalizeProject(project, index = 0) {
  if (!project || typeof project !== 'object') return null;
  const id = String(project.id ?? project.code ?? `row-${index}`);
  const { location, locationIssue } = resolveLocation(project, id);
  return {
    id,
    name: project.name ?? project.title ?? null,
    wilaya: project.wilaya ?? project.region ?? null,
    sector: project.sector ?? project.category ?? null,
    status: STATUS_ORDER.includes(project.status) ? project.status : null,
    progress: asNumber(project.progress),
    budget: asNumber(project.budget),
    dueDate: project.dueDate ?? null,
    manager: project.manager ?? null,
    location,
    locationIssue
  };
}

export const normalizeProjects = (projects) => (Array.isArray(projects) ? projects : []).map(normalizeProject).filter(Boolean);

/** Distinct, sorted, non-empty values of one field. */
export const distinct = (items, field) => [...new Set(items.map((item) => item[field]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));

/** Sector → colour. Stable: the colour depends on the sorted position among all sectors in scope. */
export function sectorColors(projects) {
  return Object.fromEntries(distinct(projects, 'sector').map((sector, index) => [sector, SECTOR_PALETTE[index % SECTOR_PALETTE.length]]));
}

export const EMPTY_FILTERS = Object.freeze({ query: '', status: 'all', sector: 'all' });

export function filterProjects(projects, { query = '', status = 'all', sector = 'all', wilaya = null } = {}) {
  const tokens = normalizeText(query).split(' ').filter(Boolean);
  return projects.filter((project) => {
    if (status !== 'all' && project.status !== status) return false;
    if (sector !== 'all' && project.sector !== sector) return false;
    if (wilaya && project.wilaya !== wilaya) return false;
    if (!tokens.length) return true;
    const haystack = normalizeText(`${project.name ?? ''} ${project.id}`);
    return tokens.every((token) => haystack.includes(token));
  });
}

/* ── Wilayas ─────────────────────────────────────────────────────────────── */

const WILAYA_ALIASES = { algiers: 'alger', 'el djazair': 'alger' };

export const wilayaKey = (name) => {
  const key = normalizeText(name);
  return WILAYA_ALIASES[key] ?? key;
};

/** key → GeoJSON feature, indexed by French/Latin name and by Arabic name. */
export function indexWilayas(collection) {
  const index = new Map();
  (collection?.features ?? []).forEach((feature) => {
    index.set(wilayaKey(feature.properties.name), feature);
    if (feature.properties.nameAr) index.set(normalizeText(feature.properties.nameAr), feature);
  });
  return index;
}

export const featureForWilaya = (index, name) => index.get(wilayaKey(name)) ?? null;

/** Wilaya name as shown in the UI: Arabic when the UI is Arabic and the boundary data knows it. */
export function wilayaLabel(index, name, lang) {
  if (!name) return null;
  if (lang !== 'ar') return name;
  return featureForWilaya(index, name)?.properties.nameAr || name;
}

/** wilaya key → { name, count, status (the worst one), progress (mean) } over the given projects. */
export function summarizeWilayas(projects) {
  const groups = new Map();
  projects.forEach((project) => {
    if (!project.wilaya) return;
    const key = wilayaKey(project.wilaya);
    if (!groups.has(key)) groups.set(key, { name: project.wilaya, items: [] });
    groups.get(key).items.push(project);
  });
  const summary = new Map();
  groups.forEach(({ name, items }, key) => {
    const withStatus = items.filter((item) => item.status);
    const active = withStatus.filter((item) => item.status !== 'completed');
    const pool = active.length ? active : withStatus;
    const status = pool.length ? pool.reduce((worst, item) => (STATUS_RANK[item.status] > STATUS_RANK[worst] ? item.status : worst), pool[0].status) : null;
    const withProgress = items.filter((item) => item.progress != null);
    summary.set(key, {
      name,
      count: items.length,
      status,
      progress: withProgress.length ? Math.round(withProgress.reduce((total, item) => total + item.progress, 0) / withProgress.length) : null
    });
  });
  return summary;
}

/* ── Geometry ────────────────────────────────────────────────────────────── */

/** Ray-casting point-in-ring for one GeoJSON linear ring ([lng, lat] pairs). */
function inRing(longitude, latitude, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > latitude !== yj > latitude && longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** True when a point lies inside a Polygon / MultiPolygon feature (holes respected). */
export function featureContains(feature, latitude, longitude) {
  const { type, coordinates } = feature?.geometry ?? {};
  const polygons = type === 'Polygon' ? [coordinates] : type === 'MultiPolygon' ? coordinates : [];
  return polygons.some(([outer, ...holes]) => inRing(longitude, latitude, outer) && !holes.some((hole) => inRing(longitude, latitude, hole)));
}
