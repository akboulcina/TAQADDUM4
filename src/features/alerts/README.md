# Alerts & Risks module

Named export:

```js
import { AlertsModule } from './features/alerts/AlertsModule.jsx';
```

Props: `alerts`, `projects`, `user`.

The module combines supplied alerts with locally derived operational alerts based on project due dates, budget values, progress and risk status. Acknowledge, resolve and dismiss actions use local component state only. No API call or persistence is performed.

Optional role-model props (defaults keep the previous behaviour): `alertView` (`{ minSeverity?, categories? }`), `actionState` + `onAction(alert, state)` (shared, controlled state), `canAct(alert, state)` (disables buttons the persona may not use) and `labels.noPermission`. Alerts are built by the shared `buildAlerts` (`src/roles/portfolio.js`), the same function the dashboards and the sidebar badge use.
