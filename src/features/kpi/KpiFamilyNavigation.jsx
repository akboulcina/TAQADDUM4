import { FAMILIES } from '../../kpi/registry.js';
import { familySummaries } from './kpiIntelligence.js';
import './KpiIntelligence.css';

export default function KpiFamilyNavigation({ rows = [], activeFamily = '', onSelectFamily }) {
  const families = familySummaries(rows);
  return (
    <nav className="kpi-family-nav" aria-label="Navigation par famille de KPI">
      <button
        type="button"
        className={`kpi-family-chip${activeFamily === '' ? ' active' : ''}`}
        aria-pressed={activeFamily === ''}
        onClick={() => onSelectFamily?.('')}
      >
        <strong>Toutes</strong>
        <span>{rows.length} KPI</span>
      </button>
      {families.map((family) => (
        <button
          key={family.code}
          type="button"
          className={`kpi-family-chip${activeFamily === family.code ? ' active' : ''}`}
          aria-pressed={activeFamily === family.code}
          onClick={() => onSelectFamily?.(family.code)}
        >
          <strong>{family.code} · {family.label}</strong>
          <span>{family.available} disponibles · {family.partial} partiels · {family.unevaluable} non évaluables</span>
        </button>
      ))}
    </nav>
  );
}
