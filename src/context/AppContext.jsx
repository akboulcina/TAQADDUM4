import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { translations } from '../data/i18n.js';
import { demoUsers } from '../data/users.js';
import { createAccess } from '../roles/access.js';
import { createFormatters } from '../roles/format.js';

const AppContext = createContext(null);

/*
 * DEMO-ONLY SESSION — THIS IS NOT SECURE AUTHENTICATION.
 *
 * TAQADDUM is a frontend-only prototype. "Signing in" simply selects one of the
 * six existing demo personas (src/data/users.js). There is no server, no
 * credential check and no token: any non-empty password is accepted by the
 * login form, and the password is never passed to this context nor stored.
 *
 * To avoid logging the presenter out on every page reload, the session is kept
 * in sessionStorage (cleared when the tab closes). It holds only the persona id
 * and the name typed on the login form, never a password. Anyone with access to
 * the browser can edit it, which is acceptable only because the data is fictional.
 */
const SESSION_STORAGE_KEY = 'taqaddum.demoSession.v1';
const MAX_DISPLAY_NAME_LENGTH = 80;

function readStoredSession() {
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // A stored persona id that no longer exists is treated as "no session";
    // we never fall back to a default persona.
    if (!parsed || !demoUsers.some((item) => item.id === parsed.userId)) return null;
    const displayName = typeof parsed.displayName === 'string' ? parsed.displayName.slice(0, MAX_DISPLAY_NAME_LENGTH) : '';
    return { userId: parsed.userId, displayName };
  } catch {
    return null; // storage unavailable or corrupted: start logged out
  }
}

function writeStoredSession(session) {
  try {
    if (session) window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    else window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    /* storage unavailable: the in-memory session still works for this page load */
  }
}

export function AppProvider({ children }) {
  const [lang, setLang] = useState('fr');
  // session = { userId, displayName } when signed in, otherwise null.
  const [session, setSession] = useState(readStoredSession);
  const user = session ? demoUsers.find((item) => item.id === session.userId) ?? null : null;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  /**
   * Demo sign-in. Receives only the typed name and the chosen persona id —
   * deliberately NOT the password, so it cannot be stored or leaked from here.
   * Returns true when a session was started.
   */
  const login = useCallback((displayName, personaId) => {
    const name = String(displayName ?? '').trim().slice(0, MAX_DISPLAY_NAME_LENGTH);
    if (!name || !demoUsers.some((item) => item.id === personaId)) return false;
    const next = { userId: personaId, displayName: name };
    writeStoredSession(next);
    setSession(next);
    return true;
  }, []);

  const logout = useCallback(() => {
    writeStoredSession(null);
    setSession(null);
  }, []);

  // Kept for the existing top-bar persona switcher; only acts while signed in.
  const setUser = useCallback((personaId) => {
    if (!session || !demoUsers.some((item) => item.id === personaId)) return;
    const next = { ...session, userId: personaId };
    writeStoredSession(next);
    setSession(next);
  }, [session]);

  // Role model for the active persona (see src/roles). Recomputed only when the persona changes.
  const access = useMemo(() => createAccess(user), [user]);

  const value = useMemo(() => {
    // t(key) or t(key, { name: value }) — `{name}` placeholders are interpolated.
    const t = (key, params) => {
      const text = translations[lang]?.[key] ?? translations.fr[key] ?? key;
      return params ? text.replace(/\{(\w+)\}/g, (match, name) => (params[name] != null ? String(params[name]) : match)) : text;
    };
    const fmt = createFormatters(lang);
    return { lang, setLang, dir, user, session, isAuthenticated: Boolean(user), login, logout, setUser, users: demoUsers, t, fmt, formatDZD: fmt.dzd, access };
  }, [lang, user, session, login, logout, setUser, access]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
