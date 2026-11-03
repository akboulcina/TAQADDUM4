/*
 * KPI engine checks. Plain Node, no framework, no dependency:
 *
 *   npm run test:kpi
 *
 * Every expected number below is derived by hand in the comment next to it (from
 * the formula of 01_KPI and the fixtures of src/kpi/fixtures.js), NOT copied from
 * the engine's output. A KPI is counted as "verified" only when a check asserts
 * its value; the last check requires all 43.
 */
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const load = (path) => import(new URL(`file://${join(root, path)}`));

const R = await load('kpi/registry.js');
const T = await load('kpi/thresholds.js');
const P = await load('kpi/primitives.js');
const V = await load('kpi/validation.js');
const E = await load('kpi/engine.js');
const C = await load('kpi/constants.js');
const F = await load('kpi/fixtures.js');
const D = await load('kpi/adapters/demoProjects.js');
const S = await load('kpi/sourceSchema.js');
const { projects: demoProjects } = await load('data/projects.js');
const { translations } = await load('data/i18n.js');

let passed = 0;
const check = (name, fn) => {
  try { fn(); passed += 1; console.log(`  ✔ ${name}`); }
  catch (error) { console.error(`  ✘ ${name}\n      ${error.message}`); process.exitCode = 1; }
};
const near = (actual, expected, tolerance = 1e-9, label = '') => assert.ok(Math.abs(actual - expected) <= tolerance, `${label} expected ${expected}, got ${actual}`);

const verified = new Set(); // KPI ids whose value is asserted below
const REF = F.REFERENCE_DATE;
const run = (projects, options = {}) => E.calculateKpis(projects, { referenceDate: REF, ...options });
const main = run(F.PORTFOLIO);
const projectKpis = (id) => main.projects.find((p) => p.id === id).kpis;
const N = projectKpis('NRM');
const L = projectKpis('DLY');

/** Assert a project-level result and register the KPI as verified. */
const expectValue = (kpis, id, value, status, state = 'calculated', tolerance = 1e-9) => {
  const result = kpis[id];
  assert.equal(result.state, state, `${id} state`);
  if (typeof value === 'boolean') assert.equal(result.value, value, `${id} value`);
  else near(result.value, value, tolerance, `${id} value`);
  if (status) assert.equal(result.status, status, `${id} status`);
  verified.add(id);
};

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\nRegistry (01_KPI)');
check('exactly 43 unique KPIs, the 43 ids of the brief', () => {
  assert.equal(R.KPI_REGISTRY.length, 43);
  assert.equal(new Set(R.KPI_IDS).size, 43);
  assert.deepEqual([...R.KPI_IDS], [...R.EXPECTED_IDS]);
  assert.ok(R.assertRegistry());
});
check('family sizes: AV5 FI7 DL4 BU3 QR8 DO3 PP3 CO6 GV4', () => {
  const size = (family) => R.KPI_REGISTRY.filter((k) => k.family === family).length;
  assert.deepEqual(Object.fromEntries(R.FAMILIES.map((f) => [f.code, size(f.code)])), { AV: 5, FI: 7, DL: 4, BU: 3, QR: 8, DO: 3, PP: 3, CO: 6, GV: 4 });
});
check('importance counts match 00_Lecture: 20 [M], 14 [A], 9 [S]', () => {
  const count = (letter) => R.KPI_REGISTRY.filter((k) => k.importance === letter).length;
  assert.deepEqual([count('M'), count('A'), count('S')], [20, 14, 9]);
});
check('phases and calculability preserved (spot checks)', () => {
  const k = (id) => R.getKpi(id);
  assert.equal(k('AV3').phase, 'V2'); assert.equal(k('QR8').phase, 'Vision'); assert.equal(k('AV2').phase, 'MVP');
  assert.equal(R.KPI_REGISTRY.filter((x) => x.phase === 'MVP').length + R.KPI_REGISTRY.filter((x) => x.phase === 'V2').length + R.KPI_REGISTRY.filter((x) => x.phase === 'Vision').length, 43);
  assert.equal(k('AV2').calculability, 'Calculable sur fiches CNED');
  assert.equal(k('DO1').calculability, 'Calculable par la plateforme');
  assert.equal(k('CO1').calculability, 'Partiel (poids à valider)');
  assert.equal(k('QR3').calculability, 'Saisie requise');
  assert.equal(R.KPI_REGISTRY.filter((x) => x.calculability.startsWith('Partiel')).length, 16); // 05_Synthese COUNTIF "Partiel*"
});
check('exact definitions, formulas, units and thresholds from the workbook', () => {
  const k = (id) => R.getKpi(id);
  assert.equal(k('AV2').formula, 'TAP consolidé ÷ % du délai en vigueur consommé');
  assert.equal(k('AV2').unit, 'ratio'); assert.equal(k('AV2').greenThreshold, 0.9); assert.equal(k('AV2').redThreshold, 0.7);
  assert.equal(k('FI1').formula, 'TAP − taux financier travaux hors avances (en points)');
  assert.equal(k('FI1').unit, 'pts'); assert.equal(k('FI1').direction, 'absolute_deviation'); assert.equal(k('FI1').greenThreshold, 5); assert.equal(k('FI1').redThreshold, 10);
  assert.equal(k('DL1').formula, "Jours écoulés depuis l'ODS de démarrage ÷ délai en vigueur × 100");
  assert.equal(k('DL1').definition, 'Part du délai contractuel en vigueur (avenants inclus) déjà écoulée ; non plafonnée à 100 %.');
  assert.equal(k('DL3').formula, 'max(0 ; date de référence − date de fin contractuelle en vigueur)');
  assert.equal(k('DL3').greenThreshold, 0); assert.equal(k('DL3').redThreshold, 180);
  assert.equal(k('QR3').formula, "Médiane (date de référence − date d'ouverture) des blocages ouverts (jours)");
  assert.equal(k('DL2').greenThreshold, 1.25); assert.equal(k('DL2').redThreshold, 2);
  assert.equal(k('CO6').greenThreshold, 75); assert.equal(k('CO6').redThreshold, 55);
  assert.equal(k('AV1').greenThreshold, null); assert.equal(k('AV1').direction, 'information');
  assert.equal(k('FI4').name, "Dérive d'AE ajustée");
  assert.equal(k('FI2').dataOwner, 'MO / Finance'); assert.equal(k('FI4').kpiOwner, 'Contrôleur budgétaire'); assert.equal(k('PP1').targetFrequency, 'Hebdomadaire'); assert.equal(k('QR8').targetFrequency, 'Mensuelle + immédiate');
  assert.equal(k('GV4').dataSources, 'Receptions (à créer)');
});
check('every KPI carries all registry fields; thresholds present exactly for numeric directions', () => {
  const fields = ['id', 'family', 'name', 'definition', 'formula', 'unit', 'direction', 'importance', 'phase', 'calculability', 'dataSources', 'dataOwner', 'kpiOwner', 'targetFrequency', 'justification'];
  R.KPI_REGISTRY.forEach((k) => {
    fields.forEach((f) => assert.ok(typeof k[f] === 'string' && k[f].length > 0, `${k.id}.${f}`));
    const numeric = [C.DIRECTION.HIGHER_BETTER, C.DIRECTION.LOWER_BETTER, C.DIRECTION.ABSOLUTE_DEVIATION].includes(k.direction);
    assert.equal(typeof k.greenThreshold === 'number' && typeof k.redThreshold === 'number', numeric, `${k.id} thresholds`);
    assert.ok(['M', 'A', 'S'].includes(k.importance) && ['MVP', 'V2', 'Vision'].includes(k.phase));
  });
});
check('directions: 5 information/special KPIs are exactly AV1, PP3, QR5, QR6, QR8', () => {
  const ids = (d) => R.KPI_REGISTRY.filter((k) => k.direction === d).map((k) => k.id).sort();
  assert.deepEqual(ids('information'), ['AV1', 'PP3']);
  assert.deepEqual(ids('special_rule'), ['QR5', 'QR6', 'QR8']);
  assert.deepEqual(ids('absolute_deviation'), ['FI1']);
});
check('registry is frozen (no component can mutate a definition)', () => {
  assert.throws(() => { 'use strict'; R.getKpi('AV2').greenThreshold = 1; });
  assert.ok(Object.isFrozen(R.KPI_REGISTRY));
});
check('17 alert rules linked to KPIs; 6 workbook roles; role matrix R for DO1 = PMO', () => {
  assert.equal(R.ALERT_RULES.length, 17);
  assert.deepEqual(R.getKpi('FI6').alertRuleIds, ['AL01', 'AL04', 'AL11']);
  assert.equal(R.EXCEL_ROLES.length, 6);
  assert.equal(R.getKpi('DO1').roleAccess.pmo, 'R');
  assert.equal(R.getKpi('CO2').roleAccess.contractor, null);
});

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\nThreshold evaluator (direction-aware, 06_Simulateur rules)');
check('higher is better: AV2 — bounds included on the better side', () => {
  assert.equal(T.evaluateKpi('AV2', 0.9).status, 'green'); assert.equal(T.evaluateKpi('AV2', 0.8999).status, 'orange');
  assert.equal(T.evaluateKpi('AV2', 0.7).status, 'orange'); assert.equal(T.evaluateKpi('AV2', 0.6999).status, 'red');
});
check('lower is better: DL1 — 90 green, 100 orange, above red (never capped)', () => {
  assert.equal(T.evaluateKpi('DL1', 90).status, 'green'); assert.equal(T.evaluateKpi('DL1', 100).status, 'orange'); assert.equal(T.evaluateKpi('DL1', 182.5).status, 'red');
});
check('absolute deviation: FI1 applies the rule to |value| (−5 green, −10 orange, +10.1 red)', () => {
  assert.equal(T.evaluateKpi('FI1', -5).status, 'green'); assert.equal(T.evaluateKpi('FI1', -10).status, 'orange'); assert.equal(T.evaluateKpi('FI1', 10.1).status, 'red'); assert.equal(T.evaluateKpi('FI1', 0).status, 'green');
});
check('06_Simulateur examples: AV2 62/91 → red, AV2 99.98/95.5 → green, DL2 138/36 → red', () => {
  assert.equal(T.evaluateKpi('AV2', 62 / 91).status, 'red'); assert.equal(T.evaluateKpi('AV2', 99.98 / 95.5).status, 'green'); assert.equal(T.evaluateKpi('DL2', 138 / 36).status, 'red');
});
check('DL3 green only at 0 days (Seuil_Vert 0), orange to 180', () => {
  assert.equal(T.evaluateKpi('DL3', 0).status, 'green'); assert.equal(T.evaluateKpi('DL3', 1).status, 'orange'); assert.equal(T.evaluateKpi('DL3', 180).status, 'orange'); assert.equal(T.evaluateKpi('DL3', 181).status, 'red');
});
check('special rules: QR5 / QR6 / QR8 follow the words of the Vert / Orange / Rouge columns', () => {
  assert.equal(T.evaluateKpi('QR5', 0, { detail: { withoutSolution: 0 } }).status, 'green');
  assert.equal(T.evaluateKpi('QR5', 2, { detail: { withoutSolution: 0 } }).status, 'orange');
  assert.equal(T.evaluateKpi('QR5', 2, { detail: { withoutSolution: 1 } }).status, 'red');
  assert.equal(T.evaluateKpi('QR5', 2).status, 'not_evaluable');
  assert.equal(T.evaluateKpi('QR6', false).status, 'green'); assert.equal(T.evaluateKpi('QR6', true).status, 'red'); assert.equal(T.evaluateKpi('QR6', null).status, 'not_evaluable');
  assert.equal(T.evaluateKpi('QR8', 0).status, 'green'); assert.equal(T.evaluateKpi('QR8', 1).status, 'red');
});
check('information KPIs (AV1, PP3) are informational, never coloured', () => {
  assert.equal(T.evaluateKpi('AV1', 12).status, 'informational'); assert.equal(T.evaluateKpi('PP3', 80).status, 'informational'); assert.equal(T.evaluateKpi('AV1', null).status, 'not_evaluable');
});
check('null, NaN, undefined and non-numbers are not evaluable — never green, never 0', () => {
  [null, undefined, NaN, Infinity, '12'].forEach((v) => assert.equal(T.evaluateKpi('DL3', v).status, 'not_evaluable', String(v)));
});
check('thresholds are configurable without mutating the registry; overrides are reported', () => {
  const base = T.evaluateKpi('DL3', 150);
  const custom = T.evaluateKpi('DL3', 150, { overrides: { DL3: { redThreshold: 200 } } });
  assert.equal(base.status, 'orange'); assert.equal(custom.status, 'orange'); assert.equal(T.evaluateKpi('DL3', 190).status, 'red'); assert.equal(T.evaluateKpi('DL3', 190, { overrides: { DL3: { redThreshold: 200 } } }).status, 'orange');
  assert.equal(custom.thresholds.overridden, true); assert.equal(base.thresholds.overridden, false); assert.equal(base.thresholds.provisional, true);
  assert.equal(R.getKpi('DL3').redThreshold, 180);
});
check('thresholds contradicting the direction are rejected', () => {
  assert.throws(() => T.evaluateKpi('AV2', 1, { overrides: { AV2: { greenThreshold: 0.5, redThreshold: 0.9 } } }), /contradict/);
});

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\nPrimitives');
check('median: odd, even, empty → null (never 0); not the mean', () => {
  assert.equal(P.median([3, 1, 2]), 2); assert.equal(P.median([1, 2, 3, 10]), 2.5); assert.equal(P.median([]), null); assert.equal(P.median([1, 2, 30]), 2);
});
check('dates: ISO parsing rejects impossible days; day / month arithmetic', () => {
  assert.equal(P.isValidDate('2026-02-31'), false); assert.equal(P.isValidDate('2026-02-28'), true);
  assert.equal(P.daysBetween('2026-10-01', '2026-11-01'), 31); assert.equal(P.daysBetween('2026-11-01', '2026-10-01'), -31);
  assert.equal(P.addMonths('2026-08-31', 6), '2027-02-28'); assert.equal(P.addMonths('2026-11-01', -12), '2025-11-01');
});
check('ratio never divides by zero; weighted mean ignores items without weight', () => {
  assert.equal(P.ratio(1, 0), null); assert.equal(P.ratio(null, 5), null); assert.equal(P.ratio(1, 4, 100), 25);
  assert.equal(P.weightedMean([{ value: 10, weight: 1 }, { value: 20, weight: 3 }, { value: 99, weight: null }]).value, 17.5);
  assert.equal(P.weightedMean([]).value, null);
});
check('mergedDays counts overlapping stoppages once', () => {
  assert.equal(P.mergedDays([{ startDate: '2026-02-01', endDate: '2026-03-02' }, { startDate: '2026-02-15', endDate: '2026-03-17' }], '2025-11-01', REF), 44);
  assert.equal(P.mergedDays([{ startDate: '2026-10-01', endDate: null }], '2025-11-01', REF), 31);
});

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\nProject-level formulas — normal project (reference date 2026-11-01)');
check('AV1 = 550 ÷ 1000 × 100 = 55 (informational)', () => expectValue(N, 'AV1', 55, 'informational'));
check('AV2 = TAP 55 ÷ DL1 50 % = 1.1 (green)', () => expectValue(N, 'AV2', 1.1, 'green'));
check('AV3 = ΔTAP 15 ÷ (45 × 93 ÷ 365) — window 2026-07-31 → ref = 93 d, 365 d left', () => expectValue(N, 'AV3', 15 / ((45 * 93) / 365), 'green'));
check('AV4 = 40 ÷ 400 × 100 = 10 (≤ 10 → green)', () => expectValue(N, 'AV4', 10, 'green'));
check('AV5 = 3 ÷ 4 × 100 = 75 (orange)', () => expectValue(N, 'AV5', 75, 'orange'));
check('FI1 = 55 − 50 = +5 points (|5| ≤ 5 → green, bound included)', () => expectValue(N, 'FI1', 5, 'green'));
check('FI2 = (1000 − 450) ÷ 200 × 100 = 275', () => expectValue(N, 'FI2', 275, 'green'));
check('FI3 = 300 ÷ 250 × 100 = 120', () => expectValue(N, 'FI3', 120, 'green'));
check('FI4 = (1000 − (1000 + 0)) ÷ 1000 × 100 = 0 — adjusted base, adjustment supplied', () => expectValue(N, 'FI4', 0, 'green'));
check('FI5 = 91 days (oldest pending request 2026-08-02; the approved one is ignored); count 1, amount 50', () => {
  expectValue(N, 'FI5', 91, 'orange'); assert.equal(N.FI5.detail.count, 1); assert.equal(N.FI5.detail.amount, 50);
});
check('FI6 = median of unpaid ages [31, 11, 61] = 31 — not the mean 34.33', () => { expectValue(N, 'FI6', 31, 'orange'); assert.notEqual(N.FI6.value, (31 + 11 + 61) / 3); });
check('FI7 = unpaid 20+30+10 = 60 ÷ market 800 + 80 = 880 × 100', () => expectValue(N, 'FI7', (60 / 880) * 100, 'orange'));
check('DL1 = 365 ÷ 730 × 100 = 50', () => expectValue(N, 'DL1', 50, 'green'));
check('DL2 = 730 ÷ 730 = 1', () => expectValue(N, 'DL2', 1, 'green'));
check('DL3 = 0 when the contractual end (2027-11-01) is not passed', () => expectValue(N, 'DL3', 0, 'green'));
check('DL4 = forecast (2026-11-01 + 45 ÷ (15 ÷ 93) = 279 d = 2027-08-07) − 2027-11-01 = −86 d ≈ −2.83 months — partial (constraints not modelled)', () => {
  expectValue(N, 'DL4', -86 / P.DAYS_PER_MONTH, 'green', 'partial', 1e-9); assert.equal(N.DL4.detail.forecastDate, '2027-08-07');
});
check('BU1 = 80 ÷ 800 × 100 = 10', () => expectValue(N, 'BU1', 10, 'green'));
check('BU2 = 1 notified amendment', () => expectValue(N, 'BU2', 1, 'green'));
check('BU3 = (800 + 200) ÷ 1000 × 100 = 100 (≤ 100 → green)', () => expectValue(N, 'BU3', 100, 'green'));
check('QR1 = 90 ÷ 100 × 100 = 90 (orange)', () => expectValue(N, 'QR1', 90, 'orange'));
check('QR2 = 9 ÷ 10 × 100 = 90 (≥ 90 → green)', () => expectValue(N, 'QR2', 90, 'green'));
check('QR3 = median of open blocker ages [30, 90, 10] = 30 — not the mean 43.3; count 3', () => {
  expectValue(N, 'QR3', 30, 'green'); assert.equal(N.QR3.detail.count, 3);
});
check('QR4 = merged stoppage 44 d ÷ 365 d elapsed × 100', () => expectValue(N, 'QR4', (44 / 365) * 100, 'orange'));
check('QR5 = 1 open hazard with a decided solution → orange', () => { expectValue(N, 'QR5', 1, 'orange'); assert.equal(N.QR5.detail.withoutSolution, 0); });
check('QR6 = No → green', () => expectValue(N, 'QR6', false, 'green'));
check('QR7 = 20 days (only the open CRITICAL NC)', () => expectValue(N, 'QR7', 20, 'orange'));
check('QR8 = 1 severe incident inside 12 months (the 2025-10-01 one is outside) → red', () => expectValue(N, 'QR8', 1, 'red'));
check('DO1 = 7 d since 2026-10-25 ÷ 14 d expected = 0.5', () => expectValue(N, 'DO1', 0.5, 'green'));
check('DO2 = 13 of 13 required fields; state requires_validation (field list is a proposal)', () => {
  expectValue(N, 'DO2', 100, null, 'requires_validation'); assert.equal(N.DO2.detail.validationKind, 'method');
});
check('PP1 = 8 ÷ 10 × 100 = 80 (≥ 80 → green)', () => expectValue(N, 'PP1', 80, 'green'));
check('PP2 = 85 ÷ 100 × 100 = 85 (orange)', () => expectValue(N, 'PP2', 85, 'orange'));
check('PP3 = 2 external of 2 unrealized = 100 % (land 50 %, materials 50 %); informational', () => {
  expectValue(N, 'PP3', 100, 'informational'); assert.equal(N.PP3.detail.byCausePct.land, 50); assert.equal(N.PP3.detail.byCausePct.materials, 50);
});
check('GV1 = 2 of 3 open blockers have owner AND date = 66.67 % → red', () => expectValue(N, 'GV1', (2 / 3) * 100, 'red'));
check('GV2 not applicable: every amendment of the normal project is visaed', () => { assert.equal(N.GV2.state, 'not_applicable'); assert.equal(N.GV2.value, null); });
check('GV4 = 1 of 3 provisional receptions with reserves unlifted > 6 months = 33.33 % → red', () => expectValue(N, 'GV4', (1 / 3) * 100, 'red'));

console.log('\nProject-level formulas — delayed project');
check('DL1 = 730 ÷ 400 × 100 = 182.5 — NOT capped at 100 %', () => expectValue(L, 'DL1', 182.5, 'red'));
check('AV2 = 60 ÷ 182.5 = 0.3288 (red)', () => expectValue(L, 'AV2', 60 / 182.5, 'red'));
check('DL2 = 400 ÷ 200 = 2 (orange: bound included on the better side)', () => expectValue(L, 'DL2', 2, 'orange'));
check('DL3 = 330 days past 2025-12-06 → red', () => expectValue(L, 'DL3', 330, 'red'));
check('FI4 = (2000 − (1500 − 500)) ÷ 1000 × 100 = 100 — adjusted, NOT (2000−1500)/1500 = 33.3', () => {
  expectValue(L, 'FI4', 100, 'red'); assert.notEqual(Math.round(L.FI4.value), 33);
});
check('FI1 = 60 − 800/1000×100 = −20 points (works route, advances excluded) → red', () => expectValue(L, 'FI1', -20, 'red'));
check('BU1 = 500 notified ÷ 1000 = 50 % (the un-notified A6 is not counted); BU2 = 5', () => { expectValue(L, 'BU1', 50, 'red'); expectValue(L, 'BU2', 5, 'orange'); });
check('GV2 = 151 days since the un-visaed amendment A6 (2026-06-03) → red', () => expectValue(L, 'GV2', 151, 'red'));
check('QR4 = 123 ÷ 730 × 100 (open-ended stoppage since 2026-07-01); QR5 without decided solution → red', () => {
  expectValue(L, 'QR4', (123 / 730) * 100, 'red'); expectValue(L, 'QR5', 1, 'red'); assert.equal(L.QR5.detail.withoutSolution, 1);
});
check('DO1 = 92 d ÷ 30 d = 3.07 (> 2 → red); AV3 not applicable once the deadline has passed', () => {
  expectValue(L, 'DO1', 92 / 30, 'red'); assert.equal(L.AV3.state, 'not_applicable'); assert.equal(L.AV3.reasons[0].code, 'deadline_passed');
});

console.log('\nCompleted, missing-data, inconsistent and zero-denominator projects');
check('completed project: DL3 not applicable (null, not 0) and left out of active-population KPIs', () => {
  const c = projectKpis('CMP');
  assert.equal(c.DL3.state, 'not_applicable'); assert.equal(c.DL3.value, null);
  assert.equal(main.projects.find((p) => p.id === 'CMP').active, false);
  assert.equal(main.population.active, 5);
});
check('missing financial data: FI4 / FI2 / BU3 have NO value, name the missing fields and the data owner', () => {
  const m = projectKpis('MFN');
  ['FI2', 'FI4', 'BU3', 'FI3'].forEach((id) => { assert.equal(m[id].state, 'missing_data', id); assert.equal(m[id].value, null, id); assert.equal(m[id].status, 'not_evaluable', id); });
  assert.deepEqual(m.FI4.missing, ['aeCurrent', 'aeInitial']);
  assert.equal(m.FI4.owner.dataOwner, 'Fiche CNED'); assert.equal(m.FI4.owner.kpiOwner, 'Contrôleur budgétaire');
  assert.deepEqual(m.FI1.missing, ['financialRateExAdvances']);
});
check('inconsistent project: impossible TAP / duration / dates are refused (requires_validation, no value)', () => {
  const i = projectKpis('INC');
  ['AV2', 'FI1', 'DL1', 'DL2', 'DL3', 'DO1'].forEach((id) => { assert.equal(i[id].state, 'requires_validation', id); assert.equal(i[id].value, null, id); });
  assert.equal(i.AV1.state, 'requires_validation');
});
check('zero denominators are "not applicable", never Infinity / NaN / 0', () => {
  const z = projectKpis('ZER');
  ['FI2', 'FI3', 'AV4', 'AV5', 'QR1', 'QR2'].forEach((id) => { assert.equal(z[id].state, 'not_applicable', id); assert.equal(z[id].value, null, id); });
  assert.equal(z.AV2.state, 'not_applicable'); assert.equal(z.AV2.reasons[0].code, 'delay_not_consumed');
  assert.equal(z.FI4.state, 'requires_validation'); // AE initiale 0 cannot be a base
  ['QR3', 'FI5', 'FI6', 'QR7', 'GV1'].forEach((id) => { assert.equal(z[id].state, 'not_applicable', id); assert.equal(z[id].value, null, id); });
});
check('invariant: no result without data carries a value; every numeric value is finite', () => {
  const all = [...Object.values(main.portfolio), ...main.projects.flatMap((p) => Object.values(p.kpis))];
  all.forEach((r) => {
    if (['missing_data', 'not_applicable', 'not_implemented'].includes(r.state)) assert.equal(r.value, null, `${r.id}/${r.subjectId}/${r.state}`);
    if (r.state === 'requires_validation' && r.detail?.validationKind === 'inputs') assert.equal(r.value, null);
    if (typeof r.value === 'number') assert.ok(Number.isFinite(r.value), `${r.id}/${r.subjectId}`);
    if (r.value === null) assert.ok(['not_evaluable', 'informational'].includes(r.status), `${r.id} status of a null value`);
    assert.ok(C.CALC_STATES.includes(r.state)); assert.ok(C.STATUSES.includes(r.status));
  });
});

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\nData validation');
check('detects TAP > 100, payments > commitments, inconsistent dates, non-positive durations, future updates', () => {
  const codes = V.validateProject(F.INCONSISTENT, REF).issues.map((i) => i.code);
  ['tap_above_100', 'payments_exceed_commitments', 'dates_inconsistent', 'duration_not_positive', 'update_in_future'].forEach((c) => assert.ok(codes.includes(c), c));
});
check('detects invalid percentages, negative amounts, missing initial / current contract amounts', () => {
  const codes = V.validateProject({ id: 'X', financialRateExAdvances: 150, aeCurrent: -5 }, REF).issues.map((i) => i.code);
  ['percentage_out_of_range', 'negative_value', 'missing_initial_amount'].forEach((c) => assert.ok(codes.includes(c), c));
  assert.ok(V.validateProject({ id: 'Y' }, REF).issues.some((i) => i.code === 'missing_current_amount'));
});
check('detects duplicate and missing identifiers across a portfolio', () => {
  const report = V.validatePortfolio([{ ...F.NORMAL }, { ...F.NORMAL }, { name: 'no id' }], REF);
  assert.equal(report.issues.filter((i) => i.code === 'duplicate_id').length, 2);
  assert.equal(report.issues.filter((i) => i.code === 'missing_id').length, 1);
});
check('invalid calendar dates and impossible chronology inside collections are flagged', () => {
  const codes = V.validateProject({ id: 'Z', startOrderDate: '2026-02-31', blockers: [{ id: 'b', openedDate: '2026-05-01', closedDate: '2026-04-01' }] }, REF).issues.map((i) => i.code);
  assert.ok(codes.includes('date_invalid')); assert.ok(codes.includes('dates_inconsistent'));
});
check('a clean project has no inconsistency', () => assert.equal(V.validateProject(F.NORMAL, REF).inconsistent, false));

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\nPortfolio aggregation');
const P_ = main.portfolio;
check('AV1 = AE-weighted mean (1000 × 55, 2000 × 60, 600 × 0) ÷ 3600 = 48.61', () => { near(P_.AV1.value, (55 * 1000 + 60 * 2000 + 0 * 600) / 3600, 1e-9); assert.equal(P_.AV1.state, 'partial'); verified.add('AV1'); });
check('AV2 = AE-weighted mean (1000 × 1.1 + 2000 × 0.3288) ÷ 3000 = 0.5858 — shown with a distribution, not a status', () => {
  near(P_.AV2.value, (1.1 * 1000 + (60 / 182.5) * 2000) / 3000, 1e-9); assert.equal(P_.AV2.status, 'informational'); assert.equal(P_.AV2.statusBasis, 'distribution');
});
check('FI1 portfolio = AE-weighted signed gap; shown without applying project thresholds', () => {
  // NRM +5 (1000), DLY −20 (2000), ZER 0 (600; proxy 0 ÷ 600) → (5000 − 40000 + 0) ÷ 3600
  near(P_.FI1.value, (5 * 1000 - 20 * 2000 + 0 * 600) / 3600, 1e-9); assert.equal(P_.FI1.status, 'informational');
});
check('FI4 = POOLED (0 + 1000 + 0) ÷ (1000 + 1000 + 800) × 100 = 35.71 — not the mean of 0, 100, 0', () => {
  near(P_.FI4.value, (1000 / 2800) * 100, 1e-9); assert.notEqual(P_.FI4.value, 100 / 3); assert.equal(P_.FI4.status, 'orange');
});
check('DL3 = MEDIAN of project values (0, 330, 0, 0) = 0; completed and invalid projects excluded', () => {
  assert.equal(P_.DL3.value, 0); assert.equal(P_.DL3.state, 'partial'); assert.equal(P_.DL3.detail.coverage.used, 4);
});
check('DL3 median ≠ mean: values 10, 20, 300 → 20', () => {
  const mk = (id, days) => ({ id, status: 'active', contractualEndDate: P.addDays(REF, -days) });
  const r = run([mk('a', 10), mk('b', 20), mk('c', 300)]).portfolio.DL3;
  assert.equal(r.value, 20); assert.equal(r.state, 'calculated'); assert.equal(r.status, 'orange');
});
check('FI6 / QR3 pooled median: items [31,11,61] + [5] → 21 (median of medians would give 18)', () => {
  const base = { startOrderDate: '2026-01-01', currentDurationDays: 365 };
  const other = { id: 'OTH', status: 'active', ...base, invoices: [{ id: 'q', marketId: 'M', amount: 1, receivedDate: P.addDays(REF, -5), paidDate: null }], blockers: [{ id: 'z', openedDate: P.addDays(REF, -5), closedDate: null }] };
  const r = run([F.NORMAL, other]).portfolio;
  assert.equal(r.FI6.value, 21);
  assert.equal(r.QR3.value, P.median([30, 90, 10, 5]));
});
check('FI5 / GV2 / QR7 = oldest item of the whole scope (91, 151, 20)', () => {
  assert.equal(P_.FI5.value, 91); assert.equal(P_.GV2.value, 151); assert.equal(P_.QR7.value, 20); assert.equal(P_.GV2.detail.oldestProjectId, 'DLY');
});
check('BU1 pooled over markets (80 + 500) ÷ (800 + 1000); BU2 = worst market (5), never an average', () => {
  near(P_.BU1.value, (580 / 1800) * 100, 1e-9); assert.equal(P_.BU2.value, 5); assert.equal(P_.BU2.detail.worstProjectId, 'DLY');
});
check('pooled ratios: AV4 10, AV5 75, FI2 275, FI3 120, FI7, BU3 = (800+200+100) ÷ (1000+600)', () => {
  assert.equal(P_.AV4.value, 10); assert.equal(P_.AV5.value, 75); assert.equal(P_.FI2.value, 275); assert.equal(P_.FI3.value, 120);
  near(P_.FI7.value, (60 / 880) * 100, 1e-9); near(P_.BU3.value, ((800 + 200 + 100 + 0) / (1000 + 600)) * 100, 1e-9);
});
check('QR4 = Σ stopped days ÷ Σ elapsed days (44 + 123) ÷ (365 + 730)', () => near(P_.QR4.value, (167 / 1095) * 100, 1e-9));
check('QR5 = total open hazards (2); status uses the pooled "without solution" count → red', () => { assert.equal(P_.QR5.value, 2); assert.equal(P_.QR5.detail.withoutSolution, 1); assert.equal(P_.QR5.status, 'red'); });
check('QR8 = Σ incidents (1) over ALL projects (completed included)', () => { assert.equal(P_.QR8.value, 1); assert.equal(P_.QR8.detail.coverage.population, 6); });
check('QR6 / DL1 / DL2 / AV3 / DL4 / DO1 / PP2: no scalar — distribution of project statuses', () => {
  ['QR6', 'DL1', 'DL2', 'AV3', 'DL4', 'DO1', 'PP2'].forEach((id) => { assert.equal(P_[id].valueKind, 'distribution', id); assert.equal(P_[id].value, null, id); assert.ok(P_[id].detail.distribution, id); });
  assert.equal(P_.DL1.detail.distribution.red, 1); assert.equal(P_.DL1.detail.distribution.green, 3);
  assert.equal(P_.DL2.detail.distribution.orange, 1); assert.equal(P_.QR6.detail.distribution.green, 1);
  ['DL1', 'DL2', 'QR6', 'AV3'].forEach((id) => verified.add(id));
});
check('CO4 = 1 late (DLY: DL1 182.5 > 100 and AV2 0.33 < 0.90) of 4 classifiable active projects = 25 %', () => {
  near(P_.CO4.value, 25, 1e-9); assert.equal(P_.CO4.status, 'orange'); assert.equal(P_.CO4.state, 'partial'); assert.deepEqual(P_.CO4.detail.flaggedProjectIds, ['DLY']); verified.add('CO4');
});
check('CO4 treats AV2 as irrelevant when the delay is not exceeded, and refuses to guess when AV2 is unknown', () => {
  const onTime = { id: 'a', status: 'active', startOrderDate: '2026-06-01', currentDurationDays: 365 };
  const lateNoTap = { id: 'b', status: 'active', startOrderDate: '2024-01-01', currentDurationDays: 100 };
  const r = run([onTime, lateNoTap]).portfolio.CO4;
  assert.equal(r.detail.classified, 1); assert.equal(r.value, 0); assert.equal(r.state, 'partial');
});
check('CO5 = 1 stopped > 60 days (DLY, 123 d) of 2 classifiable active projects = 50 %', () => { near(P_.CO5.value, 50, 1e-9); assert.deepEqual(P_.CO5.detail.flaggedProjectIds, ['DLY']); verified.add('CO5'); });
check('CO3 = AE-weighted: DLY 2000 terminated ÷ (1000 + 2000) = 66.67 %; completed project excluded', () => { near(P_.CO3.value, (2000 / 3000) * 100, 1e-9); assert.equal(P_.CO3.detail.weightedBy, 'aeCurrent'); verified.add('CO3'); });
check('CO2 = largest contractor share: C2 1500 ÷ (880 + 1500) = 63.03 %; partial (groupements not modelled)', () => {
  near(P_.CO2.value, (1500 / 2380) * 100, 1e-9); assert.equal(P_.CO2.detail.topContractorId, 'C2'); assert.equal(P_.CO2.state, 'partial'); assert.equal(P_.CO2.status, 'red'); verified.add('CO2');
});
check('GV1 pooled = 2 of 3 = 66.67; GV4 pooled = 1 of 3 = 33.33; GV3 = 1 of 1 classifiable = 100 %', () => {
  near(P_.GV1.value, (2 / 3) * 100, 1e-9); near(P_.GV4.value, (1 / 3) * 100, 1e-9); assert.equal(P_.GV3.value, 100); assert.equal(P_.GV3.detail.classified, 1); verified.add('GV3');
});
check('PP1 = 80 pooled; PP3 = pooled external share and Pareto by cause', () => {
  assert.equal(P_.PP1.value, 80); assert.equal(P_.PP3.value, 100); assert.equal(P_.PP3.detail.byCausePct.land, 50);
});
check('DO3 = 1 project with an anomaly (INC) ÷ 6 projects (all, completed included) = 16.67 % → orange', () => {
  near(P_.DO3.value, 100 / 6, 1e-9); assert.equal(P_.DO3.status, 'orange'); assert.equal(P_.DO3.state, 'calculated'); assert.equal(main.dataQuality.counts.projectsWithAnomaly, 1); verified.add('DO3');
});
check('DO2 = Σ populated ÷ Σ required = (13 + 11 + 9 + 5 + 9 + 9) ÷ 78 = 71.79 %; stays requires_validation', () => {
  near(P_.DO2.value, (56 / 78) * 100, 1e-9); assert.equal(P_.DO2.state, 'requires_validation'); assert.equal(P_.DO2.confidence, 'low');
});
check('every aggregated KPI documents its method and population; empty population is "not applicable"', () => {
  R.KPI_IDS.forEach((id) => { const m = E.KPI_ENGINE_META[id]; assert.ok(m.aggregation && m.level && m.population, id); });
  const empty = run([]);
  assert.equal(empty.portfolio.DL3.state, 'not_applicable'); assert.equal(empty.portfolio.DL3.value, null); assert.equal(empty.portfolio.CO4.value, null);
});
check('levels: BU1 / BU2 / FI7 are market-level, CO1 / CO2 contractor-level, CO3-CO6 / DO3 / GV3 portfolio-level', () => {
  ['BU1', 'BU2', 'FI7'].forEach((id) => assert.equal(E.KPI_ENGINE_META[id].level, 'market'));
  ['CO1', 'CO2'].forEach((id) => assert.equal(E.KPI_ENGINE_META[id].level, 'contractor'));
  ['CO3', 'CO4', 'CO5', 'CO6', 'DO3', 'GV3'].forEach((id) => { assert.equal(E.KPI_ENGINE_META[id].level, 'portfolio'); assert.equal(E.KPI_ENGINE_META[id].hasProjectValue, false); });
  assert.equal(main.projects[0].kpis.CO4, undefined);
});

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\nStrategic scores (CO1, CO6): never published without validation');
check('by default CO1 and CO6 are not_implemented, with no value, and say what the workbook leaves undefined', () => {
  ['CO1', 'CO6'].forEach((id) => {
    assert.equal(P_[id].state, 'not_implemented'); assert.equal(P_[id].value, null); assert.equal(P_[id].status, 'not_evaluable'); assert.equal(P_[id].readiness, 'not_implemented');
    assert.ok(P_[id].detail.missingNormalizers.length > 0);
  });
  assert.deepEqual(P_.CO1.detail.weights, { av2: 0.4, bu1Inverse: 0.25, pp2: 0.2, terminationHistory: 0.15 });
  assert.deepEqual(P_.CO6.detail.weights, { av2: 0.25, delays: 0.2, finance: 0.2, blockers: 0.2, co1: 0.15 });
});
const co1Config = (validated) => ({ co1: { validated, normalizers: { bu1Inverse: (bu1) => 100 - bu1, terminationHistory: (h) => (h ? 100 - 25 * h.terminations : null) } } });
const contractors = { C1: { terminations: 0 }, C2: { terminations: 2 } };
check('CO1 with team-supplied normalisation: weights 40/25/20/15, AV2 capped at 1, PP2 absent → redistributed; value flagged requires_validation', () => {
  const r = run(F.PORTFOLIO, { config: co1Config(false), contractors }).portfolio.CO1;
  // C1: 0.40×100 (AV2 1.1 capped to 1) + 0.25×90 + 0.20×85 + 0.15×100 = 94.5
  // C2: (0.40×32.877 + 0.25×50 + 0.15×50) ÷ 0.80 = 41.438   (PP2 absent: its 20 % redistributed proportionally)
  // portfolio: AE-weighted (1000, 2000) = 59.125
  near(r.detail.contractors.find((c) => c.id === 'C1').score, 94.5, 1e-9);
  near(r.detail.contractors.find((c) => c.id === 'C2').score, (0.4 * (60 / 182.5) * 100 + 0.25 * 50 + 0.15 * 50) / 0.8, 1e-9);
  near(r.value, (94.5 * 1000 + ((0.4 * (60 / 182.5) * 100 + 0.25 * 50 + 0.15 * 50) / 0.8) * 2000) / 3000, 1e-9);
  assert.equal(r.state, 'requires_validation'); assert.equal(r.detail.validationKind, 'method'); assert.equal(r.confidence, 'low');
  assert.equal(r.detail.contractors.find((c) => c.id === 'C2').ppRedistributed, true);
  verified.add('CO1');
});
check('CO1 becomes "calculated" only when the team flags the weights as validated', () => {
  assert.equal(run(F.PORTFOLIO, { config: co1Config(true), contractors }).portfolio.CO1.state, 'calculated');
});
check('CO6 with supplied component normalisers: 0.25×100 + 0.20×50 + 0.20×0 + 0.20×100 + 0.15×20 = 58, requires_validation until validated', () => {
  const constant = (v) => () => v;
  const config = (validated) => ({ co6: { validated, normalizers: { av2: constant(100), delays: constant(50), finance: constant(0), blockers: constant(100), co1: constant(20) } } });
  const r = run(F.PORTFOLIO, { config: config(false) }).portfolio.CO6;
  near(r.value, 58, 1e-9); assert.equal(r.state, 'requires_validation'); verified.add('CO6');
  assert.equal(run(F.PORTFOLIO, { config: config(true) }).portfolio.CO6.state, 'calculated');
  const missing = run(F.PORTFOLIO, { config: { co6: { normalizers: { av2: constant(100), delays: constant(50), finance: constant(null), blockers: constant(100), co1: constant(20) } } } }).portfolio.CO6;
  assert.equal(missing.state, 'missing_data'); assert.equal(missing.value, null); assert.deepEqual(missing.missing, ['finance']);
});

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\nCalculation state, confidence, readiness');
check('V2 / Vision KPIs never read "operational", even when the formula runs', () => {
  assert.equal(N.AV3.readiness, 'v2_preview'); assert.equal(N.FI2.readiness, 'v2_preview'); assert.equal(N.QR8.readiness, 'vision_preview'); assert.equal(L.FI6.readiness, 'v2_pending');
  R.KPI_REGISTRY.filter((k) => k.phase !== 'MVP').forEach((k) => main.projects.forEach((p) => assert.notEqual(p.kpis[k.id]?.readiness, 'operational', k.id)));
});
check('MVP calculated = operational; partial = limited; method awaiting validation = to_validate', () => {
  assert.equal(N.AV2.readiness, 'operational'); assert.equal(N.DL4.readiness, 'v2_preview'); assert.equal(projectKpis('ZER').FI1.readiness, 'limited'); assert.equal(N.DO2.readiness, 'to_validate');
});
check('confidence: exact + full coverage → high; proxy → low; default periodicity → medium; no value → none', () => {
  assert.equal(N.AV2.confidence, 'high'); assert.equal(projectKpis('ZER').FI1.confidence, 'low'); assert.equal(projectKpis('MFN').FI4.confidence, 'none');
  const withoutOwnPeriodicity = run([{ ...F.NORMAL, expectedUpdateFrequencyDays: undefined }]).projects[0].kpis.DO1;
  assert.equal(withoutOwnPeriodicity.state, 'calculated'); assert.equal(withoutOwnPeriodicity.basis, 'default'); assert.equal(withoutOwnPeriodicity.confidence, 'medium'); near(withoutOwnPeriodicity.value, 7 / 30);
});
check('a project with detected anomalies lowers the confidence of its other KPIs, but not their values', () => {
  const clean = run([F.NORMAL]).projects[0].kpis;
  const dirty = run([{ ...F.NORMAL, paymentsTotal: 900 }]).projects[0].kpis; // payments > commitments (800)
  assert.equal(clean.DL1.confidence, 'high'); assert.equal(dirty.DL1.confidence, 'medium'); assert.equal(dirty.DL1.value, clean.DL1.value);
});
check('proxy results are labelled: AV1 from TAP, FI1 from payments ÷ AE are PARTIAL with the missing fields named', () => {
  const m = projectKpis('MFN').AV1; assert.equal(m.state, 'partial'); assert.equal(m.basis, 'proxy'); assert.deepEqual(m.missing, ['worksRealizedValue', 'totalEstimatedCost']);
  const z = projectKpis('ZER').FI1; assert.equal(z.state, 'partial'); assert.equal(z.reasons[0].code, 'proxy_payments_over_ae');
});
check('FI4 without a supplied adjustment is partial (adjustment assumed 0 and said so), never silently exact', () => {
  const r = run([{ id: 'x', status: 'active', aeCurrent: 120, aeInitial: 100 }]).projects[0].kpis.FI4;
  assert.equal(r.state, 'partial'); near(r.value, 20); assert.deepEqual(r.missing, ['aeInitialAdjustment']);
});
check('data quality KPIs are not circular: changing DO inputs changes only DO values and confidence', () => {
  const a = run([F.NORMAL]).projects[0].kpis;
  const b = run([{ ...F.NORMAL, lastUpdateDate: undefined, expectedUpdateFrequencyDays: undefined }]).projects[0].kpis;
  R.KPI_IDS.filter((id) => !id.startsWith('DO')).forEach((id) => { if (a[id]) assert.deepEqual(b[id]?.value, a[id].value, id); });
  assert.equal(b.DO1.state, 'missing_data');
});
check('the engine is pure: same input → identical output; input data is not mutated', () => {
  const snapshot = JSON.stringify(F.PORTFOLIO);
  const a = JSON.stringify(run(F.PORTFOLIO).portfolio);
  assert.equal(a, JSON.stringify(run(F.PORTFOLIO).portfolio)); assert.equal(snapshot, JSON.stringify(F.PORTFOLIO));
  assert.throws(() => E.calculateKpis(F.PORTFOLIO, {}), /referenceDate/);
});

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\nDemo dataset (what the app really shows today)');
const demo = run(D.toKpiSources(demoProjects));
check('demo adapter maps only existing fields; everything else stays absent', () => {
  const s = D.toKpiSource(demoProjects[0]);
  assert.deepEqual(Object.keys(s).sort(), ['aeCurrent', 'committed', 'contractualEndDate', 'id', 'name', 'paymentsTotal', 'status', 'tap']);
  assert.equal(s.aeCurrent, demoProjects[0].budget); assert.equal(s.tap, demoProjects[0].progress);
});
check('demo: DL3 is genuinely calculable from the due dates (PRJ-2015 is 1 day late; PRJ-2019 completed → n/a)', () => {
  const k = (id) => demo.projects.find((p) => p.id === id).kpis;
  assert.equal(k('PRJ-2015').DL3.value, 1); assert.equal(k('PRJ-2015').DL3.status, 'orange'); assert.equal(k('PRJ-2019').DL3.state, 'not_applicable');
  assert.equal(demo.portfolio.DL3.value, 0); assert.equal(demo.portfolio.DL3.state, 'calculated');
});
check('demo: indicators needing absent data are missing_data with NO value (AV2, DL1, FI4, QR3, GV1…)', () => {
  ['AV2', 'DL1', 'DL2', 'FI4', 'QR3', 'GV1', 'CO4', 'CO5', 'BU1'].forEach((id) => { assert.equal(demo.portfolio[id].state, 'missing_data', id); assert.equal(demo.portfolio[id].value, null, id); });
  assert.deepEqual(demo.projects[0].kpis.AV2.missing, ['startOrderDate', 'currentDurationDays']);
});
check('demo: FI1 and AV1 are partial proxies (labelled), DO3 = 0 anomalies, DO2 low and to validate', () => {
  assert.equal(demo.portfolio.FI1.state, 'partial'); assert.equal(demo.portfolio.AV1.state, 'partial');
  assert.equal(demo.portfolio.DO3.value, 0); assert.equal(demo.portfolio.DO3.state, 'calculated');
  assert.equal(demo.portfolio.DO2.state, 'requires_validation'); assert.ok(demo.portfolio.DO2.value < 50);
});
check('demo: fewer than half of the 43 KPIs have a value, and none is operational unless calculated', () => {
  const withValue = Object.values(demo.portfolio).filter((r) => r.value !== null || r.valueKind === 'distribution').length;
  assert.ok(withValue < 22, `${withValue} KPIs with a value`);
  Object.values(demo.portfolio).forEach((r) => { if (r.readiness === 'operational') assert.equal(r.state, 'calculated'); });
});

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\nCatalogue view-model (src/kpi/catalogue.js)');
const CAT = await load('kpi/catalogue.js');
const ids = (rows) => rows.map((r) => r.kpi.id);
check('catalogue lists all 43 KPIs, at portfolio and at project scope', () => {
  assert.equal(CAT.buildRows(main).length, 43);
  assert.equal(CAT.buildRows(main, { scope: 'project', projectId: main.projects[0].id }).length, 43);
});
check('project scope: portfolio-only KPIs (CO1–CO6, DO1–DO3 classifiers, GV3) have no project value; project KPIs do', () => {
  const rows = CAT.buildRows(main, { scope: 'project', projectId: main.projects[0].id });
  const by = Object.fromEntries(rows.map((r) => [r.kpi.id, r]));
  ['CO1', 'CO2', 'CO3', 'CO4', 'CO5', 'CO6', 'GV3', 'DO3'].forEach((id) => assert.equal(by[id].result, null, id));
  ['AV2', 'DL1', 'FI6'].forEach((id) => assert.ok(by[id].result, id));
});
check('filters: family, importance, phase, direction, state, level, id and text search', () => {
  const rows = CAT.buildRows(main);
  assert.equal(CAT.filterRows(rows, { family: 'QR' }).length, 8);
  assert.equal(CAT.filterRows(rows, { importance: 'S' }).length, 9);
  assert.equal(CAT.filterRows(rows, { importance: 'M' }).length, 20);
  assert.deepEqual(ids(CAT.filterRows(rows, { id: 'FI6' })), ['FI6']);
  assert.deepEqual(ids(CAT.filterRows(rows, { query: 'av2' })).includes('AV2'), true);
  assert.equal(CAT.filterRows(rows, { phase: 'MVP' }).length + CAT.filterRows(rows, { phase: 'V2' }).length + CAT.filterRows(rows, { phase: 'Vision' }).length, 43);
  assert.equal(CAT.filterRows(rows, { direction: 'information' }).length, 2);
  assert.equal(CAT.filterRows(rows, { state: 'calculated' }).every((r) => r.result.state === 'calculated'), true);
  assert.equal(CAT.filterRows(rows, { level: 'portfolio' }).every((r) => r.level === 'portfolio'), true);
  assert.equal(CAT.filterRows(rows, { query: 'zzzz-nothing' }).length, 0);
  assert.equal(CAT.filterRows(rows, { query: 'delai' }).length > 0, true, 'accent-insensitive search (délai)');
});
check('"my KPIs" filter uses only the unambiguous persona→role mapping; pm and territorial get no filter', () => {
  const rows = CAT.buildRows(main);
  assert.equal(CAT.personaRole('pm'), null); assert.equal(CAT.personaRole('territorial'), null);
  assert.equal(CAT.personaRole('dg'), 'direction');
  assert.equal(CAT.filterRows(rows, { mine: true }, { persona: 'pm' }).length, 43);
  const mine = CAT.filterRows(rows, { mine: true }, { persona: 'finance' });
  assert.ok(mine.length > 0 && mine.length < 43);
  assert.ok(mine.every((r) => r.kpi.roleAccess.budgetController));
});
check('formatValue never turns a missing value into 0', () => {
  const fmt = { percent: (v) => `${v}%`, number: (v) => String(v), points: (v) => `${v} pts` };
  const t = (k) => k;
  assert.equal(CAT.formatValue({ value: null }, '%', { fmt, t }), null);
  assert.equal(CAT.formatValue(undefined, 'j', { fmt, t }), null);
  assert.equal(CAT.formatValue({ value: 0 }, 'j', { fmt, t }), '0 kpr.unit.days', 'a genuine 0 is still shown');
  assert.equal(CAT.formatValue({ value: true }, 'oui/non', { fmt, t }), 'kpr.yes');
});
check('summary counts add up to 43 and match the engine summary', () => {
  const s = CAT.summarizeRows(CAT.buildRows(main));
  assert.equal(s.calculated + s.partial + s.missing + s.notApplicable + s.review, 43);
  assert.equal(s.calculated, main.summary.byState.calculated ?? 0);
});

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\nCoverage');
check('every one of the 43 KPIs has its value asserted by a check above', () => {
  const unverified = R.KPI_IDS.filter((id) => !verified.has(id));
  assert.deepEqual(unverified, [], `not verified: ${unverified.join(', ')}`);
  assert.equal(verified.size, 43);
});
check('every source field named by the schema is used by a calculator or validation', () => {
  Object.keys(S.SOURCE_FIELDS).forEach((field) => assert.ok(S.SOURCE_FIELDS[field].entity, field));
  S.DEFAULT_REQUIRED_FIELDS.forEach((field) => assert.ok(field in S.SOURCE_FIELDS, field));
});
const expectedKeys = ['kpr.title'];
check('catalogue translations (kpr.*) exist in fr, en and ar', () => {
  const langs = ['fr', 'en', 'ar'];
  const frKeys = Object.keys(translations.fr).filter((k) => k.startsWith('kpr.'));
  assert.ok(frKeys.length > 150, `only ${frKeys.length} kpr.* keys`);
  langs.forEach((lang) => { const missing = frKeys.filter((k) => !translations[lang][k]); assert.deepEqual(missing, [], `${lang} missing ${missing.slice(0, 5)}`); });
  expectedKeys.forEach((k) => assert.ok(translations.fr[k]));
  // every state, status, confidence, readiness, field, issue and reason code the engine can emit has a label
  const need = [
    ...C.CALC_STATES.map((s) => `kpr.state.${s}`), ...C.STATUSES.map((s) => `kpr.status.${s}`), ...Object.values(C.CONFIDENCE).map((s) => `kpr.confidence.${s}`),
    ...['operational', 'limited', 'to_validate', 'unavailable', 'v2_preview', 'v2_pending', 'vision_preview', 'vision_pending', 'not_implemented'].map((s) => `kpr.readiness.${s}`),
    ...Object.keys(S.SOURCE_FIELDS).map((f) => `kpr.field.${f}`),
    ...Object.values(C.DIRECTION).map((d) => `kpr.direction.${d}`), ...Object.values(C.AGGREGATION).map((a) => `kpr.aggregation.${a}`),
    ...R.FAMILIES.map((f) => `kpr.family.${f.code}`)
  ];
  const absent = need.filter((k) => !translations.fr[k]); assert.deepEqual(absent, [], `missing: ${absent.join(', ')}`);
  const codes = new Set();
  [...Object.values(main.portfolio), ...main.projects.flatMap((p) => Object.values(p.kpis))].forEach((r) => r.reasons.forEach((x) => codes.add(x.code)));
  main.validation.issues.forEach((i) => codes.add(i.code));
  const unlabeled = [...codes].filter((c) => !translations.fr[`kpr.reason.${c}`] && !translations.fr[`kpr.issue.${c}`]);
  assert.deepEqual(unlabeled, [], `unlabeled reason/issue codes: ${unlabeled.join(', ')}`);
});

console.log(`\n${process.exitCode ? 'FAILED' : 'All checks passed'} (${passed} passed)\n`);
