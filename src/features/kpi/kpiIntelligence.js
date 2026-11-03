import { CALC_STATE } from '../../kpi/constants.js';
import { FAMILIES } from '../../kpi/registry.js';

export const TREND_REQUIRED_SOURCE = 'kpi_history — colonnes requises : kpi_id, project_id, period_start, period_end, value, status, source, computed_at';

export function familySummaries(rows) {
  return FAMILIES.map((family) => {
    const familyRows = rows.filter((row) => row.kpi.family === family.code);
    const available = familyRows.filter((row) => row.result?.state === CALC_STATE.CALCULATED).length;
    const partial = familyRows.filter((row) => row.result?.state === CALC_STATE.PARTIAL).length;
    return {
      ...family,
      total: familyRows.length,
      available,
      partial,
      unevaluable: familyRows.length - available - partial
    };
  }).filter((family) => family.total > 0);
}

export function statusDistribution(rows) {
  const distribution = { green: 0, orange: 0, red: 0, informational: 0, not_evaluable: 0 };
  rows.forEach((row) => {
    const status = row.result?.status ?? 'not_evaluable';
    distribution[status] = (distribution[status] ?? 0) + 1;
  });
  return distribution;
}

const CSV_COLUMNS = ['kpi_id', 'kpi_name', 'family', 'unit', 'value', 'status', 'state', 'confidence', 'level', 'phase'];

const csvCell = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function kpiRowsToCsv(rows, formatValue) {
  const lines = [CSV_COLUMNS.join(',')];
  rows.forEach(({ kpi, result, level }) => {
    lines.push([
      kpi.id,
      kpi.name,
      kpi.family,
      kpi.unit,
      formatValue ? formatValue(result, kpi.unit, {}) ?? '' : result?.value ?? '',
      result?.status ?? 'not_evaluable',
      result?.state ?? 'none',
      result?.confidence ?? '',
      level,
      kpi.phase
    ].map(csvCell).join(','));
  });
  return lines.join('\n');
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
