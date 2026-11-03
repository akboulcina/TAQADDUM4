/*
 * Base-map providers. Every entry was checked against the provider's own documentation
 * (see README.md → "Base maps and usage terms"). None needs an API key or a secret.
 *
 * `attribution` is shown by Leaflet's attribution control whenever the layer is active.
 * Do not remove it: each provider's terms require it.
 *
 * Tile hosts are listed here so they can be changed (or pointed at a self-hosted /
 * commercial tile service) without touching the map component. Replace a URL if the
 * provider's policy no longer fits the deployment — see the usage notes below.
 */
export const BASEMAPS = [
  {
    id: 'osm',
    labelKey: 'map.basemap.osm',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    // OSM Foundation tile usage policy: light use only, visible attribution, valid Referer.
    // Heavy or production traffic must use another provider or a self-hosted tile server.
    policyUrl: 'https://operations.osmfoundation.org/policies/tiles/',
    sourceKey: 'map.sources.osm'
  },
  {
    id: 'topo',
    labelKey: 'map.basemap.topo',
    url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    maxZoom: 17,
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors, <a href="https://viewfinderpanoramas.org" target="_blank" rel="noopener noreferrer">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org" target="_blank" rel="noopener noreferrer">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer">CC-BY-SA</a>)',
    // CC-BY-SA tiles; the project asks to be contacted before larger-scale use.
    policyUrl: 'https://opentopomap.org/about',
    sourceKey: 'map.sources.topo'
  },
  {
    id: 'satellite',
    labelKey: 'map.basemap.satellite',
    // EOX "Sentinel-2 cloudless 2024", Web-Mercator WMTS (tile matrix set "g"). No key required.
    url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/{z}/{y}/{x}.jpg',
    maxZoom: 17,
    // Sentinel-2 is ≈10 m/pixel: beyond this level tiles are only enlarged, not sharper.
    maxNativeZoom: 13,
    attribution: '<a href="https://cloudless.eox.at" target="_blank" rel="noopener noreferrer">EOxCloudless</a> by <a href="https://eox.at" target="_blank" rel="noopener noreferrer">EOX IT Services GmbH</a> (Contains modified Copernicus Sentinel data 2024), <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-NC-SA 4.0</a>',
    // Free for NON-COMMERCIAL use with attribution; commercial use needs a licence from EOX.
    policyUrl: 'https://cloudless.eox.at/license-non-commercial',
    sourceKey: 'map.sources.satellite',
    nonCommercial: true
  }
];

export const DEFAULT_BASEMAP = 'osm';

export const getBasemap = (id) => BASEMAPS.find((basemap) => basemap.id === id) ?? BASEMAPS[0];
