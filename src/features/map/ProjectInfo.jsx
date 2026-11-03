import { useApp } from '../../context/AppContext.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import ProgressBar from '../../components/ProgressBar.jsx';

/*
 * Project facts shown in the map popup and in the side panel. Every field is optional:
 * a missing value is written as "Non renseigné" instead of an empty cell or "undefined".
 */
export default function ProjectInfo({ project, t, fmt, wilayaName, compact = false }) {
  const { access } = useApp();
  const missing = t('map.field.missing');
  const text = (value) => (value == null || value === '' ? missing : value);
  const precision = project.location?.precision;

  return (
    <div className={`apm-info${compact ? ' is-compact' : ''}`}>
      <p className="apm-info-code">{project.id}</p>
      <h3 className="apm-info-name">{text(project.name)}</h3>
      {project.status ? <StatusBadge status={project.status} label={t(`status.${project.status}`)} /> : <span className="apm-info-missing">{missing}</span>}
      <dl className="apm-info-grid">
        <div><dt>{t('table.wilaya')}</dt><dd>{text(wilayaName)}</dd></div>
        <div><dt>{t('table.sector')}</dt><dd>{text(project.sector)}</dd></div>
        <div className="is-wide">
          <dt>{t('table.progress')}</dt>
          <dd>
            {project.progress == null ? missing : (
              <span className="apm-info-progress"><ProgressBar value={project.progress} tone={project.status ?? 'brand'} /><strong>{fmt.percent(project.progress)}</strong></span>
            )}
          </dd>
        </div>
        {access.canViewFinancials() ? <div><dt>{t('table.budget')}</dt><dd>{project.budget == null ? missing : fmt.dzd(project.budget)}</dd></div> : null}
        <div><dt>{t('table.due')}</dt><dd>{project.dueDate ? fmt.date(project.dueDate) : missing}</dd></div>
      </dl>
      {precision ? (
        <p className={`apm-info-precision is-${precision}`}>
          <strong>{t(`map.precision.short.${precision}`)}.</strong> {t(`map.precision.${precision}`)}
        </p>
      ) : (
        <p className="apm-info-precision is-none">{t(`map.issue.${project.locationIssue ?? 'missing'}`)}</p>
      )}
    </div>
  );
}
