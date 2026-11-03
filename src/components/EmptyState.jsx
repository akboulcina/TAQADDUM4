export default function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 7h16M4 12h10M4 17h7" strokeLinecap="round" /></svg>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
