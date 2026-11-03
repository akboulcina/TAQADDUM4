/*
 * Phase 3 role-matrix checks (plain Node):  npm run test:matrix
 *
 * Compares the application against the workbook matrix exported to
 * scripts/fixtures/role-matrix.fixture.json (03_Matrice_Roles), then exercises the six
 * personas: KPI visibility (R/S/V), alert recipients (D/I), project scope, routes,
 * actions, financial visibility.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', 'src');
const load = (path) => import(new URL(`file://${join(root, path)}`));
const fixture = JSON.parse(readFileSync(join(here, 'fixtures', 'role-matrix.fixture.json'), 'utf8'));

const { demoUsers } = await load('data/users.js');
const { projects } = await load('data/projects.js');
const { ROLE_CONFIG, ROLE_IDS } = await load('roles/roleConfig.js');
const { createAccess } = await load('roles/access.js');
const { getReferenceProfile, auditReferenceMapping } = await load('roles/referenceAccess.js');
const R = await load('roles/roleReference.js');
const { KPI_REGISTRY, KPI_IDS } = await load('kpi/registry.js');
const { ALERT_RULES } = await load('alerts/ruleRegistry.js');
const { RECIPIENT_MAPPING_GAPS } = await load('alerts/recipients.js');
const { PERSONA_TO_EXCEL_ROLE } = await load('kpi/constants.js');
const { restrictRows } = await load('kpi/catalogue.js');
const { projectsToCsv } = await load('roles/exportCsv.js');

let passed = 0;
const check = (name, fn) => {
  try { fn(); passed += 1; console.log(`  ✔ ${name}`); }
  catch (error) { console.error(`  ✘ ${name}\n      ${error.message}`); process.exitCode = 1; }
};
const user = Object.fromEntries(demoUsers.map((u) => [u.id, u]));
const access = Object.fromEntries(demoUsers.map((u) => [u.id, createAccess(u)]));
const sorted = (list) => [...list].sort();
const project = (id) => projects.find((p) => p.id === id);

console.log('\nWorkbook ↔ application (exactness)');
check('KPI R/S/V of the 43 KPIs equals 03_Matrice_Roles for all six workbook roles', () => {
  assert.equal(Object.keys(fixture.kpis).length, 43);
  KPI_REGISTRY.forEach((kpi) => fixture.roleKeys.forEach((key) => assert.equal(kpi.roleAccess[key], fixture.kpis[kpi.id].rights[key], `${kpi.id}/${key}`)));
});
check('alert D/I of the 17 rules equals 03_Matrice_Roles for all six workbook roles', () => {
  assert.equal(Object.keys(fixture.alerts).length, 17);
  ALERT_RULES.forEach((rule) => fixture.roleKeys.forEach((key) => {
    const found = rule.recipientRoles.find((r) => r.excelRole === key)?.code ?? null;
    assert.equal(found, fixture.alerts[rule.id].codes[key], `${rule.id}/${key}`);
  }));
});
check('profiles reproduce the workbook per mapped persona', () => {
  R.MAPPED_PERSONAS.forEach((id) => {
    const key = R.PERSONA_REFERENCE_MAP[id].excelRole;
    const p = getReferenceProfile(id);
    KPI_IDS.forEach((kpi) => assert.equal(p.kpiRights[kpi] ?? null, fixture.kpis[kpi].rights[key], `${id} ${kpi}`));
    Object.keys(fixture.alerts).forEach((rule) => assert.equal(p.alertCodes[rule] ?? null, fixture.alerts[rule].codes[key], `${id} ${rule}`));
  });
});
check('finance view equals the workbook sheet 04_Vue_Role: 17 KPI ([M]12 [A]2 [S]3), 3 alerts', () => {
  const p = getReferenceProfile('finance');
  const count = (letter) => p.kpi.visible.filter((id) => KPI_REGISTRY.find((k) => k.id === id).importance === letter).length;
  assert.deepEqual([p.kpi.visible.length, count('M'), count('A'), count('S')], [17, 12, 2, 3]);
  assert.deepEqual(sorted(p.alerts.visible), ['AL03', 'AL08', 'AL11']);
  assert.deepEqual(sorted(p.kpi.owned), ['FI3', 'FI4', 'FI5', 'FI7']);
});

console.log('\nRole mapping');
check('exact mappings: Direction→dg, PMO→pmo, MO→mo, Finance→finance; the registry agrees', () => {
  assert.deepEqual(PERSONA_TO_EXCEL_ROLE, { dg: 'direction', pmo: 'pmo', mo: 'mo', finance: 'budgetController' });
  assert.deepEqual(auditReferenceMapping(), []);
});
check('chef de projet and territorial are unresolved; BET and Contractant have no persona', () => {
  assert.equal(R.PERSONA_REFERENCE_MAP.pm.status, 'unresolved');
  assert.equal(R.PERSONA_REFERENCE_MAP.territorial.status, 'unresolved');
  assert.equal(R.EXCEL_ROLE_TO_PERSONA_MAP.bet, null);
  assert.equal(R.EXCEL_ROLE_TO_PERSONA_MAP.contractor, null);
  assert.equal(R.UNMAPPED_REFERENCE_ROLES.bet.status, 'missing');
  assert.equal(R.UNMAPPED_REFERENCE_ROLES.contractor.status, 'missing');
});
check('no rejected equivalence is applied (pm≠contractor/BET/MO, territorial≠BET/MO)', () => {
  R.REJECTED_EQUIVALENCES.forEach(({ persona, excelRole }) => assert.notEqual(R.PERSONA_REFERENCE_MAP[persona].excelRole, excelRole, `${persona}↔${excelRole}`));
  assert.equal(R.REJECTED_EQUIVALENCES.length >= 5, true);
});
check('9 recipient assignments stay unserved: BET 3, Contractant 6', () => {
  assert.equal(RECIPIENT_MAPPING_GAPS.length, 9);
  assert.equal(RECIPIENT_MAPPING_GAPS.filter((g) => g.excelRole === 'bet').length, 3);
  assert.equal(RECIPIENT_MAPPING_GAPS.filter((g) => g.excelRole === 'contractor').length, 6);
});
check('every open decision referenced by the map exists, and is open', () => {
  const ids = new Set(R.PENDING_DECISIONS.map((d) => d.id));
  Object.values(R.PERSONA_REFERENCE_MAP).forEach((m) => m.open.forEach((id) => assert.ok(ids.has(id), id)));
  Object.values(R.UNMAPPED_REFERENCE_ROLES).forEach((m) => assert.ok(ids.has(m.decision)));
  assert.ok(R.PENDING_DECISIONS.every((d) => d.status === 'open' && d.safeDefault));
});

console.log('\nKPI visibility per persona');
ROLE_IDS.forEach((id) => {
  check(`${id}: visible / hidden partition the 43 KPIs; owned + feeds + view = visible`, () => {
    const p = access[id].reference;
    assert.equal(p.kpi.visible.length + p.kpi.hidden.length, 43);
    assert.equal(p.kpi.owned.length + p.kpi.contributes.length + p.kpi.readOnly.length, p.kpi.visible.length);
    KPI_IDS.forEach((k) => assert.equal(access[id].canViewKpi(k), p.kpi.visible.includes(k), `${id} ${k}`));
    p.kpi.hidden.forEach((k) => assert.equal(access[id].kpiRight(k), null));
  });
});
check('S is not admin and V is not edit: contribute = S only, validate = R only, V neither', () => {
  ROLE_IDS.forEach((id) => KPI_IDS.forEach((k) => {
    const right = access[id].kpiRight(k);
    assert.equal(access[id].canContributeKpi(k), right === 'S', `${id} ${k}`);
    assert.equal(access[id].canValidateKpi(k), right === 'R', `${id} ${k}`);
  }));
  // S grants no project / alert permission: finance feeds FI1, FI2, FI6 yet holds no project write right.
  assert.equal(access.finance.canContributeKpi('FI1'), true);
  assert.equal(access.finance.can('project.update'), false);
  assert.equal(access.finance.can('project.validate'), false);
  assert.equal(access.dg.canContributeKpi('AV2'), false);
  assert.equal(access.dg.kpiRight('AV2'), 'V');
});
check('documented anchors: PMO owns DO1–DO3; MO owns AV1 and QR1; Finance owns FI4; Direction owns nothing', () => {
  ['DO1', 'DO2', 'DO3'].forEach((k) => assert.equal(access.pmo.kpiRight(k), 'R'));
  assert.equal(access.mo.kpiRight('AV1'), 'R');
  assert.equal(access.mo.kpiRight('QR1'), 'R');
  assert.equal(access.finance.kpiRight('FI4'), 'R');
  assert.equal(access.dg.reference.kpi.owned.length, 0);
  assert.equal(access.dg.canViewKpi('DO1'), false, 'Direction does not see data-quality KPIs');
  assert.equal(access.finance.canViewKpi('QR1'), false);
});
check('unresolved personas (pm, territorial) see no referentiel KPI and no rule alert', () => {
  ['pm', 'territorial'].forEach((id) => {
    assert.equal(access[id].reference.kpi.visible.length, 0);
    assert.equal(access[id].reference.alerts.visible.length, 0);
    assert.equal(access[id].reference.mappingStatus, 'unresolved');
  });
});
check('catalogue rows are restricted before filtering (hidden KPI cannot be listed)', () => {
  const rows = KPI_REGISTRY.map((kpi) => ({ kpi }));
  assert.equal(restrictRows(rows, access.finance.canViewKpi).length, 17);
  assert.equal(restrictRows(rows, access.pm.canViewKpi).length, 0);
  assert.equal(restrictRows(rows, access.pmo.canViewKpi).length, 43);
});
check('families and dashboard cards only reference KPIs the persona can see', () => {
  ROLE_IDS.forEach((id) => {
    const cfg = ROLE_CONFIG[id].dashboard;
    cfg.kpis.filter((k) => k.startsWith('ref.')).forEach((k) => assert.ok(access[id].canViewKpi(k.slice(4)), `${id}: card ${k} is hidden for the role`));
    cfg.panels.filter((p) => p.component === 'kpiShelf').forEach((p) => {
      const candidates = KPI_IDS.filter((k) => access[id].canViewKpi(k) && (!p.props.families || p.props.families.includes(k.slice(0, 2))));
      assert.ok(candidates.length > 0, `${id}: shelf ${p.id} would be empty`);
    });
  });
});

console.log('\nAlert recipients (D / I)');
const rules = (id) => ({ D: sorted(access[id].reference.alerts.decide), I: sorted(access[id].reference.alerts.inform) });
check('Direction is only informed; PMO 10 D / 7 I; MO 12 D / 4 I; Finance 3 D', () => {
  assert.deepEqual(rules('dg').D, []);
  assert.equal(rules('dg').I.length, 8);
  assert.deepEqual([rules('pmo').D.length, rules('pmo').I.length], [10, 7]);
  assert.deepEqual([rules('mo').D.length, rules('mo').I.length], [12, 4]);
  assert.deepEqual(rules('finance'), { D: ['AL03', 'AL08', 'AL11'], I: [] });
});
check('alert category views match the recipients (finance = budget only)', () => {
  assert.deepEqual(access.finance.reference.alerts.viewKeys, ['budget']);
  assert.ok(ROLE_CONFIG.finance.alertView.categories.every((c) => access.finance.reference.alerts.viewKeys.includes(c)));
});
const alertFor = (ruleId, projectId) => ({ ruleId, projectId, severity: ALERT_RULES.find((r) => r.id === ruleId).severity });
check('visibility: scope first, then D/I — an assigned persona never sees another project', () => {
  assert.equal(access.mo.canViewRuleAlert(alertFor('AL06', 'PRJ-2031'), project('PRJ-2031')), true);
  assert.equal(access.mo.canViewRuleAlert(alertFor('AL06', 'PRJ-2035'), project('PRJ-2035')), false, 'PRJ-2035 is not assigned to the MO');
  assert.equal(access.mo.canViewRuleAlert(alertFor('AL16', 'PORTFOLIO'), undefined), false, 'portfolio-wide alert needs portfolio scope');
  assert.equal(access.pmo.canViewRuleAlert(alertFor('AL16', 'PORTFOLIO'), undefined), true);
  assert.equal(access.finance.canViewRuleAlert(alertFor('AL06', 'PRJ-2031'), project('PRJ-2031')), false, 'category visible is not enough: not a recipient');
  assert.equal(access.finance.canViewRuleAlert(alertFor('AL08', 'PRJ-2031'), project('PRJ-2031')), true);
  ['pm', 'territorial'].forEach((id) => ALERT_RULES.forEach((r) => assert.equal(access[id].canViewRuleAlert(alertFor(r.id, 'PRJ-2038'), project('PRJ-2038')), false, `${id} ${r.id}`)));
});
check('actions: only D acts, with the role permission and in scope; I never acts', () => {
  const act = (id, rule, state, pid) => access[id].canActOnRuleAlert(alertFor(rule, pid), state, project(pid));
  assert.equal(act('mo', 'AL06', 'acknowledged', 'PRJ-2031'), true);
  assert.equal(act('mo', 'AL06', 'resolved', 'PRJ-2031'), true);
  assert.equal(act('mo', 'AL06', 'resolved', 'PRJ-2035'), false);
  assert.equal(act('mo', 'AL06', 'dismissed', 'PRJ-2031'), false, 'MO holds no alerts.dismiss');
  assert.equal(act('mo', 'AL13', 'acknowledged', 'PRJ-2031'), false, 'MO is only informed of AL13');
  ['acknowledged', 'resolved', 'dismissed'].forEach((s) => assert.equal(act('dg', 'AL02', s, 'PRJ-2031'), false, `dg ${s}`));
  assert.equal(act('finance', 'AL08', 'acknowledged', 'PRJ-2031'), true);
  assert.equal(act('finance', 'AL08', 'resolved', 'PRJ-2031'), false, 'finance holds no alerts.resolve');
  assert.equal(act('pmo', 'AL10', 'dismissed', 'PRJ-2031'), true);
  assert.equal(act('pmo', 'AL01', 'acknowledged', 'PRJ-2031'), true);
  assert.equal(act('pmo', 'AL08', 'acknowledged', 'PRJ-2031'), false, 'PMO is only informed of AL08');
  ['pm', 'territorial'].forEach((id) => ['acknowledged', 'resolved', 'dismissed'].forEach((s) => assert.equal(act(id, 'AL10', s, 'PRJ-2038'), false)));
});
check('evidence masking input: KPI conditions hidden from a recipient are detectable (workbook inconsistencies)', () => {
  const masked = [];
  ['dg', 'pmo', 'mo', 'finance'].forEach((id) => access[id].reference.alerts.visible.forEach((ruleId) => {
    const rule = ALERT_RULES.find((r) => r.id === ruleId);
    [...new Set(rule.conditions.map((c) => String(c.field).match(/^([A-Z]{2}\d)/)?.[1]).filter(Boolean))].filter((k) => !access[id].canViewKpi(k)).forEach((k) => masked.push(`${id}/${ruleId}/${k}`));
  }));
  console.log(`      (info) ${masked.length} recipient/rule/KPI combinations are masked in alert evidence: ${masked.join(', ') || 'none'}`);
  masked.forEach((entry) => { const [id, , k] = entry.split('/'); assert.equal(access[id].canViewKpi(k), false); });
});

console.log('\nProject scope, routes and actions');
check('project scope is preserved: portfolio 8 for dg/pmo/finance/territorial; MO 2; PM 3', () => {
  ['dg', 'pmo', 'finance', 'territorial'].forEach((id) => assert.equal(access[id].filterProjects(projects).length, 8, id));
  assert.deepEqual(access.mo.filterProjects(projects).map((p) => p.id).sort(), ['PRJ-2028', 'PRJ-2031']);
  assert.equal(access.pm.filterProjects(projects).length, 3);
});
check('personas keep their ids, names and role labels', () => {
  assert.deepEqual(demoUsers.map((u) => [u.id, u.name, u.role.fr]), [
    ['dg', 'Amina Belkacem', 'Direction Générale'], ['pmo', 'Yacine Hamdi', 'PMO Central'], ['mo', 'Nadia Cherif', 'Maître d’Ouvrage'],
    ['pm', 'Sofiane Merabet', 'Chef de Projet'], ['finance', 'Karim Benali', 'Responsable Financier'], ['territorial', 'Lila Mansouri', 'Responsable Territorial']]);
});
check('routes per persona', () => {
  const expected = {
    dg: ['dashboard', 'kpi', 'alerts', 'map', 'portfolio', 'reports', 'collaboration', 'project-details'],
    pmo: ['dashboard', 'alerts', 'portfolio', 'collaboration', 'kpi', 'reports', 'project-details'],
    mo: ['dashboard', 'portfolio', 'project-details', 'alerts', 'collaboration', 'reports'],
    pm: ['dashboard', 'project-details', 'portfolio', 'alerts', 'collaboration'],
    finance: ['dashboard', 'kpi', 'portfolio', 'alerts', 'reports', 'collaboration', 'project-details'],
    territorial: ['dashboard', 'map', 'portfolio', 'kpi', 'alerts', 'reports', 'collaboration', 'project-details']
  };
  const all = ['dashboard', 'portfolio', 'map', 'kpi', 'alerts', 'collaboration', 'project-details', 'reports'];
  ROLE_IDS.forEach((id) => assert.deepEqual(all.filter((r) => access[id].canAccessRoute(r)).sort(), [...expected[id]].sort(), id));
});
check('project actions: update (pm only), validate (mo only), export set', () => {
  assert.deepEqual(ROLE_IDS.filter((id) => access[id].can('project.update')), ['pm']);
  assert.deepEqual(ROLE_IDS.filter((id) => access[id].can('project.validate')), ['mo']);
  assert.deepEqual(sorted(ROLE_IDS.filter((id) => access[id].can('report.export'))), ['dg', 'finance', 'mo', 'pmo', 'territorial']);
});
check('financial visibility: finance.view only where the workbook role sees financial KPIs', () => {
  const derived = ROLE_IDS.filter((id) => access[id].reference.kpi.financial.length > 0);
  assert.deepEqual(sorted(ROLE_IDS.filter((id) => access[id].canViewFinancials())), sorted(derived));
  assert.deepEqual(sorted(derived), ['dg', 'finance', 'mo', 'pmo']);
  assert.equal(access.pm.canViewFinancials(), false);
  assert.equal(access.territorial.canViewFinancials(), false);
});
check('CSV export drops budget / committed / paid without financial visibility', () => {
  const head = (financial) => projectsToCsv(projects, { financial }).split('\r\n')[0].split(';');
  assert.ok(head(true).includes('budget'));
  ['budget', 'committed', 'paid'].forEach((c) => assert.ok(!head(false).includes(c), c));
  assert.ok(projectsToCsv(projects, { financial: false }).indexOf('4820000000') === -1);
});
check('geographic scope: no persona→wilaya authorization exists, so territorial keeps portfolio scope and the gap is recorded (D-07, D-05)', () => {
  assert.equal(ROLE_CONFIG.territorial.scope, 'portfolio');
  assert.ok(R.PERSONA_REFERENCE_MAP.territorial.open.includes('D-07'));
  assert.ok(R.PERSONA_REFERENCE_MAP.finance.open.includes('D-05'));
});

console.log('\nWorkspaces');
check('six distinct landing dashboards, each with a rule-alert panel and its own KPI cards', () => {
  const sig = new Set(ROLE_IDS.map((id) => JSON.stringify(ROLE_CONFIG[id].dashboard.panels.map((p) => p.id))));
  assert.equal(sig.size, 6);
  ROLE_IDS.forEach((id) => assert.ok(ROLE_CONFIG[id].dashboard.panels.some((p) => p.component === 'ruleAlerts'), id));
  assert.equal(new Set(ROLE_IDS.map((id) => ROLE_CONFIG[id].dashboard.kpis.join())).size, 6);
});
check('panel names used by the six workspaces are registered', () => {
  const index = readFileSync(join(root, 'features/role-dashboards/panels/index.js'), 'utf8');
  ROLE_IDS.forEach((id) => ROLE_CONFIG[id].dashboard.panels.forEach((p) => assert.ok(new RegExp(`\\b${p.component}:`).test(index), `${id}: ${p.component}`)));
});
check('unresolved personas show the pending-decision panel and no referentiel shelf', () => {
  ['pm', 'territorial'].forEach((id) => {
    assert.ok(ROLE_CONFIG[id].dashboard.panels.some((p) => p.component === 'pendingDecisions'));
    assert.ok(!ROLE_CONFIG[id].dashboard.panels.some((p) => p.component === 'kpiShelf'));
    assert.ok(!ROLE_CONFIG[id].dashboard.kpis.some((k) => k.startsWith('ref.')));
  });
});

console.log(`\n${process.exitCode ? 'FAILED' : 'All checks passed'} (${passed} passed)\n`);
