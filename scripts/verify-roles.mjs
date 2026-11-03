/*
 * Role-model checks. Plain Node, no test framework and no dependency:
 *
 *   npm run test:roles
 *
 * It exercises the pure modules (roleConfig, access, selectors, workflow) and
 * checks that every translation key referenced by the role model and by the UI
 * exists in French, English and Arabic.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const load = (path) => import(new URL(`file://${join(root, path)}`));

const { demoUsers } = await load('data/users.js');
const { projects } = await load('data/projects.js');
const { executiveAlerts, territorialSites } = await load('data/dashboard.js');
const { translations } = await load('data/i18n.js');
const { ROLE_CONFIG, ROLE_IDS, PERMISSIONS } = await load('roles/roleConfig.js');
const { createAccess } = await load('roles/access.js');
const P = await load('roles/portfolio.js');
const W = await load('data/projectWorkflow.js');

let passed = 0;
const check = (name, fn) => {
  try { fn(); passed += 1; console.log(`  ✔ ${name}`); }
  catch (error) { console.error(`  ✘ ${name}\n      ${error.message}`); process.exitCode = 1; }
};
const byId = Object.fromEntries(demoUsers.map((user) => [user.id, user]));
const accessOf = Object.fromEntries(demoUsers.map((user) => [user.id, createAccess(user)]));
const ids = (list) => list.map((item) => item.id).sort();

console.log('\nRole model');
check('every persona has exactly one role config, and vice versa', () => {
  assert.deepEqual(demoUsers.map((u) => u.id).sort(), [...ROLE_IDS].sort());
  assert.deepEqual(Object.keys(ROLE_CONFIG).sort(), [...ROLE_IDS].sort());
});
check('only known permissions and known routes are configured', () => {
  const routes = new Set(['dashboard', 'portfolio', 'map', 'kpi', 'alerts', 'collaboration', 'project-details', 'reports']);
  ROLE_IDS.forEach((id) => {
    const config = ROLE_CONFIG[id];
    config.permissions.forEach((p) => assert.ok(PERMISSIONS.includes(p), `${id}: unknown permission ${p}`));
    config.nav.flatMap((s) => s.items).forEach((item) => assert.ok(routes.has(item.route), `${id}: unknown route ${item.route}`));
    assert.ok(accessOf[id].canAccessRoute(config.landing), `${id}: landing route not allowed`);
    config.dashboard.actions.forEach((a) => a.route && assert.ok(accessOf[id].canAccessRoute(a.route), `${id}: action ${a.id} targets a forbidden route`));
    config.dashboard.actions.forEach((a) => a.permission && assert.ok(accessOf[id].can(a.permission), `${id}: action ${a.id} needs ${a.permission}`));
  });
});
check('route guard: forbidden routes are refused even if not in the sidebar', () => {
  assert.equal(accessOf.pm.canAccessRoute('map'), false);
  assert.equal(accessOf.pm.canAccessRoute('kpi'), false);
  assert.equal(accessOf.pm.canAccessRoute('reports'), false);
  assert.equal(accessOf.mo.canAccessRoute('map'), false);
  assert.equal(accessOf.finance.canAccessRoute('map'), false);
  assert.equal(accessOf.territorial.canAccessRoute('map'), true);
  assert.equal(accessOf.dg.canAccessRoute('map'), true);
  ROLE_IDS.forEach((id) => assert.equal(accessOf[id].canAccessRoute('does-not-exist'), false));
});
check('the six roles do not share the same sidebar or the same dashboard', () => {
  const navs = new Set(ROLE_IDS.map((id) => JSON.stringify(ROLE_CONFIG[id].nav)));
  const dashboards = new Set(ROLE_IDS.map((id) => JSON.stringify(ROLE_CONFIG[id].dashboard)));
  assert.equal(navs.size, 6);
  assert.equal(dashboards.size, 6);
  const kpiSets = new Set(ROLE_IDS.map((id) => ROLE_CONFIG[id].dashboard.kpis.join(',')));
  assert.equal(kpiSets.size, 6);
});

console.log('\nProject scope');
check('portfolio-scope roles see all 8 projects', () => {
  ['dg', 'pmo', 'finance', 'territorial'].forEach((id) => assert.equal(accessOf[id].filterProjects(projects).length, projects.length, id));
});
check('assigned-scope roles see only projects whose manager is the persona', () => {
  assert.deepEqual(ids(accessOf.pm.filterProjects(projects)), ['PRJ-2015', 'PRJ-2038', 'PRJ-2041']);
  assert.deepEqual(ids(accessOf.mo.filterProjects(projects)), ['PRJ-2028', 'PRJ-2031']);
});

console.log('\nAction permissions');
const can = (id, permission, projectId) => {
  const project = projects.find((p) => p.id === projectId);
  return accessOf[id].canActOnProject(permission, project);
};
check('read-only roles cannot trigger any project write action', () => {
  ['finance', 'territorial', 'dg'].forEach((id) => {
    ['project.update', 'project.validate'].forEach((p) => assert.equal(can(id, p, 'PRJ-2031'), false, `${id} ${p}`));
  });
  assert.equal(accessOf.territorial.readOnly.projects, true);
  assert.equal(accessOf.territorial.readOnly.alerts, true);
  assert.equal(accessOf.finance.readOnly.projects, true);
});
check('PM updates, MO validates — never the reverse, and only on assigned projects', () => {
  assert.equal(can('pm', 'project.update', 'PRJ-2038'), true);
  assert.equal(can('pm', 'project.update', 'PRJ-2031'), false, 'PM must not act on another manager’s project');
  assert.equal(can('pm', 'project.validate', 'PRJ-2038'), false);
  assert.equal(can('mo', 'project.validate', 'PRJ-2031'), true);
  assert.equal(can('mo', 'project.validate', 'PRJ-2038'), false, 'MO must not validate an unassigned project');
  assert.equal(can('mo', 'project.update', 'PRJ-2031'), false);
});
check('alert actions follow the matrix, the alert view and the project scope', () => {
  const alerts = P.buildAlerts(projects, executiveAlerts);
  const alert = (id) => alerts.find((a) => a.id === id);
  const project = (a) => projects.find((p) => p.id === a.projectId);
  const act = (role, id, state) => accessOf[role].canActOnAlert(alert(id), state, project(alert(id)));
  assert.equal(act('dg', 'ALR-118', 'resolved'), true);
  assert.equal(act('dg', 'ALR-118', 'acknowledged'), false);
  assert.equal(act('dg', 'ALR-118', 'dismissed'), false);
  assert.equal(act('pmo', 'ALR-118', 'dismissed'), true);
  assert.equal(act('mo', 'ALR-118', 'resolved'), true, 'MO owns PRJ-2031');
  assert.equal(act('mo', 'ALR-116', 'resolved'), false, 'PRJ-2035 is not assigned to the MO');
  assert.equal(act('pm', 'ALR-114', 'acknowledged'), true);
  assert.equal(act('pm', 'ALR-114', 'resolved'), false);
  assert.equal(act('finance', 'ALR-112', 'acknowledged'), true);
  assert.equal(act('finance', 'ALR-118', 'acknowledged'), false, 'finance only handles budget alerts');
  ['territorial'].forEach((role) => ['acknowledged', 'resolved', 'dismissed'].forEach((s) => assert.equal(act(role, 'ALR-118', s), false)));
});
check('export is limited to roles that hold report.export', () => {
  assert.deepEqual(ROLE_IDS.filter((id) => accessOf[id].can('report.export')).sort(), ['dg', 'finance', 'mo', 'pmo', 'territorial']);
});

console.log('\nDerived KPIs (single source of truth)');
const all = P.summarizePortfolio(projects, new Date(2026, 9, 30));
check('portfolio totals are recomputed from the dataset, not hard-coded', () => {
  assert.equal(all.total, 8);
  assert.equal(all.budget, projects.reduce((s, p) => s + p.budget, 0));
  assert.equal(all.paid, projects.reduce((s, p) => s + p.paid, 0));
  assert.equal(all.activeCount, 7);
  assert.equal(all.delayed.length, 2);
  assert.equal(all.atRisk.length, 2);
  assert.ok(Math.abs(all.weightedProgress - 64.5) < 0.1, `weighted progress ${all.weightedProgress}`);
  assert.ok(Math.abs(all.spendingGap - (all.consumption - all.weightedProgress)) < 1e-9);
});
check('scoped summaries add up to the portfolio (no project lost or double counted)', () => {
  const pm = P.summarizePortfolio(accessOf.pm.filterProjects(projects));
  const mo = P.summarizePortfolio(accessOf.mo.filterProjects(projects));
  assert.equal(pm.total, 3);
  assert.equal(mo.total, 2);
  assert.equal(pm.budget, 4820000000 + 1260000000 + 1980000000);
  assert.equal(mo.budget, 3640000000 + 7180000000);
});
check('alert builder is deterministic and ids are unique', () => {
  const a = P.buildAlerts(projects, executiveAlerts, new Date(2026, 9, 30));
  assert.equal(new Set(a.map((x) => x.id)).size, a.length);
  assert.equal(a.length, 8);
  assert.ok(a.every((x) => ['schedule', 'budget', 'risk', 'reporting'].includes(x.category)));
});
check('role alert views differ', () => {
  const a = P.buildAlerts(projects, executiveAlerts, new Date(2026, 9, 30));
  const view = (id) => a.filter((x) => P.matchesAlertView(x, accessOf[id].alertView)).length;
  assert.equal(view('dg'), 3);
  assert.equal(view('finance'), 1);
  assert.equal(view('territorial'), 5);
  assert.equal(view('pmo'), 8);
});
check('map markers are derived from projects (Alger agrees with PRJ-2035)', () => {
  const sites = P.deriveSites(territorialSites, projects);
  const alger = sites.find((s) => s.wilaya === 'Alger');
  assert.equal(alger.progress, 52);
  assert.equal(alger.status, 'atRisk');
  assert.equal(P.deriveSites(territorialSites, accessOf.pm.filterProjects(projects)).length, 3);
});
check('PM focus project is the delayed, critical one', () => {
  assert.equal(P.selectFocusProject(accessOf.pm.filterProjects(projects)).id, 'PRJ-2015');
});

console.log('\nWorkflow (milestones / deliverables)');
check('PM step is project.update, MO step is project.validate, final state has no step', () => {
  assert.equal(W.nextStep('deliverable', 'attendu').permission, 'project.update');
  assert.equal(W.nextStep('deliverable', 'en cours').permission, 'project.validate');
  assert.equal(W.nextStep('deliverable', 'validé'), null);
  assert.equal(W.nextStep('milestone', 'upcoming').to, 'inProgress');
  assert.equal(W.nextStep('milestone', 'completed'), null);
});
check('completed projects start fully validated; others get an independent copy', () => {
  const wf = W.createInitialWorkflow(projects);
  assert.ok(wf['PRJ-2019'].deliverables.every((d) => d.status === 'validé'));
  assert.equal(wf['PRJ-2041'].deliverables.find((d) => d.id === 'DL2').status, 'en cours');
  wf['PRJ-2041'].deliverables[0].status = 'changed';
  assert.notEqual(wf['PRJ-2038'].deliverables[0].status, 'changed');
});

console.log('\nTranslations');
const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const full = join(dir, name);
  return statSync(full).isDirectory() ? walk(full) : /\.(jsx?|mjs)$/.test(name) ? [full] : [];
});
const languages = ['fr', 'en', 'ar'];
check('fr / en / ar define exactly the same keys', () => {
  const base = Object.keys(translations.fr).sort();
  languages.forEach((lang) => assert.deepEqual(Object.keys(translations[lang]).sort(), base, `${lang} differs from fr`));
});
check('no translation is empty', () => {
  languages.forEach((lang) => Object.entries(translations[lang]).forEach(([key, value]) => assert.ok(String(value).trim(), `${lang}:${key} is empty`)));
});
check('every key used by the UI or the role config exists', () => {
  const used = new Set();
  walk(root).forEach((file) => {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/\bt\(\s*['"`]([\w.]+)['"`]/g)) used.add(match[1]);
    for (const match of source.matchAll(/(?:labelKey|titleKey|subtitleKey|descriptionKey|emptyKey|sectionKey|noteKey)\s*[:=]\s*['"]([\w.]+)['"]/g)) used.add(match[1]);
  });
  // Keys passed through variables (lookup maps, ternaries) never appear inside t('…'): also check every
  // string literal that looks like a key under a prefix the dictionary already uses.
  const prefixes = new Set(Object.keys(translations.fr).map((key) => key.split('.')[0]));
  const notKeys = new Set(PERMISSIONS);
  walk(root).forEach((file) => {
    for (const match of readFileSync(file, 'utf8').matchAll(/['"`]([a-z]+(?:\.[A-Za-z]+)+)['"`]/g)) {
      if (prefixes.has(match[1].split('.')[0]) && !notKeys.has(match[1]) && !/\.(jsx?|css|svg|json)$/.test(match[1])) used.add(match[1]);
    }
  });
  const missing = [...used].filter((key) => !(key in translations.fr));
  assert.deepEqual(missing, [], `missing keys: ${missing.join(', ')}`);
});
const kpiModule = await load('features/role-dashboards/kpiDefinitions.js').catch(() => null);
if (kpiModule) {
  check('every dashboard KPI id has a definition', () => {
    ROLE_IDS.forEach((id) => ROLE_CONFIG[id].dashboard.kpis.forEach((kpi) => assert.ok(kpiModule.resolveKpiDefinition(kpi), `${id}: unknown KPI ${kpi}`)));
  });
  check('every KPI label key exists in all languages', () => {
    Object.entries(kpiModule.KPI_DEFINITIONS).forEach(([id, def]) => languages.forEach((lang) => assert.ok(translations[lang][def.labelKey], `${lang}: ${id} → ${def.labelKey}`)));
  });
}

console.log(`\n${process.exitCode ? 'FAILED' : 'All checks passed'} (${passed} passed)\n`);
