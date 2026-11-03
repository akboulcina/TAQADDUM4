# Interactive Algeria project map (Leaflet)

`AlgeriaProjectMap` is the map route of the TAQADDUM shell. It is a real Leaflet map (pan, zoom,
popups, clusters) inside a small GIS workspace: filters, base-map selector, layer panel, selection
details and a result list. All project, budget and progress values are simulated demonstration data.

```js
import { AlgeriaProjectMap } from './features/map/AlgeriaProjectMap.jsx';
```

## Props

| Prop | Type | Description |
|---|---|---|
| `projects` | Array | Scoped project records. A project may carry `latitude`/`longitude` (or `lat`/`lon`/`lng`); otherwise the labelled demo table is used. |
| `sites` | Array | Territorial records. Only the wilaya names are read (for the wilaya filter). Their legacy `x`/`y` SVG coordinates are ignored. |
| `selectedWilaya` / `onSelectWilaya` | String \| null / Function | Shared wilaya selection. Controlled when `selectedWilaya` is passed; `AppShell` owns it, so the dashboard can open the map on a wilaya. |
| `filters` / `onFiltersChange` | `{ query, status, sector }` / Function | Optional controlled filters (kept in `AppShell` so they survive leaving the map). |
| `selectedProjectId` / `onSelectProject` | String \| null / Function | Optional controlled map selection. |
| `onOpenProject(projectId)` | Function | Opens the existing project-details route (`nav.openProject`, which also enforces the persona's scope). |

## Files

| File | Role |
|---|---|
| `AlgeriaProjectMap.jsx` | Workspace (filters, panels, state). Loads the Leaflet part and the boundaries on demand; an error boundary keeps a map failure from taking the app down. |
| `ProjectLeafletMap.jsx` | Everything that touches Leaflet: tile layer, wilaya layers, markers, clusters, view/focus controller. |
| `MarkerClusterLayer.jsx`, `markerIcons.js`, `leafletSetup.js` | `leaflet.markercluster` wrapper, inline-SVG pins and cluster bubbles, plugin bootstrap. |
| `ProjectInfo.jsx` | Project facts shared by the popup and the side panel. Missing fields read "Non renseigné". |
| `mapUtils.js` | Pure helpers: normalisation, coordinate validation, filters, wilaya matching, point-in-polygon. |
| `basemaps.js` | Base-map providers, attribution and terms links. |
| `data/algeria-wilayas.geo.json` | 48 wilaya boundaries (see limits below). Rebuilt by `scripts/build-wilayas-geojson.mjs`. |
| `mapGeometry.js` | Legacy SVG outline, **only** still used by the login page artwork. The map no longer uses it. |
| `../../data/projectLocations.js` | Demo coordinates per project, each with a declared precision. |
| `../../data/i18n.map.js` | French / English / Arabic strings. |

## Data limitations (read before presenting)

- **`projects.js` has no coordinates.** The map uses `src/data/projectLocations.js`: seven projects are
  placed at their wilaya's capital city (`wilayaCapital`) and one at the Timgad site (`namedSite`).
  These are placeholders, shown as such: dashed ring under the pin, "Chef-lieu (indicatif)" /
  "Site approximatif" in the popup, side panel and legend. They are not surveyed project locations.
- A project's own valid coordinates always win and are shown as `recorded`.
- An invalid, swapped or out-of-region coordinate is **not** plotted; the project stays in the list with the reason
  ("Sans position sur la carte").
- **Wilaya boundaries** come from Natural Earth 1:10m Admin 1 (public domain), generalised to ≈ 80 KB. They are
  indicative, not cadastral. The file has the 48 wilayas that existed before 2019: wilayas created since (for example
  Ouled Djellal, carved out of Biskra) are not separate, and Biskra's outline is the older, larger one.
- Only wilayas that have at least one project in the persona's scope can be selected on the map.

## Base maps and usage terms

No base map needs an API key. Checked against each provider's own documentation (October 2026); re-check before production.

| Base map | Tiles | Attribution (shown on the map) | Terms to respect |
|---|---|---|---|
| Plan | `tile.openstreetmap.org` | © OpenStreetMap contributors | OSM Foundation tile policy: light use, visible attribution, valid `Referer` (do not add a `no-referrer` policy). Heavy or production traffic must use another provider or a self-hosted tile server. |
| Relief | `tile.opentopomap.org` | OSM, SRTM, OpenTopoMap (CC-BY-SA) | CC-BY-SA; the project asks to be contacted for larger-scale use. |
| Satellite | EOX Sentinel-2 cloudless 2024 (`tiles.maps.eox.at`) | EOxCloudless by EOX IT Services GmbH (contains modified Copernicus Sentinel data 2024), CC BY-NC-SA 4.0 | **Non-commercial use only** (commercial use needs an EOX licence). About 10 m resolution: tiles are only enlarged past zoom 13. |

Esri World Imagery was deliberately not used: its keyless raster endpoint belongs to a service Esri marks as
deprecated and tied to its own licence terms. Google, Bing and Mapbox imagery need keys or contracts.
To change a provider, edit `basemaps.js` only.

There is **no offline tile cache**: the map needs a connection. When tiles stop loading, a notice
suggests another base map and the rest of the map keeps working.

## Behaviour notes

- The map is created once. A base-map change swaps one tile layer; layer toggles add or remove that layer only;
  filters only update markers.
- Markers are SVG `divIcon`s and clusters are CSS: there is no Leaflet marker PNG to resolve under Vite.
- The Leaflet container is always `direction: ltr` (Leaflet positions panes with physical offsets); in Arabic the
  zoom and attribution controls move to the start side and popup text keeps the page direction.
- Auto-pan relies on a generous `maxBounds`; a tight limit makes Leaflet cancel popup auto-pan.

## Checks

```
npm run test:map     # coordinates vs. boundaries, invalid data, filters, base-map config
npm run test:roles   # includes French / English / Arabic key parity for the map strings
npm run build
```
