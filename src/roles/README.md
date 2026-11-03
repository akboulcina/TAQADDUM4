# Role model — dashboards, navigation, scope and action permissions

> ## ⚠ Demonstration behaviour — not security
> TAQADDUM is a frontend-only prototype. Everything in this folder runs in the browser, where it can be
> inspected, edited or bypassed (dev tools, `sessionStorage`, editing the bundle). It shows **how the product
> behaves for each role**; it does **not** protect anything. In production, route access, project scope and every
> write permission below must be enforced by a backend on each request, and the frontend should only reflect
> what the server allows.

## Where things live

| File | Purpose |
|---|---|
| `roleConfig.js` | **Single source of truth.** Per persona: scope, permissions, sidebar, alert view, dashboard (KPIs, panels, actions). Edit this to change a role. |
| `access.js` | Turns the config into answers (`can`, `canAccessRoute`, `filterProjects`, `canActOnProject`, `canActOnAlert`…). Components never compare role ids. |
| `portfolio.js` | Pure selectors: portfolio summary, shared alert builder, financial indicators, territorial sites. |
| `useRoleScope.js` | Hook: everything the active persona may see (scoped projects, alerts, workflow items, activity, badges). |
| `format.js` / `exportCsv.js` | Language-aware formatting; CSV export of the visible projects. |
| `../context/DemoStateContext.jsx` | Shared demo state (alert states, workflow, activity log). Every action re-checks `access`. |
| `../features/role-dashboards/` | Config-driven dashboard renderer, KPI registry (`kpiDefinitions.js`) and panels. |

## Role matrix

| | Direction Générale (`dg`) | PMO Central (`pmo`) | Maître d’Ouvrage (`mo`) | Chef de Projet (`pm`) | Responsable Financier (`finance`) | Responsable Territorial (`territorial`) |
|---|---|---|---|---|---|---|
| Level | decision | coordination | validation | execution | monitoring | monitoring |
| Project scope | whole portfolio | whole portfolio | **assigned** (`manager` = persona) | **assigned** | whole portfolio | whole portfolio |
| Landing | Executive dashboard | PMO control room | My projects & approvals | My project delivery | Financial dashboard | Territorial dashboard |
| Alert view | critical + high | all | all (own projects) | all (own projects) | budget only | schedule + risk |
| Acknowledge alert | – | ✔ | ✔ | ✔ | ✔ | – |
| Resolve alert | ✔ (arbitrate) | ✔ | ✔ | – | – | – |
| Dismiss alert | – | ✔ | – | – | – | – |
| Start milestone / deliverable (`project.update`) | – | – | – | ✔ | – | – |
| Approve milestone / deliverable (`project.validate`) | – | – | ✔ | – | – | – |
| Add project note | ✔ | ✔ | ✔ | ✔ | – | – |
| Export CSV | ✔ | ✔ | ✔ (own) | – | ✔ | ✔ |
| Map / KPI / Reports routes | ✔ / ✔ / ✔ | – / ✔ / ✔ | – / – / ✔ | – / – / – | – / ✔ / ✔ | ✔ / ✔ / ✔ |

Collaboration, Portfolio, Alerts and Project details are available to every role, limited to the role’s scope.
Project-scoped permissions (`alerts.*`, `project.*`) only apply to projects in the role’s scope.

## How the rules were derived

From what already exists in the code: the six personas and their `focus` text (`src/data/users.js`), the
`project.manager` field (assignment), and the existing `RoleDashboard` README. The TAQADDUM 43-KPI referentiel
(roles, alert rules, interfaces I1–I7) is **not** in this repository, so the matrix above is an interpretation to
review against it — change `roleConfig.js` and nothing else.

## Demo data that is not operational data

The dataset has no milestones or deliverables. Each project gets a copy of the generic template that Project Details
already used (`src/data/projectWorkflow.js`); it is labelled **“Workflow de démonstration”** wherever it appears. The
PM starts an item, the MO approves it; both write to the same shared state, so the other role’s dashboard follows.

## Adding or changing a role

1. Add the persona to `src/data/users.js`.
2. Add its entry to `ROLE_CONFIG` (`roleConfig.js`). Choose KPI ids from `kpiDefinitions.js` and panel names from
   `panels/index.js`; add a new KPI/panel there only if none fits.
3. Add the translation keys it uses to `src/data/i18n.roles.js` (fr / en / ar on one line).
4. `npm run test:roles` — it fails on an unknown permission, route, KPI or missing translation.

## Phase 3 — workbook visibility (KPI R/S/V, alert D/I)

| File | Purpose |
|---|---|
| `roleReference.js` | Persona ↔ workbook role mapping, rejected equivalences, open decisions D-01…D-09. Data only. |
| `referenceAccess.js` | Derives each persona's KPI rights and alert codes from the registries generated from the workbook. |
| `access.js` | Exposes `canViewKpi`, `canContributeKpi` (S), `canValidateKpi` (R), `alertRecipientCode`, `canViewRuleAlert`, `canActOnRuleAlert`, `canViewFinancials`. |

Unresolved personas (`pm`, `territorial`) get the safe default: no referentiel KPI, no rule alert, no `finance.view`.
Full tables: `docs/role-mapping-phase3.md` (regenerate with `node scripts/generate-role-docs.mjs`). Tests: `npm run test:matrix`.
