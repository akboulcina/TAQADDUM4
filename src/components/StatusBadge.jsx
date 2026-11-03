const statusStyles = {
  onTrack: { className: 'status success', dot: '#12805C' },
  atRisk: { className: 'status warning', dot: '#D97706' },
  delayed: { className: 'status danger', dot: '#B42318' },
  completed: { className: 'status neutral', dot: '#4B5565' }
};

export default function StatusBadge({ status, label }) {
  const style = statusStyles[status] ?? statusStyles.onTrack;
  return <span className={style.className}><span className="status-dot" style={{ background: style.dot }} />{label}</span>;
}
