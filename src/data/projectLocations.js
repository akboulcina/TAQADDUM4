/*
 * DEMO LOCATIONS — NOT SURVEYED PROJECT COORDINATES.
 *
 * src/data/projects.js has no latitude / longitude field: a project only knows its wilaya.
 * To let the interactive map place the demo portfolio, this file adds one coordinate per
 * project and says, for each, how far it can be trusted (`precision`):
 *
 *   'namedSite'      centre of a well-known site named in the project title (e.g. Timgad).
 *                    Approximate: it is not the surveyed position of the project works.
 *   'wilayaCapital'  centre of the wilaya's capital city. A placeholder used because the real
 *                    site of the works is not recorded. It must never be read as the exact
 *                    project location, and the map says so in the popup and the legend.
 *
 * Coordinates are rounded to 4 decimals (≈ 10 m) from the public positions of the cities and
 * the Timgad archaeological site; they are fictional project positions, not CNED data.
 *
 * Precedence: a project that carries its own `latitude` / `longitude` (or `lat` / `lon` / `lng`)
 * always wins over this table, and is reported as 'recorded'. Replace this table with real site
 * coordinates when they exist; no map code has to change.
 */
export const LOCATION_PRECISION = Object.freeze({
  RECORDED: 'recorded',
  NAMED_SITE: 'namedSite',
  WILAYA_CAPITAL: 'wilayaCapital'
});

export const projectLocations = Object.freeze({
  'PRJ-2041': { latitude: 36.365, longitude: 6.6147, precision: LOCATION_PRECISION.WILAYA_CAPITAL, place: 'Constantine' },
  'PRJ-2038': { latitude: 35.4847, longitude: 6.4686, precision: LOCATION_PRECISION.NAMED_SITE, place: 'Timgad' },
  'PRJ-2035': { latitude: 36.7538, longitude: 3.0588, precision: LOCATION_PRECISION.WILAYA_CAPITAL, place: 'Alger' },
  'PRJ-2031': { latitude: 36.1898, longitude: 5.4108, precision: LOCATION_PRECISION.WILAYA_CAPITAL, place: 'Sétif' },
  'PRJ-2028': { latitude: 36.9, longitude: 7.7667, precision: LOCATION_PRECISION.WILAYA_CAPITAL, place: 'Annaba' },
  'PRJ-2024': { latitude: 35.6971, longitude: -0.6308, precision: LOCATION_PRECISION.WILAYA_CAPITAL, place: 'Oran' },
  'PRJ-2019': { latitude: 36.47, longitude: 2.83, precision: LOCATION_PRECISION.WILAYA_CAPITAL, place: 'Blida' },
  'PRJ-2015': { latitude: 34.85, longitude: 5.7333, precision: LOCATION_PRECISION.WILAYA_CAPITAL, place: 'Biskra' }
});
