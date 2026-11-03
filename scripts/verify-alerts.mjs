import assert from 'node:assert/strict';
import { ALERT_RULES } from '../src/alerts/ruleRegistry.js';
import { evaluateAlertRule, assertAlertRegistry } from '../src/alerts/engine.js';
import { reconcileAlertInstances, transitionAlert } from '../src/alerts/lifecycle.js';
import { RECIPIENT_MAPPING_GAPS } from '../src/alerts/recipients.js';

const put = (target, path, value) => {
  const parts = path.split('.');
  let node = target;
  parts.slice(0, -1).forEach((part) => { node[part] ??= {}; node = node[part]; });
  node[parts.at(-1)] = value;
};
const passingValue = (condition, pass) => {
  const { operator, value } = condition;
  if (operator === '>') return pass ? Number(value) + 1 : Number(value) - 1;
  if (operator === '>=') return pass ? Number(value) : Number(value) - 1;
  if (operator === '<') return pass ? Number(value) - 1 : Number(value) + 1;
  if (operator === '<=') return pass ? Number(value) : Number(value) + 1;
  if (operator === '≠' || operator === '!=') return pass ? 'En cours' : value;
  if (value === 'Non') return pass ? 'Non' : 'Oui';
  if (value === 'Oui') return pass ? 'Oui' : 'Non';
  if (value === 'Vide') return pass ? '' : 'Responsable';
  if (value === 'Ouvert') return pass ? 'Ouvert' : 'Clos';
  if (value === 'En préparation') return pass ? 'En préparation' : 'Validé';
  return pass ? value : `not-${value}`;
};
function fixture(rule, pass = true) {
  const context = {
    project: { id: 'P-TEST', status: 'active' }, projectId: 'P-TEST',
    kpis: {}, quality: {}, history: {}, sourceFields: {}
  };
  for (const condition of rule.conditions) {
    const kpiId = condition.field.match(/^([A-Z]{2}\d)/)?.[1];
    if (condition.temporal?.temporal === 'variation') {
      context.history[kpiId] = pass ? [80, 60] : [60, 60];
      context.kpis[kpiId] = { value: 60, confidence: 'high', state: 'calculated' };
    } else if (condition.temporal?.temporal === 'consecutive_periods') {
      context.history[kpiId] = pass ? [0.5, 0.6] : [0.8, 0.8];
      context.kpis[kpiId] = { value: 0.6, confidence: 'high', state: 'calculated' };
    } else if (kpiId) {
      const actual = condition.field === 'Projet.Statut'
        ? (pass ? 'En cours' : 'Achevé')
        : passingValue(condition, pass);
      context.kpis[kpiId] = { value: actual, confidence: 'high', state: 'calculated' };
    } else {
      put(context.sourceFields, condition.field, passingValue(condition, pass));
    }
  }
  // A good, independently assessed data-quality baseline for operational rules.
  for (const [id, value] of Object.entries({ DO1: 1, DO2: 95, DO3: 5 })) {
    context.kpis[id] ??= { value, confidence: 'high', state: 'calculated' };
    context.quality[id] = { value, confidence: 'high', state: 'calculated' };
  }
  // For AL16 the quality KPI conditions themselves are the evidence.
  if (rule.id === 'AL16' && pass) {
    context.kpis.DO1 = { value: 3, confidence: 'high', state: 'calculated' };
    context.kpis.DO3 = { value: 25, confidence: 'high', state: 'calculated' };
  }
  if (rule.id === 'AL16' && !pass) {
    context.kpis.DO1 = { value: 1, confidence: 'high', state: 'calculated' };
    context.kpis.DO3 = { value: 5, confidence: 'high', state: 'calculated' };
  }
  return context;
}

assertAlertRegistry();
assert.equal(ALERT_RULES.length, 17);
assert.deepEqual(ALERT_RULES.map((rule) => rule.id), Array.from({ length: 17 }, (_, i) => `AL${String(i + 1).padStart(2, '0')}`));
assert.ok(Object.isFrozen(ALERT_RULES[0].expression), 'rule expression tree is immutable');

for (const rule of ALERT_RULES) {
  const positive = evaluateAlertRule(rule, fixture(rule, true), '2026-11-01T12:00:00.000Z');
  assert.equal(positive.status, 'evaluable', `${rule.id} positive should be evaluable: ${positive.reason}`);
  assert.equal(positive.triggered, true, `${rule.id} positive should trigger`);
  const negative = evaluateAlertRule(rule, fixture(rule, false), '2026-11-01T12:00:00.000Z');
  assert.equal(negative.status, 'evaluable', `${rule.id} negative should be evaluable: ${negative.reason}`);
  assert.equal(negative.triggered, false, `${rule.id} negative should not trigger`);
  const missing = evaluateAlertRule(rule, { project: { id: 'P-MISSING' }, projectId: 'P-MISSING', kpis: {}, quality: {}, history: {}, sourceFields: {} });
  assert.equal(missing.status, 'not_evaluable', `${rule.id} missing-data case`);
  assert.equal(missing.triggered, false, `${rule.id} missing data must never trigger`);
  const low = fixture(rule, true);
  const firstKpi = rule.conditions.find((condition) => condition.field.match(/^([A-Z]{2}\d)/));
  if (firstKpi) {
    const id = firstKpi.field.match(/^([A-Z]{2}\d)/)[1];
    low.kpis[id].confidence = 'low';
  } else {
    low.quality.DO1.confidence = 'low';
  }
  const lowResult = evaluateAlertRule(rule, low);
  assert.equal(lowResult.triggered, false, `${rule.id} low confidence must not trigger`);
  assert.ok(['insufficient_data', 'not_evaluable'].includes(lowResult.status), `${rule.id} low confidence status`);
  assert.equal(lowResult.dataConfidence, 'low', `${rule.id} confidence metadata`);
}

// Nested AND/OR branch semantics: one true OR branch is sufficient, but the outer AND remains mandatory.
const al01 = ALERT_RULES.find((rule) => rule.id === 'AL01');
const al01Branch = fixture(al01, true);
al01Branch.kpis.AV3.value = 0.9; // C2 false
al01Branch.kpis.PP2.value = 60; // C3 true
assert.equal(evaluateAlertRule(al01, al01Branch).triggered, true, 'AL01 C1 AND (false OR true)');
al01Branch.kpis.PP2.value = 80; // both OR branches false
assert.equal(evaluateAlertRule(al01, al01Branch).triggered, false, 'AL01 C1 AND (false OR false)');
al01Branch.kpis.FI6.value = 20; // outer C1 false while inner group true
al01Branch.kpis.AV3.value = 0.5;
al01Branch.kpis.PP2.value = 60;
assert.equal(evaluateAlertRule(al01, al01Branch).triggered, false, 'AL01 false outer AND');

const al03 = ALERT_RULES.find((rule) => rule.id === 'AL03');
const al03Branch = fixture(al03, true);
al03Branch.kpis.FI5.value = 130;
al03Branch.kpis.FI3.value = 90;
assert.equal(evaluateAlertRule(al03, al03Branch).triggered, true, 'AL03 C1 AND (true OR false)');
al03Branch.kpis.FI5.value = 80;
al03Branch.kpis.FI3.value = 90;
assert.equal(evaluateAlertRule(al03, al03Branch).triggered, false, 'AL03 C1 AND (false OR false)');

// An OR rule may be conclusively true when the other branch is missing.
const al11 = ALERT_RULES.find((rule) => rule.id === 'AL11');
const al11Partial = fixture(al11, true);
al11Partial.sourceFields.Situation = {};
assert.equal(evaluateAlertRule(al11, al11Partial).triggered, true, 'AL11 known true OR missing branch');
assert.ok(evaluateAlertRule(al11, al11Partial).missingConditions.includes('C2'));

// Invalid auxiliary types are missing evidence, not false/zero values.
const al10 = ALERT_RULES.find((rule) => rule.id === 'AL10');
const invalidAux = fixture(al10, true);
invalidAux.sourceFields.Blocage.Age_jours = 'trente jours';
const invalidResult = evaluateAlertRule(al10, invalidAux);
assert.equal(invalidResult.status, 'not_evaluable');
assert.ok(invalidResult.invalidConditions.includes('C1'));

// Explicit boolean values are accepted without converting absent fields into false.
const al02 = ALERT_RULES.find((rule) => rule.id === 'AL02');
const al02Boolean = fixture(al02, true);
al02Boolean.sourceFields.Blocage.Plan_Valide = false;
assert.equal(evaluateAlertRule(al02, al02Boolean).triggered, true, 'boolean false maps to Excel Non');

// Duplicate suppression and resolved-condition reopening.
const sampleRule = ALERT_RULES[0];
const firstEval = evaluateAlertRule(sampleRule, fixture(sampleRule, true), '2026-11-01T10:00:00.000Z');
const rulesById = Object.fromEntries(ALERT_RULES.map((rule) => [rule.id, rule]));
let state = reconcileAlertInstances({}, [firstEval], rulesById);
assert.equal(Object.keys(state.records).length, 1);
const duplicate = reconcileAlertInstances(state.records, [firstEval], rulesById);
assert.equal(Object.keys(duplicate.records).length, 1);
let record = Object.values(duplicate.records)[0];
record = transitionAlert(record, 'acknowledged', 'Tester');
record = transitionAlert(record, 'under_review', 'Tester');
record = transitionAlert(record, 'action_planned', 'Tester');
record = transitionAlert(record, 'resolved', 'Tester', 'Corrected');
let resolvedState = { [record.key]: record };
const falseEval = evaluateAlertRule(sampleRule, fixture(sampleRule, false), '2026-11-02T10:00:00.000Z');
resolvedState = reconcileAlertInstances(resolvedState, [falseEval], rulesById).records;
const retriggered = evaluateAlertRule(sampleRule, fixture(sampleRule, true), '2026-11-03T10:00:00.000Z');
const reopened = reconcileAlertInstances(resolvedState, [retriggered], rulesById);
assert.equal(Object.values(reopened.records)[0].status, 'open');
assert.equal(Object.values(reopened.records)[0].reopenCount, 1);
assert.ok(RECIPIENT_MAPPING_GAPS.some((gap) => gap.excelRole === 'bet'));
assert.ok(RECIPIENT_MAPPING_GAPS.some((gap) => gap.excelRole === 'contractor'));

console.log('Alert engine: 17 rules × positive/negative/missing/low-confidence cases passed; duplicate suppression and reopening passed.');
console.log(`Recipient mapping gaps: ${RECIPIENT_MAPPING_GAPS.length}`);
