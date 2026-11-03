import { evaluateAlertRules } from './engine.js';

/*
 * Evaluates the 17 alert rules for the projects of ONE scope, from the KPI report
 * computed on that same scope. Extracted from the alert centre so the dashboards,
 * the sidebar badge and the alert centre all read the same evaluations.
 *
 * Pure: no React, no clock (the timestamp is passed in). The caller supplies the
 * already-scoped projects — this function never widens a scope.
 */
export function evaluateProjectScope(projects, report, at) {
  if (!report) return [];
  const sourceById = new Map(projects.map((project) => [project.id ?? project.code, project]));

  const operational = report.projects.flatMap((entry) => {
    const project = sourceById.get(entry.id) ?? entry.project;
    const quality = { DO1: entry.kpis.DO1, DO2: entry.kpis.DO2, DO3: report.portfolio.DO3 };
    const kpis = { ...entry.kpis, DO3: report.portfolio.DO3 };
    return evaluateAlertRules({
      project, projectId: entry.id, kpis, quality,
      history: project.alertHistory ?? {},
      sourceFields: project.alertSources ?? {}
    }, at).filter((evaluation) => evaluation.ruleId !== 'AL16');
  });

  // AL16 (data quality) is evaluated once for the whole scope.
  const do1Results = report.projects.map((entry) => entry.kpis.DO1);
  const allFreshnessKnown = do1Results.length > 0 && do1Results.every((item) => item?.value !== null && item?.value !== undefined);
  const rank = { none: 0, low: 1, medium: 2, high: 3 };
  const do1Confidence = do1Results.reduce((lowest, item) => (
    !item || (rank[item.confidence] ?? 0) < (rank[lowest] ?? 0) ? (item?.confidence ?? 'none') : lowest
  ), 'high');
  const portfolioKpis = {
    DO1: {
      value: allFreshnessKnown ? Math.max(...do1Results.map((item) => Number(item.value))) : null,
      confidence: do1Confidence, state: allFreshnessKnown ? 'calculated' : 'missing_data'
    },
    DO3: report.portfolio.DO3
  };
  const portfolioQuality = { DO1: portfolioKpis.DO1, DO2: report.portfolio.DO2, DO3: report.portfolio.DO3 };
  const dataQualityEvaluation = evaluateAlertRules({
    projectId: 'PORTFOLIO', entityId: 'PORTFOLIO',
    kpis: portfolioKpis, quality: portfolioQuality, sourceFields: {}, history: {}
  }, at).filter((evaluation) => evaluation.ruleId === 'AL16');

  return [...operational, ...dataQualityEvaluation];
}
