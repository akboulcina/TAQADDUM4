import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import PageHeader from '../../app/PageHeader.jsx';
import { getToday } from '../../roles/portfolio.js';
import { useKpiReport } from '../../kpi/useKpiReport.js';
import { getDecisions } from '../../roles/roleReference.js';
import { buildRows, restrictRows } from '../../kpi/catalogue.js';
import KpiCatalogue from './KpiCatalogue.jsx';
import { KpiDemoOverview } from './KpiDemoOverview.jsx';
import PortfolioIntelligence from './PortfolioIntelligence.jsx';
import './KpiIntelligence.css';

export function KpiModule({ projects = [], kpis = [], user, selectedKpiId = null, financial = true }) {
  const { t, access } = useApp();
  const noRights = access.reference.kpi.visible.length === 0;
  const [tab, setTab] = useState('catalogue');
  const today = useMemo(() => getToday(), []);
  const report = useKpiReport(projects, today);
  const rows = useMemo(() => restrictRows(buildRows(report, { scope: 'portfolio' }), access.canViewKpi), [report, access]);

  const tabLabel = (id) => id === 'intelligence' ? 'Intelligence' : t(`kpr.tab.${id}`);

  return (
    <section className="kpr-module" aria-label={t('kpr.title')}>
      <PageHeader title={t('kpr.title')} description={t('kpr.subtitle')} actions={<span className="kpr-demo-badge">{t('kpr.demoBadge')}</span>} />
      <div className="kpr-tabs" role="tablist" aria-label={t('kpr.title')}>
        {['catalogue', 'intelligence', 'overview'].map((id) => (
          <button key={id} type="button" role="tab" id={`kpr-tab-${id}`} aria-selected={tab === id} aria-controls={`kpr-panel-${id}`} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{tabLabel(id)}</button>
        ))}
      </div>
      <div role="tabpanel" id={`kpr-panel-${tab}`} aria-labelledby={`kpr-tab-${tab}`}>
        {tab === 'catalogue' && noRights ? (
          <div className="kpr-banner kpr-banner-prov" role="note">
            <strong>{t('kpr.noRights.title')}</strong>
            <p>{t('kpr.noRights.body')}</p>
            <small lang="fr">{getDecisions(['D-03', 'D-04']).map((decision) => `${decision.id} · ${decision.subject}`).join(' — ')}</small>
          </div>
        ) : tab === 'catalogue' ? <KpiCatalogue report={report} projects={projects} initialSelectedId={selectedKpiId} /> : tab === 'intelligence' ? (
          <PortfolioIntelligence report={report} rows={rows} canViewFinancials={access.canViewFinancials()} />
        ) : (
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
