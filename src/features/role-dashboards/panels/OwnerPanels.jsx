import { useApp } from '../../../context/AppContext.jsx';
import { useDemoState } from '../../../context/DemoStateContext.jsx';
import ChartCard from '../../../components/ChartCard.jsx';
import { daysUntil } from '../../../roles/portfolio.js';
import { DemoTag, Empty, Notice, OpenButton, Pill, Row, useNotice } from './ui.jsx';

/** Maître d’Ouvrage: items submitted by project managers and waiting for validation. */
export function ValidationsPanel({ scope, nav }) {
  const { t, access } = useApp();
  const { advanceWorkflowItem } = useDemoState();
  const [notice, announce] = useNotice();
  const rows = scope.workflow.toValidate;

  const validate = (entry) => {
    const result = advanceWorkflowItem(entry.projectId, entry.kind, entry.item.id);
    announce(result.ok ? t('notice.validated', { item: entry.item.title }) : t('notice.forbidden'));
  };

  return (
    <ChartCard title={t('panel.validations.title')} subtitle={t('panel.validations.subtitle')} action={<DemoTag />}>
      <Notice>{notice}</Notice>
      {rows.length === 0 ? <Empty>{t('panel.validations.empty')}</Empty> : (
        <div className="rd-list">
          {rows.map((entry) => {
            const allowed = access.canActOnProject('project.validate', entry.project);
            return (
              <Row
                key={entry.key}
                title={entry.item.title}
                meta={`${entry.project.name} · ${t(`kind.${entry.kind}`)}`}
                aside={<>
                  <button type="button" className="rd-button primary" disabled={!allowed} title={allowed ? undefined : t('hint.noPermission')} onClick={() => validate(entry)}>{t('action.validate')}</button>
                  <OpenButton onClick={() => nav.openProject(entry.projectId)} />
                </>}
              />
            );
          })}
        </div>
      )}
    </ChartCard>
  );
}

/** Contractual milestones: the due date of each active project in scope, soonest first. */
export function ContractualMilestonesPanel({ scope, nav }) {
  const { t, fmt } = useApp();
  const rows = [...scope.summary.active].filter((project) => project.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 6);
  return (
    <ChartCard title={t('panel.milestones.title')} subtitle={t('panel.milestones.subtitle')}>
      {rows.length === 0 ? <Empty>{t('panel.milestones.empty')}</Empty> : (
        <div className="rd-list">
          {rows.map((project) => {
            const days = daysUntil(project.dueDate, scope.today);
            const tone = days < 0 ? 'danger' : days <= 30 ? 'warning' : 'neutral';
            return (
              <Row
                key={project.id}
                title={project.name}
                meta={`${project.id} · ${fmt.date(project.dueDate)}`}
                aside={<><Pill tone={tone}>{days < 0 ? t('reason.lateBy', { n: -days }) : t('reason.dueIn', { n: days })}</Pill><OpenButton onClick={() => nav.openProject(project.id)} /></>}
              />
            );
          })}
        </div>
      )}
    </ChartCard>
  );
}
