import { useApp } from '../context/AppContext.jsx';
import PageHeader from './PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';

// Shown when the active persona opens a route its role does not allow.
export default function AccessRestricted({ onBack }) {
  const { t } = useApp();
  return (
    <>
      <PageHeader title={t('access.restricted.title')} />
      <section className="card">
        <div className="card-body">
          <EmptyState title={t('access.restricted.heading')} description={`${t('access.restricted.description')} ${t('roles.demoNotice')}`} />
          <p style={{ textAlign: 'center', margin: '0 0 8px' }}><button type="button" className="button primary" onClick={onBack}>{t('access.restricted.back')}</button></p>
        </div>
      </section>
    </>
  );
}
