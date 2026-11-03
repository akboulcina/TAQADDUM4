/*
 * Rebuilds src/features/map/data/algeria-wilayas.geo.json.
 *
 *   node scripts/build-wilayas-geojson.mjs
 *
 * Source : Natural Earth 1:10m Admin 1 – States, Provinces (public domain)
 *          https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/
 * Steps  : download → keep adm0_a3 === 'DZA' → keep { code, name, nameAr } → simplify (mapshaper,
 *          topology-preserving, shared borders stay shared) → coordinates rounded to 0.001° (~110 m).
 *
 * Requires network access and `npx` (mapshaper is fetched on demand, it is not a project dependency).
 * The result is a generalised, indicative outline — NOT an official cadastral boundary.
 * Natural Earth lists 48 wilayas; the wilayas created after 2019 are not in it.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson';
const SIMPLIFY = '60%';
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'features', 'map', 'data', 'algeria-wilayas.geo.json');

const dir = mkdtempSync(join(tmpdir(), 'wilayas-'));
const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);
const source = await response.json();

const features = source.features
  .filter((feature) => feature.properties.adm0_a3 === 'DZA')
  .map((feature) => ({
    type: 'Feature',
    properties: {
      code: feature.properties.iso_3166_2,
      name: feature.properties.name,
      nameAr: String(feature.properties.name_ar ?? '').replace('ولاية ', '').trim()
    },
    geometry: feature.geometry
  }));
if (features.length !== 48) throw new Error(`Expected 48 wilayas, got ${features.length}`);

const rawPath = join(dir, 'dz_raw.geojson');
const simplePath = join(dir, 'dz_simple.geojson');
writeFileSync(rawPath, JSON.stringify({ type: 'FeatureCollection', features }));
execFileSync('npx', ['--yes', 'mapshaper@0.6', rawPath, '-simplify', SIMPLIFY, 'keep-shapes', '-o', 'precision=0.001', simplePath, 'format=geojson'], { stdio: 'inherit' });

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(JSON.parse(readFileSync(simplePath, 'utf8')))}\n`);
console.log(`Wrote ${out} (${features.length} wilayas)`);
