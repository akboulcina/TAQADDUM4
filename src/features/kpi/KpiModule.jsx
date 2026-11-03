import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import PageHeader from '../../app/PageHeader.jsx';
import { getToday } from '../../roles/portfolio.js';
import { useKpiReport } from '../../kpi/useKpiReport.js';
import { getDecisions } from '../../roles/roleReference.js';
import KpiCatalogue from './KpiCatalogue.jsx';
import { KpiDemoOverview } from './KpiDemoOverview.jsx';

/*
 * KPI screen. The catalogue of the 43 KPIs of the referentiel is the main view
 * and the only place where referentiel KPIs are computed (src/kpi). The former
 * overview is kept as a second tab: it plots raw demo fields (status, sector,
 * wilaya) and is not a KPI of the referentiel.
 */
export function KpiModule({ projects = [], kpis = [], user, selectedKpiId = null, financial = true }) {
  const { t, access } = useApp();
  const noRights = access.reference.kpi.visible.length === 0;
  const [tab, setTab] = useState('catalogue');
  const today = useMemo(() => getToday(), []);
  const report = useKpiReport(projects, today);

  return (
    <section className="kpr-module" aria-label={t('kpr.title')}>
      <PageHeader title={t('kpr.title')} description={t('kpr.subtitle')} actions={<span className="kpr-demo-badge">{t('kpr.demoBadge')}</span>} />
      <div className="kpr-tabs" role="tablist" aria-label={t('kpr.title')}>
        {['catalogue', 'overview'].map((id) => (
          <button key={id} type="button" role="tab" id={`kpr-tab-${id}`} aria-selected={tab === id} aria-controls={`kpr-panel-${id}`} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{t(`kpr.tab.${id}`)}</button>
        ))}
      </div>
      <div role="tabpanel" id={`kpr-panel-${tab}`} aria-labelledby={`kpr-tab-${tab}`}>
        {tab === 'catalogue' && noRights ? (
          <div className="kpr-banner kpr-banner-prov" role="note">
            <strong>{t('kpr.noRights.title')}</strong>
            <p>{t('kpr.noRights.body')}</p>
            <small lang="fr">{getDecisions(['D-03', 'D-04']).map((decision) => `${decision.id} · ${decision.subject}`).join(' — ')}</small>
          </div>
        ) : tab === 'catalogue' ? <KpiCatalogue report={report} projects={projects} initialSelectedId={selectedKpiId} /> : (
          <>
            <p className="kpr-banner">{t('kpr.tab.overviewNote')}</p>
            <KpiDemoOverview projects={projects} kpis={kpis} user={user} financial={financial} />
          </>
        )}
      </div>
    </section>
  );
}

export default KpiModule;
