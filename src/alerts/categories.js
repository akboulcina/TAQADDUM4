/*
 * Alert categories — one definition shared by the alert centre, the role model
 * and the dashboards (it used to be copied in three places).
 *
 * `label` is what the alert centre shows; `viewKey` is the vocabulary of the
 * role `alertView` filter in roleConfig.js ('budget' | 'schedule' | 'risk' | 'reporting').
 */
const LABEL_BY_RULE = Object.freeze({
  AL16: 'Qualité des données',
  AL03: 'Financier', AL08: 'Financier', AL11: 'Financier',
  AL06: 'Délais / avancement', AL07: 'Délais / avancement', AL13: 'Délais / avancement',
  AL10: 'Gouvernance', AL14: 'Gouvernance', AL17: 'Gouvernance',
  AL02: 'Terrain / qualité', AL05: 'Terrain / qualité', AL09: 'Terrain / qualité', AL12: 'Terrain / qualité', AL15: 'Terrain / qualité'
});

const VIEW_KEY_BY_LABEL = Object.freeze({
  'Financier': 'budget',
  'Délais / avancement': 'schedule',
  'Terrain / qualité': 'risk',
  'Gouvernance': 'risk',
  'Contractuel': 'risk',
  'Qualité des données': 'reporting'
});

/** Category label of a rule (AL01 and AL04 — not listed — are « Contractuel »). */
export const alertCategoryLabel = (ruleId) => LABEL_BY_RULE[ruleId] ?? 'Contractuel';
export const alertViewKey = (ruleId) => VIEW_KEY_BY_LABEL[alertCategoryLabel(ruleId)];
/** Legacy severity vocabulary used by roleConfig `alertView.minSeverity`. */
export const alertSeverityKey = (severity) => (severity === 'ROUGE' ? 'critical' : 'high');
