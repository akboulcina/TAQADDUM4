// `delta` is optional: role dashboards show a derived `note` (and a `tone`) instead of a hard-coded trend.
export default function MetricCard({ label, value, delta, positive = true, note, tone }) {
  return (
    <article className={`card metric-card${tone ? ` tone-${tone}` : ''}`}>
      <p className="metric-label">{label}</p>
      <div className="metric-value-row">
        <span className="metric-value">{value}</span>
        {delta ? <span className={`metric-delta ${positive ? 'positive' : 'negative'}`}>{delta}</span> : null}
      </div>
      {note ? <p className="metric-note">{note}</p> : null}
    </article>
  );
}
