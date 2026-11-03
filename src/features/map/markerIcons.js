import L from './leafletSetup.js';

const cache = new Map();

/**
 * Teardrop pin as an inline-SVG divIcon: no image asset, any colour, crisp at every zoom.
 *   approximate → a dashed ground ring around the tip: the position is indicative, not surveyed.
 *   selected    → larger pin.
 * The tip of the pin is the geographic point (iconAnchor).
 */
export function pinIcon({ color, selected = false, approximate = false }) {
  const key = `${color}|${selected ? 1 : 0}|${approximate ? 1 : 0}`;
  if (cache.has(key)) return cache.get(key);
  const width = selected ? 34 : 28;
  const height = selected ? 44 : 36;
  const scale = height / 36;
  const ring = approximate
    ? '<ellipse cx="14" cy="32" rx="10" ry="4" fill="rgba(255,255,255,.35)" stroke="#16202c" stroke-opacity=".7" stroke-width="1.3" stroke-dasharray="2.4 2"/>'
    : '';
  const html = `<svg viewBox="0 0 28 36" width="${width}" height="${height}" aria-hidden="true" focusable="false">${ring}<path d="M14 1C7.4 1 2.5 5.9 2.5 12.2c0 8.1 9.4 17.6 10.9 19.1.3.3.9.3 1.2 0 1.5-1.5 10.9-11 10.9-19.1C25.5 5.9 20.6 1 14 1z" fill="${color}" stroke="#fff" stroke-width="2"/><circle cx="14" cy="12" r="4.4" fill="#fff"/></svg>`;
  const icon = L.divIcon({
    html,
    className: `apm-pin${selected ? ' is-selected' : ''}`,
    iconSize: [width, height],
    iconAnchor: [width / 2, 32 * scale],
    popupAnchor: [0, -(32 * scale) + 4]
  });
  cache.set(key, icon);
  return icon;
}

/** Round brand-blue bubble with the number of grouped projects. */
export function clusterIcon(cluster) {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `<span class="apm-cluster-bubble"><b>${count}</b></span>`,
    className: 'apm-cluster',
    iconSize: [44, 44]
  });
}
