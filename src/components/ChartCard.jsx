export default function ChartCard({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`card chart-card ${className}`}>
      <header className="card-header">
        <div>
          <h2 className="card-title">{title}</h2>
          {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <div className="card-body">{children}</div>
    </section>
  );
}
