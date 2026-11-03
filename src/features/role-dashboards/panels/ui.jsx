import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../../../context/AppContext.jsx';

// Compact building blocks shared by every role panel. They only use shared design tokens.

export function Row({ title, meta, aside, tone }) {
  return (
    <div className={`rd-row${tone ? ` tone-${tone}` : ''}`}>
      <div className="rd-row-main">
        <strong>{title}</strong>
        {meta ? <span>{meta}</span> : null}
      </div>
      {aside ? <div className="rd-aside">{aside}</div> : null}
    </div>
  );
}

export function Pill({ tone = 'info', children }) {
  return <span className={`rd-pill ${tone}`}>{children}</span>;
}

export function Empty({ children }) {
  return <p className="rd-empty">{children}</p>;
}

/** Marks content that comes from the demo workflow template, not from project records. */
export function DemoTag() {
  const { t } = useApp();
  return <span className="rd-demo-tag" title={t('demo.workflowHint')}>{t('demo.workflowTag')}</span>;
}

export function OpenButton({ onClick, label }) {
  const { t } = useApp();
  return <button type="button" className="rd-button ghost" onClick={onClick}>{label ?? t('action.open')}</button>;
}

/** Transient confirmation line (role="status") for actions taken inside a panel. */
export function useNotice() {
  const [notice, setNotice] = useState('');
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const announce = useCallback((message) => {
    setNotice(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(''), 3200);
  }, []);
  return [notice, announce];
}

export function Notice({ children }) {
  return children ? <p className="rd-notice" role="status">{children}</p> : null;
}

export const STATUS_TONE = { onTrack: 'success', atRisk: 'warning', delayed: 'danger', completed: 'neutral' };
export const SEVERITY_TONE = { critical: 'danger', high: 'warning', medium: 'info', low: 'neutral' };
