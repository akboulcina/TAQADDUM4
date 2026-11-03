export default function BrandLogo({ compact = false, className = '' }) {
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: compact ? 8 : 10 }} aria-label="TAQADDUM">
      <svg width="28" height="28" viewBox="0 0 28 28" role="img" aria-hidden="true">
        <rect width="28" height="28" rx="7" fill="#2F80ED" />
        <path d="M7 9h14M14 9v11" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      {!compact && (
        <span style={{ fontWeight: 700, letterSpacing: '.04em', color: 'inherit' }}>TAQADDUM</span>
      )}
    </span>
  );
}
