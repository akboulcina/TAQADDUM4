# TAQADDUM — Phase 2 alert engine

## What was added

- `src/alerts/ruleRegistry.js`: immutable declarative registry generated from `02_Regles_Alertes` and recipient D/I columns in `03_Matrice_Roles`. Exactly AL01–AL17.
- `src/alerts/engine.js`: generic tri-state evaluator for nested AND/OR, numeric comparisons, equality/inequality, booleans, historical variation, consecutive periods, missing values and confidence.
- `src/alerts/sourceSchema.js`: explicit contract for auxiliary source fields and temporal KPI series. Missing properties remain missing.
- `src/alerts/recipients.js`: D/I mapping to unambiguous current personas and an explicit list of unresolved role mappings.
- `src/alerts/lifecycle.js`: stable rule/entity IDs, duplicate suppression, workflow transitions, audit history and reopening after a false evaluation.
- `AlertsModule`: operational alert center, filters, evidence, history, assignment, due dates and in-app notifications.
- `scripts/verify-alerts.mjs`: positive, negative, missing-data, low-confidence, nested-logic, duplicate and reopen tests.

## Source-field contract

Optional auxiliary data must be supplied on each project using `alertSources`, with nested objects matching `ALERT_SOURCE_FIELD_SCHEMA`, for example `alertSources.Blocage.Plan_Valide`. No values are defaulted. Historical samples belong in `alertHistory.CO1` and `alertHistory.AV2`.

The existing demo adapter still maps only the five source fields it already knows. It does not fabricate contractual, financial, blocker, non-conformity, amendment or situation data.

## Data-quality gate

For operational rules, DO1, DO2 and DO3 must be available with at least medium confidence. Stale data (DO1 > 2), low completeness (DO2 < 70%) or excessive inconsistency (DO3 > 20%) blocks an operational alert and returns `insufficient_data`. AL16 is the dedicated data-quality rule and is not blocked by its own DO1/DO3 findings.

For AL16, the DO1 condition is evaluated as the worst freshness ratio across the project scope; the value is available only when every project has a valid DO1 value. DO3 uses the portfolio KPI. This is a conservative portfolio-wide test, not a replacement KPI formula.

## Current demo data: unevaluable rule coverage

The current eight demo projects deliberately contain only the Phase 1 adapter fields. No auxiliary `alertSources` or `alertHistory` have been invented. As of the demo reference date 2026-11-01, none of the 17 rules can safely produce an operational alert.

| Rule | Missing KPI / auxiliary source fields in current demo |
|---|---|
| AL01 | FI6, AV3, PP2 |
| AL02 | QR1, DL1, Blocage.Plan_Valide |
| AL03 | FI2, FI5, FI3 |
| AL04 | CO1 monthly history, PP2, FI6 |
| AL05 | Blocage.Jours_avant_date_estimee, Blocage.Statut, Blocage.Plan_Confirme |
| AL06 | DL1, AV2; some present values also have insufficient confidence |
| AL07 | AV2 two-period history, AV3 |
| AL08 | FI4, FI5 |
| AL09 | QR7, NC.Action_Validee |
| AL10 | Blocage.Age_jours, Blocage.Responsable |
| AL11 | FI6, Situation.Age_jours |
| AL12 | QR6, Avenant.Statut; some values require validation |
| AL13 | DL2, DL1 |
| AL14 | GV2 |
| AL15 | QR4, Projet.Arret_en_cours_jours |
| AL16 | DO1 (project update timestamps); DO3 is available |
| AL17 | QR3 |

Operational rules are additionally gated by the current DO1/DO2 confidence profile. AL16 requires project-level freshness evidence for the complete scope.

## Recipient mapping gaps

The six workbook roles do not map one-to-one to the six current personas. Direction CNED → `dg`, CNED/PMO → `pmo`, MO → `mo`, and Finance → `finance` are unambiguous. BET and Contractant have no corresponding persona. The current `pm` and `territorial` personas have no workbook recipient role. Nine rule/role recipient assignments therefore remain explicitly unmapped (BET: 3; Contractant: 6). No role is assigned arbitrarily.

## Lifecycle

Allowed transitions are:

`open → acknowledged → under_review → action_planned → resolved`

Dismissal is available from active states where the persona is a designated D recipient and has the corresponding permission. A condition that becomes false is recorded; if it becomes true after resolution/dismissal, the same rule/entity key is reopened as a new occurrence while retaining the audit trail.

## Verification

- `npm run test:alerts`: passed (17 rules × positive/negative/missing/low-confidence, nested AND/OR, boolean/OR partial-data cases, duplicate suppression and reopening).
- `npm run test:roles`: passed (23 checks).
- `npm run test:map`: passed (18 checks).
- `npm run test:kpi`: passed (129 checks).
- TypeScript parser syntax validation: 94 JS/JSX files, 0 syntax errors.

`npm run build` could not be completed in this environment: the extracted project did not contain a usable Vite executable, and npm registry DNS resolution failed (`EAI_AGAIN`) while attempting `npm ci`. Re-run `npm ci` and `npm run build` in an environment with registry access before deployment.

## Scope limitations

This remains frontend-only demo state held in memory and is reset on sign-out/reload. It is not a persistent server-side alert service or a security boundary. There is no email or external notification provider. Production deployment requires server-side evaluation, persistence, authorization and audit storage.
