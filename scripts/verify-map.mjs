/*
 * Map data and logic checks. Plain Node, no dependency:
 *
 *   npm run test:map
 *
 * Covers what can be checked without a browser: demo coordinates vs. wilaya boundaries,
 * invalid-coordinate handling, filters, base-map configuration, boundary data integrity.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const load = (path) => import(new URL(`file://${join(root, path)}`));

const { projects } = await load('data/projects.js');
const { projectLocations, LOCATION_PRECISION } = await load('data/projectLocations.js');
const U = await load('features/map/mapUtils.js');
const { BASEMAPS } = await load('features/map/basemaps.js');
const geo = JSON.parse(readFileSync(join(root, 'features/map/data/algeria-wilayas.geo.json'), 'utf8'));
const index = U.indexWilayas(geo);

let passed = 0;
const check = (name, fn) => {
  try { fn(); passed += 1; console.log(`  ✔ ${name}`); }
  catch (error) { console.error(`  ✘ ${name}\n      ${error.message}`); process.exitCode = 1; }
};

console.log('Boundary data');
check('48 wilayas with unique ISO codes and a name', () => {
  assert.equal(geo.features.length, 48);
  assert.equal(new Set(geo.features.map((f) => f.properties.code)).size, 48);
  geo.features.forEach((f) => assert.ok(f.properties.name && f.properties.code.startsWith('DZ-')));
  geo.features.forEach((f) => assert.ok(['Polygon', 'MultiPolygon'].includes(f.geometry.type)));
});
check('every coordinate is a finite [lng, lat] inside the region', () => {
  const walk = (c) => (typeof c[0] === 'number' ? [c] : c.flatMap(walk));
  geo.features.forEach((f) => walk(f.geometry.coordinates).forEach(([lng, lat]) => {
    assert.ok(Number.isFinite(lng) && Number.isFinite(lat), `${f.properties.name}: not finite`);
    assert.ok(lng > -9 && lng < 13 && lat > 18 && lat < 38, `${f.properties.name}: ${lng},${lat} outside Algeria`);
  }));
});

console.log('Demo locations');
const normalized = U.normalizeProjects(projects);
check('every project has a located demo coordinate with a declared precision', () => {
  normalized.forEach((p) => {
    assert.ok(p.location, `${p.id} has no location`);
    assert.ok(Object.values(LOCATION_PRECISION).includes(p.location.precision), `${p.id} precision`);
  });
  assert.deepEqual(Object.keys(projectLocations).sort(), projects.map((p) => p.id).sort(), 'table and projects must match');
});
check('every project wilaya has boundary geometry', () => {
  normalized.forEach((p) => assert.ok(U.featureForWilaya(index, p.wilaya), `${p.id}: no boundary for ${p.wilaya}`));
});
check('every demo coordinate falls inside the polygon of its own wilaya', () => {
  normalized.forEach((p) => assert.ok(U.featureContains(U.featureForWilaya(index, p.wilaya), p.location.latitude, p.location.longitude), `${p.id} (${p.wilaya}) is outside its wilaya`));
});
check('approximate positions are never labelled as recorded', () => {
  normalized.forEach((p) => assert.notEqual(p.location.precision, LOCATION_PRECISION.RECORDED));
});

console.log('Coordinate handling');
check('a project\'s own coordinates win over the demo table and are "recorded"', () => {
  const p = U.normalizeProject({ id: 'PRJ-2041', latitude: 36.4, longitude: 6.7 });
  assert.equal(p.location.precision, 'recorded');
  assert.equal(p.location.latitude, 36.4);
});
check('lat / lon / lng aliases are read', () => {
  assert.equal(U.normalizeProject({ id: 'X', lat: 35, lon: 3 }).location.longitude, 3);
  assert.equal(U.normalizeProject({ id: 'X', lat: 35, lng: 4 }).location.longitude, 4);
});
check('invalid, swapped or out-of-region coordinates are reported, never guessed', () => {
  assert.equal(U.normalizeProject({ id: 'PRJ-2041', latitude: 'abc', longitude: 6 }).locationIssue, 'invalid');
  assert.equal(U.normalizeProject({ id: 'PRJ-2041', latitude: NaN, longitude: NaN }).location, null);
  assert.equal(U.normalizeProject({ id: 'X', latitude: 3, longitude: 36 }).locationIssue, 'outOfRange', 'swapped lat/lng');
  assert.equal(U.normalizeProject({ id: 'X', latitude: 48.85, longitude: 2.35 }).locationIssue, 'outOfRange');
});
check('a project with nothing is "missing", not placed anywhere', () => {
  const p = U.normalizeProject({ id: 'NEW-1', name: 'Nouveau' });
  assert.equal(p.location, null);
  assert.equal(p.locationIssue, 'missing');
});
check('missing fields do not throw and ids stay stable', () => {
  assert.equal(U.normalizeProject(null), null);
  assert.deepEqual(U.normalizeProjects(undefined), []);
  const a = U.normalizeProject({}, 3);
  assert.equal(a.id, 'row-3');
  assert.equal(a.name, null);
  assert.equal(a.status, null);
});

console.log('Filters');
const count = (criteria) => U.filterProjects(normalized, criteria).length;
check('status / sector / wilaya filters', () => {
  assert.equal(count({ status: 'delayed' }), 2);
  assert.equal(count({ sector: 'Culture & Patrimoine' }), 3);
  assert.equal(count({ wilaya: 'Batna' }), 1);
  assert.equal(count({ status: 'delayed', sector: 'Culture & Patrimoine' }), 1);
  assert.equal(count({}), 8);
});
check('search by name or code ignores case and accents', () => {
  assert.equal(count({ query: 'timgad' }), 1);
  assert.equal(count({ query: 'PRJ-2041' }), 1);
  assert.equal(count({ query: 'prj 2041' }), 1);
  assert.equal(count({ query: 'reseau hydrographique' }), 1);
  assert.equal(count({ query: 'numerisation patrimoine' }), 1);
  assert.equal(count({ query: 'numer' }), 2, 'prefix match across two titles');
  assert.equal(count({ query: 'zzz' }), 0);
});
check('wilaya names match whatever accents / language the data uses', () => {
  assert.equal(U.featureForWilaya(index, 'Setif')?.properties.code, 'DZ-19');
  assert.equal(U.featureForWilaya(index, 'Sétif')?.properties.code, 'DZ-19');
  assert.equal(U.featureForWilaya(index, 'Algiers')?.properties.code, 'DZ-16');
  assert.equal(U.featureForWilaya(index, 'سطيف')?.properties.code, 'DZ-19');
  assert.equal(U.featureForWilaya(index, 'Atlantis'), null);
  assert.equal(U.wilayaLabel(index, 'Sétif', 'ar'), 'سطيف');
  assert.equal(U.wilayaLabel(index, 'Sétif', 'fr'), 'Sétif');
});
check('wilaya summary reports the worst active status', () => {
  const summary = U.summarizeWilayas(U.normalizeProjects([
    { id: 'A', wilaya: 'Alger', status: 'onTrack', progress: 80 },
    { id: 'B', wilaya: 'Alger', status: 'delayed', progress: 40 },
    { id: 'C', wilaya: 'Oran', status: 'completed', progress: 100 }
  ]));
  assert.equal(summary.get('alger').status, 'delayed');
  assert.equal(summary.get('alger').progress, 60);
  assert.equal(summary.get('oran').status, 'completed');
});
check('sector colours are stable and distinct', () => {
  const colours = U.sectorColors(normalized);
  assert.equal(new Set(Object.values(colours)).size, Object.keys(colours).length);
  assert.deepEqual(colours, U.sectorColors([...normalized].reverse()));
});

console.log('Base maps');
check('at least three base maps, https, no key or secret in the URL', () => {
  assert.ok(BASEMAPS.length >= 3);
  BASEMAPS.forEach((b) => {
    assert.ok(b.url.startsWith('https://'), `${b.id} must be https`);
    assert.ok(/\{z\}/.test(b.url) && /\{x\}/.test(b.url) && /\{y\}/.test(b.url), `${b.id} tile template`);
    assert.ok(!/key|token|apikey|secret/i.test(b.url), `${b.id} must not embed a credential`);
  });
});
check('every base map has attribution, a terms link and source text keys', () => {
  BASEMAPS.forEach((b) => {
    assert.ok(b.attribution.length > 20 && b.attribution.includes('<a '), `${b.id} attribution`);
    assert.ok(b.policyUrl.startsWith('https://'), `${b.id} terms link`);
  });
  assert.match(BASEMAPS.find((b) => b.id === 'osm').attribution, /OpenStreetMap/);
  assert.match(BASEMAPS.find((b) => b.id === 'topo').attribution, /OpenTopoMap/);
  assert.match(BASEMAPS.find((b) => b.id === 'satellite').attribution, /Sentinel/);
  assert.ok(BASEMAPS.find((b) => b.id === 'satellite').nonCommercial, 'satellite terms must be flagged non-commercial');
});

console.log(`\n${process.exitCode ? 'Some checks failed' : `All checks passed (${passed} passed)`}`);
