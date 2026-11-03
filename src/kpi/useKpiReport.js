import { useMemo } from 'react';
import { calculateKpis } from './engine.js';
import { toKpiSources } from './adapters/demoProjects.js';

const pad = (n) => String(n).padStart(2, '0');
/** Local calendar day as yyyy-mm-dd, so a Date rebuilt on every render does not rerun the engine. */
export const isoDay = (date) => (typeof date === 'string' ? date.slice(0, 10) : `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`);

/**
 * Runs the engine once for the persona's SCOPED projects. This is the only
 * bridge between the app and the KPI engine: the catalogue and the dashboard
 * panel both read this report, so a number can never differ between screens.
 */
export function useKpiReport(projects, referenceDate) {
  const day = referenceDate ? isoDay(referenceDate) : null;
  return useMemo(() => {
    if (!day) return null;
    return calculateKpis(toKpiSources(projects ?? []), { referenceDate: day });
  }, [projects, day]);
}
