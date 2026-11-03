/*
 * CSV export of the projects a persona is allowed to see. Shared by the Reports
 * module and the dashboard "Export" action. The caller checks the `report.export`
 * permission; this function only formats and downloads what it is given.
 */
const COLUMNS = ['id', 'name', 'wilaya', 'sector', 'status', 'progress', 'budget', 'committed', 'paid', 'dueDate', 'manager'];

const FINANCIAL = new Set(['budget', 'committed', 'paid']);

/** `financial: false` drops budget / committed / paid (persona without `finance.view`). */
export function projectsToCsv(projects, { financial = true } = {}) {
  const columns = financial ? COLUMNS : COLUMNS.filter((key) => !FINANCIAL.has(key));
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [columns.join(';'), ...projects.map((project) => columns.map((key) => escape(project[key])).join(';'))].join('\r\n');
}

export function exportProjectsCsv(projects, filename = 'taqaddum-portfolio-report.csv', options = {}) {
  const blob = new Blob(['﻿', projectsToCsv(projects, options)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
