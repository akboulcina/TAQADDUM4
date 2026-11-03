import { useApp } from '../../context/AppContext.jsx';

/* Small shared pieces of the 43-KPI catalogue and of the dashboard panel. */

/** Translation lookup that falls back to `fallback` instead of echoing the key. */
export function useLabels() {
  const { t } = useApp();
  const has = (key) => t(key) !== key;
  const field = (key) => (has(`kpr.field.${key}`) ? t(`kpr.field.${key}`) : key);
  const fields = (list) => (list ?? []).map(field).join(', ');
  return { t, has, field, fields };
}

const STATUS_TONE = { green: 'green', orange: 'orange', red: 'red', informational: 'info', not_evaluable: 'muted' };
const STATE_TONE = { calculated: 'ok', partial: 'warn', missing_data: 'muted', not_applicable: 'muted', not_implemented: 'danger', requires_validation: 'warn' };

export function StatusPill({ status }) {
  const { t } = useApp();
  return <span className={`kpr-pill kpr-status-${STATUS_TONE[status] ?? 'muted'}`}><i aria-hidden="true" />{t(`kpr.status.${status ?? 'not_evaluable'}`)}</span>;
}

export function StatePill({ state }) {
  const { t } = useApp();
  if (!state) return <span className="kpr-pill kpr-state-muted">{t('kpr.noValue')}</span>;
  return <span className={`kpr-pill kpr-state-${STATE_TONE[state] ?? 'muted'}`}>{t(`kpr.state.${state}`)}</span>;
}

export function Tag({ tone = 'plain', title, children }) {
  return <span className={`kpr-tag kpr-tag-${tone}`} title={title}>{children}</span>;
}

/** A reason produced by the engine ({code, params}) as one sentence in the current language. */
export function reasonText({ t, field }, reason) {
  const params = { ...(reason.params ?? {}) };
  if (Array.isArray(params.fields)) params.fields = params.fields.map(field).join(', ');
  if (typeof params.field === 'string') params.field = field(params.field);
  if (Array.isArray(params.components)) params.components = params.components.join(', ');
  return t(`kpr.reason.${reason.code}`, params);
}
