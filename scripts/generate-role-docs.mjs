/* Generates docs/role-mapping-phase3.md from the live data:  node scripts/generate-role-docs.mjs */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (p) => import(new URL(`file://${join(root, 'src', p)}`));
const { demoUsers } = await load('data/users.js');
const { ROLE_CONFIG, ROLE_IDS } = await load('roles/roleConfig.js');
const { createAccess } = await load('roles/access.js');
const R = await load('roles/roleReference.js');
const { KPI_REGISTRY } = await load('kpi/registry.js');
const { ALERT_RULES } = await load('alerts/ruleRegistry.js');
const { alertCategoryLabel } = await load('alerts/categories.js');

const users = Object.fromEntries(demoUsers.map((u) => [u.id, u]));
const acc = Object.fromEntries(demoUsers.map((u) => [u.id, createAccess(u)]));
const L = [];
const row = (...c) => L.push(`| ${c.join(' | ')} |`);
const head = (...c) => { row(...c); row(...c.map(() => '---')); };

L.push('# TAQADDUM — Phase 3: role-based KPI visibility, permissions and workspaces', '', '> Généré par `node scripts/generate-role-docs.mjs` à partir du code (ne pas éditer à la main). Comportement de démonstration côté navigateur : **pas une frontière de sécurité**.', '');
L.push('## 1. Role-to-reference mapping', '');
head('Persona', 'Rôle du classeur', 'Statut', 'Base / réserve', 'Décisions');
ROLE_IDS.forEach((id) => { const m = R.PERSONA_REFERENCE_MAP[id]; row(`${users[id].name} (\`${id}\`, ${users[id].role.fr})`, m.excelRole ? R.REFERENCE_ROLES[m.excelRole].label : '— aucun —', m.status, `${m.basis}${m.labelNote ? ' ' + m.labelNote : ''}`, m.open.join(', ') || '—'); });
L.push('', '### Rôles du classeur sans persona', '');
head('Rôle', 'Statut', 'Raison', 'Décision');
Object.entries(R.UNMAPPED_REFERENCE_ROLES).forEach(([k, m]) => row(R.REFERENCE_ROLES[k].label, m.status, m.reason, m.decision));
L.push('', '### Équivalences volontairement refusées', '');
head('Persona', 'Rôle du classeur', 'Pourquoi pas');
R.REJECTED_EQUIVALENCES.forEach((e) => row(`\`${e.persona}\``, R.REFERENCE_ROLES[e.excelRole].label, e.reason));
L.push('', '## 2. Decisions needed (unresolved)', '');
head('ID', 'Sujet', 'Question', 'Comportement actuel (défaut sûr)', 'Il faut');
R.PENDING_DECISIONS.forEach((d) => row(d.id, d.subject, d.question, d.safeDefault, d.needs));

L.push('', '## 3. Exact KPI visibility mapping', '', 'R = responsable (valide et rend compte) · S = alimente · V = consulte · vide = non visible. Lu depuis `03_Matrice_Roles`, jamais ressaisi.', '');
head('KPI', 'Nom', ...ROLE_IDS.map((id) => `\`${id}\``));
KPI_REGISTRY.forEach((k) => row(k.id, k.name, ...ROLE_IDS.map((id) => acc[id].kpiRight(k.id) ?? '')));
L.push('', '### Per persona', '');
head('Persona', 'Visibles', 'R (responsable)', 'S (alimente)', 'V (lecture seule)', 'Masqués', 'Familles visibles');
ROLE_IDS.forEach((id) => { const p = acc[id].reference.kpi; row(`\`${id}\``, p.visible.length, p.owned.join(' ') || '—', p.contributes.join(' ') || '—', p.readOnly.join(' ') || '—', p.hidden.length, p.families.join(' ') || '—'); });

L.push('', '## 4. Exact alert recipient mapping', '', 'D = doit agir · I = informé · vide = non destinataire.', '');
head('Règle', 'Nom', 'Niveau', 'Catégorie', ...ROLE_IDS.map((id) => `\`${id}\``), 'BET', 'Contractant');
ALERT_RULES.forEach((r) => row(r.id, r.name, r.severity, alertCategoryLabel(r.id), ...ROLE_IDS.map((id) => acc[id].alertRecipientCode(r.id) ?? ''), r.recipientRoles.find((x) => x.excelRole === 'bet')?.code ?? '', r.recipientRoles.find((x) => x.excelRole === 'contractor')?.code ?? ''));
L.push('', 'Les colonnes BET et Contractant ne sont servies à aucune persona (D-01, D-02).', '');

L.push('## 5. Permissions', '');
const perms = ['alerts.acknowledge', 'alerts.resolve', 'alerts.dismiss', 'project.update', 'project.validate', 'project.note', 'report.export', 'finance.view'];
head('Permission', ...ROLE_IDS.map((id) => `\`${id}\``));
perms.forEach((p) => row(p, ...ROLE_IDS.map((id) => (acc[id].can(p) ? '✔' : '–'))));
row('Agir sur une alerte de règle', ...ROLE_IDS.map((id) => (acc[id].reference.alerts.decide.length ? `✔ (D : ${acc[id].reference.alerts.decide.length})` : '–')));
L.push('', '- `canViewKpi` = R, S ou V ; `canContributeKpi` = S uniquement ; `canValidateKpi` = R uniquement. Aucun n’implique un droit d’écriture sur les projets (aucun écran de saisie n’existe, D-09).', '- Une alerte n’est agissable que si la persona est **D**, détient la permission de rôle et voit le projet (périmètre).', '- Non résolu ⇒ masqué : `pm` et `territorial` n’ont ni KPI du référentiel, ni alerte de règle, ni `finance.view`.', '');

L.push('## 6. Workspaces', '');
head('Persona', 'Landing', 'Cartes KPI', 'Panneaux', 'Périmètre projets');
ROLE_IDS.forEach((id) => { const c = ROLE_CONFIG[id]; row(`\`${id}\``, c.dashboard.titleKey, c.dashboard.kpis.join(', '), c.dashboard.panels.map((p) => p.component).join(', '), c.scope); });
writeFileSync(join(root, 'docs', 'role-mapping-phase3.md'), L.join('\n') + '\n');
console.log('docs/role-mapping-phase3.md written');
