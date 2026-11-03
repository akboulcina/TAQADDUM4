import { downloadCsv, kpiRowsToCsv } from './kpiIntelligence.js';
import './KpiIntelligence.css';

export default function AuthorizedCsvExportButton({ filename = 'taqaddum-kpi.csv', rows = [], formatValue }) {
  const exportCsv = () => downloadCsv(filename, kpiRowsToCsv(rows, formatValue));
  return (
    <button
      type="button"
      className="kpr-link kpi-export-button"
      onClick={exportCsv}
      disabled={!rows.length}
    >
      Exporter CSV ({rows.length})
    </button>
  );
}
