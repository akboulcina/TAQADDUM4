# Project Details module

Named export:

```js
import { ProjectDetailsModule } from './features/project-details/ProjectDetailsModule.jsx';
```

Props: `project`, `user`, `onBack`.

The module displays overview, financial, milestone, deliverable, risk, stakeholder and activity sections. Milestone and deliverable updates, as well as follow-up notes, are local demonstration interactions only. If `project` is missing, a graceful empty state with a return action is displayed.

Optional role-model props (defaults keep the previous behaviour): `workflow` + `onAdvance(kind, itemId)` (shared milestone / deliverable state; two-step flow — `project.update` starts, `project.validate` approves), `permissions` (`{ update, validate, note }` for this project) and `labels`. Without `permissions` the notes form and buttons are enabled as before.
