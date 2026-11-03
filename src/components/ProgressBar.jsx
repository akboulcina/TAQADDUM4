// Accepts a tone name or a project status (onTrack / atRisk / delayed / completed).
const TONE_BY_STATUS = { onTrack: 'success', atRisk: 'warning', delayed: 'danger', completed: '' };

export default function ProgressBar({ value, tone = 'brand' }) {
  const safeValue = Math.max(0, Math.min(100, value));
  const className = tone in TONE_BY_STATUS ? TONE_BY_STATUS[tone] : tone;
  return (
    <div className="progress-track" role="progressbar" aria-valuenow={safeValue} aria-valuemin="0" aria-valuemax="100">
      <div className={`progress-fill ${className}`} style={{ width: `${safeValue}%` }} />
    </div>
  );
}
