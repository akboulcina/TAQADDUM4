import { useApp } from '../context/AppContext.jsx';
import PageHeader from './PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function ModulePlaceholder({ route, contract }) {
  const { t } = useApp();
  return (
    <>
      <PageHeader title={t(route.labelKey)} description={t('placeholder.description')} />
      <section className="card"><div className="card-body"><EmptyState title={t('placeholder.title')} description={`${t('placeholder.contract')} : ${contract}`} /></div></section>
    </>
  );
}
