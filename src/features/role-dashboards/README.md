# Role-specific dashboards

Landing dashboard of every persona, rendered from the role config (`src/roles/roleConfig.js` → `dashboard`).

```js
import { RoleDashboard } from './features/role-dashboards/RoleDashboard.jsx';
<RoleDashboard scope={useRoleScope()} nav={{ navigate, openProject, openWilaya }} />
```

- `scope` — output of `useRoleScope()`: the projects, alerts, workflow items and activity the persona may see.
- `nav` — callbacks used by buttons inside panels. `openProject` ignores projects outside the persona’s scope.

A dashboard is `{ kpis: [ids], panels: [{ component, props, span }], actions: [...] }`:

- KPI ids resolve in `kpiDefinitions.js`; each KPI is computed from the **scoped** data, never typed in.
- Panel components resolve in `panels/index.js` (executive, coordination, owner, delivery, finance, territorial).
- Header actions are filtered by permission (`export` needs `report.export`) and by route access.

Panels that rely on milestones / deliverables show a **“Workflow de démonstration”** tag: the project dataset has no
such records, so they come from a labelled template (`src/data/projectWorkflow.js`). All values are simulated and must
not be presented as official CNED data. Role restrictions are demonstration behaviour — see `src/roles/README.md`.

The former `ExecutiveDashboard.jsx` was replaced by this engine: the Direction Générale view reuses the same executive
widgets (`executive-dashboard/components`) as panels.
