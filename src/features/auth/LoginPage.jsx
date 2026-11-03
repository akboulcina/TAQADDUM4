import { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
//import { ALGERIA_OUTLINE, projectPoint } from '../map/mapGeometry.js';
import { ALGERIA_OUTLINE, mapMarkers } from './algeriaMap';
import './LoginPage.css';

/*
 * DEMO LOGIN — NOT SECURE AUTHENTICATION.
 *
 * This form exists only to let a presenter enter the prototype as one of the six
 * existing demo personas. Nothing is verified: any non-empty password is accepted,
 * and the password is read from the field, checked for emptiness and then dropped.
 * It is never sent anywhere, never stored and never passed to AppContext.
 * Do not reuse this pattern for real access control.
 */

const languages = [
  { id: 'fr', label: 'Français' },
  { id: 'ar', label: 'العربية' },
  { id: 'en', label: 'English' }
];

// Decorative markers on the brand panel: real wilaya coordinates (lon, lat), the same
// cities used by the dashboard's territorial data.
/* const mapMarkers = [
  [3.06, 36.75], [-0.64, 35.7], [2.83, 36.47], [5.41, 36.19],
  [6.61, 36.36], [7.77, 36.9], [6.17, 35.56], [5.73, 34.85]
].map(([longitude, latitude]) => projectPoint(longitude, latitude)); */

function EyeIcon({ off }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12s3.6-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.6 6.5-9.5 6.5S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off ? <path d="M4 4l16 16" /> : null}
    </svg>
  );
}

function ErrorMessage({ id, children }) {
  return (
    <p className="field-error" id={id}>
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" /></svg>
      <span>{children}</span>
    </p>
  );
}

export default function LoginPage() {
  const { t, lang, setLang, dir, users, login } = useApp();
  const [name, setName] = useState('');
  const [personaId, setPersonaId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Errors hold translation keys (not text) so messages follow a language change.
  const [errors, setErrors] = useState({});

  const nameRef = useRef(null);
  const personaGroupRef = useRef(null);
  const passwordRef = useRef(null);

  const selectedPersona = users.find((item) => item.id === personaId) ?? null;

  const clearError = (field) => setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!name.trim()) nextErrors.name = 'auth.error.name';
    if (!users.some((item) => item.id === personaId)) nextErrors.persona = 'auth.error.persona';
    // Demo rule: any non-empty password is accepted (see the notice at the top of this file).
    if (password.length === 0) nextErrors.password = 'auth.error.password';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      // Move focus to the first invalid control, in visual order.
      if (nextErrors.name) nameRef.current?.focus();
      else if (nextErrors.persona) personaGroupRef.current?.querySelector('input[type="radio"]')?.focus();
      else passwordRef.current?.focus();
      return;
    }

    setErrors({});
    // Only the name and the persona leave this component — never the password.
    login(name, personaId);
  };

  return (
    <div className="login-page" dir={dir} lang={lang}>
      <aside className="login-brand">
        <div className="login-lockup">
          <div className="brand-mark" aria-hidden="true">T</div>
          <div>
            <div className="login-lockup-name">{t('app.name')}</div>
            <div className="login-lockup-tagline">{t('app.tagline')}</div>
          </div>
        </div>

        <div className="login-pitch">
          <p className="login-headline">{t('auth.brand.headline')}</p>
          <p className="login-description">{t('auth.brand.description')}</p>
        </div>

<svg className="login-map" viewBox="-10 -10 920 550" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
  <path className="login-map-shape" d={ALGERIA_OUTLINE} />
  <path className="login-map-outline" d={ALGERIA_OUTLINE} pathLength="1" />
  {mapMarkers.map((point, index) => (
    <circle key={index} className="login-map-dot" style={{ '--i': index }} cx={point.x} cy={point.y} r="8" />
  ))}
</svg>

        <p className="login-brand-note">{t('footer.demo')}</p>
      </aside>

      <main className="login-main">
        <div className="login-toolbar">
          <div className="lang-switch" role="group" aria-label={t('topbar.language')}>
            {languages.map((language) => (
              <button
                key={language.id}
                type="button"
                lang={language.id}
                className={lang === language.id ? 'is-active' : ''}
                aria-pressed={lang === language.id}
                onClick={() => setLang(language.id)}
              >
                {language.label}
              </button>
            ))}
          </div>
        </div>

        <div className="login-center">
          <section className="card login-card" aria-labelledby="login-title">
            <h1 id="login-title" className="login-title">{t('auth.title')}</h1>
            <p className="login-subtitle">{t('auth.subtitle')}</p>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label htmlFor="login-name">{t('auth.name.label')}</label>
                <input
                  id="login-name"
                  ref={nameRef}
                  type="text"
                  autoComplete="name"
                  placeholder={t('auth.name.placeholder')}
                  value={name}
                  maxLength={80}
                  aria-required="true"
                  aria-invalid={errors.name ? 'true' : undefined}
                  aria-describedby={errors.name ? 'login-name-error' : undefined}
                  onChange={(event) => { setName(event.target.value); clearError('name'); }}
                />
                {errors.name ? <ErrorMessage id="login-name-error">{t(errors.name)}</ErrorMessage> : null}
              </div>

              <div className="field">
                <span className="field-label" id="login-persona-label">{t('auth.persona.label')}</span>
                <div
                  className="persona-grid"
                  role="radiogroup"
                  ref={personaGroupRef}
                  aria-labelledby="login-persona-label"
                  aria-required="true"
                  aria-invalid={errors.persona ? 'true' : undefined}
                  aria-describedby={errors.persona ? 'login-persona-error' : 'login-persona-hint'}
                >
                  {users.map((demoUser) => (
                    <label key={demoUser.id} className="persona-option">
                      <input
                        className="persona-input"
                        type="radio"
                        name="login-persona"
                        value={demoUser.id}
                        checked={personaId === demoUser.id}
                        onChange={() => { setPersonaId(demoUser.id); clearError('persona'); }}
                      />
                      <span className="persona-box">
                        <span className="persona-avatar" style={{ background: demoUser.color }} aria-hidden="true">{demoUser.initials}</span>
                        <span className="persona-text">
                          <span className="persona-role">{demoUser.role[lang]}</span>
                          <span className="persona-name">{demoUser.name}</span>
                        </span>
                        <span className="persona-check" aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
                {errors.persona ? <ErrorMessage id="login-persona-error">{t(errors.persona)}</ErrorMessage> : null}
                <p className="field-hint persona-hint" id="login-persona-hint" aria-live="polite">
                  {selectedPersona ? `${selectedPersona.unit[lang]} — ${selectedPersona.focus[lang]}` : t('auth.persona.hint')}
                </p>
              </div>

              <div className="field">
                <label htmlFor="login-password">{t('auth.password.label')}</label>
                <div className="password-wrap">
                  <input
                    id="login-password"
                    ref={passwordRef}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="off"
                    value={password}
                    aria-required="true"
                    aria-invalid={errors.password ? 'true' : undefined}
                    aria-describedby={errors.password ? 'login-password-error login-password-note' : 'login-password-note'}
                    onChange={(event) => { setPassword(event.target.value); clearError('password'); }}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showPassword ? t('auth.password.hide') : t('auth.password.show')}
                    title={showPassword ? t('auth.password.hide') : t('auth.password.show')}
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    <EyeIcon off={showPassword} />
                  </button>
                </div>
                {errors.password ? <ErrorMessage id="login-password-error">{t(errors.password)}</ErrorMessage> : null}
                <p className="field-hint" id="login-password-note">{t('auth.password.demoNote')}</p>
              </div>

              {/* No loading state: sign-in is a synchronous, local operation. */}
              <button type="submit" className="button primary login-submit">{t('auth.submit')}</button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
