import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

// Top-bar user menu: shows the active demo persona and offers "Sign out".
// Disclosure pattern: button[aria-expanded] + panel. Escape, outside click and
// moving focus away all close it.
export default function UserMenu() {
  const { t, lang, user, session, logout, access } = useApp();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const logoutRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    logoutRef.current?.focus();
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleBlur = (event) => {
    if (open && !rootRef.current?.contains(event.relatedTarget)) setOpen(false);
  };

  return (
    <div className="user-menu-wrap" ref={rootRef} onBlur={handleBlur}>
      <button
        type="button"
        ref={triggerRef}
        className="user-menu"
        aria-expanded={open}
        aria-controls="user-menu-panel"
        aria-label={`${t('auth.userMenu')} — ${user.name}`}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="avatar" style={{ background: user.color }}>{user.initials}</span>
        <span className="user-meta"><span className="user-name">{user.name}</span><br /><span className="user-role">{user.role[lang]}</span></span>
        <svg className="user-menu-caret" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open ? (
        <div className="user-menu-panel" id="user-menu-panel">
          <div className="user-menu-identity">
            <span className="avatar" style={{ background: user.color }} aria-hidden="true">{user.initials}</span>
            <div>
              <div className="user-name">{user.name}</div>
              <div className="user-role">{user.role[lang]}</div>
              {user.unit[lang] !== user.role[lang] ? <div className="user-role">{user.unit[lang]}</div> : null}
            </div>
          </div>
          {session?.displayName ? (
            <p className="user-menu-signed">{t('auth.signedInAs')} <strong>{session.displayName}</strong></p>
          ) : null}
          <p className="user-menu-signed">{t('access.label')} <strong>{t(`access.level.${access.accessLevel}`)}</strong></p>
          <p className="user-menu-note">{t('auth.demoSession')} {t('roles.demoNotice')}</p>
          <button type="button" ref={logoutRef} className="user-menu-logout" onClick={logout}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 4H5v16h4M15 8l4 4-4 4M19 12H9" /></svg>
            {t('auth.logout')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
