import { useApp } from '../context/AppContext.jsx';
import { getRoute, getIconPath } from './routes.jsx';

// The sidebar is rendered from the persona's role config (src/roles/roleConfig.js).
// Hiding an entry here is a convenience; the route guard in AppShell is what refuses access.
export default function Sidebar({ activeRoute, onNavigate, badges }) {
  const { t, lang, user, access } = useApp();
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">T</div>
        <div className="brand-text">
          <div className="brand-name">{t('app.name')}</div>
          <div className="brand-subtitle">{t('app.tagline')}</div>
        </div>
      </div>
      <div className="sidebar-role" title={`${user.role[lang]} — ${user.name}`}>
        <span className="sidebar-role-dot" style={{ background: user.color }} aria-hidden="true" />
        <span className="sidebar-role-text"><strong>{user.role[lang]}</strong><small>{t(`access.level.${access.accessLevel}`)}</small></span>
      </div>
      <nav aria-label={t('app.name')}>
        {access.navigation.map((section) => (
          <div key={section.sectionKey}>
            <p className="nav-section-label">{t(section.sectionKey)}</p>
            {section.items.map((item) => {
              const route = getRoute(item.route);
              const count = item.badge ? badges?.[item.badge] ?? 0 : 0;
              const label = t(item.labelKey ?? route.labelKey);
              return (
                <button key={item.route} type="button" className={`nav-item ${activeRoute === item.route ? 'active' : ''}`} onClick={() => onNavigate(item.route)} aria-current={activeRoute === item.route ? 'page' : undefined} title={label}>
                  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={getIconPath(route.icon)} /></svg>
                  <span className="nav-label">{label}</span>
                  {count > 0 ? <span className="nav-badge" aria-label={`${count}`}>{count}</span> : null}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer"><div className="demo-note"><strong>{t('app.demo')}</strong><br />{t('footer.demo')}</div></div>
    </aside>
  );
}
