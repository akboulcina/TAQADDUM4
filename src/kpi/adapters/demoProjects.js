/*
 * Adapter: demo dataset (src/data/projects.js) → KPI source records.
 *
 * Only fields that exist are mapped; every other field stays ABSENT, so the
 * engine reports it as missing instead of inventing it. The mapping rests on
 * three readings of the demo data, each also stated in the catalogue:
 *
 *   budget   → aeCurrent          the demo's "budget approuvé" is read as the AE actuelle approuvée
 *   progress → tap                the demo's "avancement" is read as the TAP (physical progress, %)
 *   dueDate  → contractualEndDate the demo's contractual due date is read as the date de fin contractuelle en vigueur
 *
 * `status: 'completed'` marks a finished project; every other status is « actif ».
 */
const ABSENT = undefined;
const pick = (value) => (value === null || value === undefined ? ABSENT : value);

export function toKpiSource(project) {
  if (!project) return null;
  return {
    id: project.id ?? project.code,
    name: project.name,
    status: project.status === 'completed' ? 'completed' : 'active',
    aeCurrent: pick(project.budget),
    committed: pick(project.committed),
    paymentsTotal: pick(project.paid),
    tap: pick(project.progress),
    contractualEndDate: pick(project.dueDate)
  };
}

export const toKpiSources = (projects) => projects.map(toKpiSource).filter(Boolean);

/** Demo field → engine field, for display in the catalogue ("what is mapped"). */
export const DEMO_FIELD_MAPPING = Object.freeze({ budget: 'aeCurrent', committed: 'committed', paid: 'paymentsTotal', progress: 'tap', dueDate: 'contractualEndDate' });
