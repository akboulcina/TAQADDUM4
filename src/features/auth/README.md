# Connexion de démonstration

> **Ce n’est pas une authentification sécurisée.** Ce module sert uniquement à entrer dans le prototype sous l’un des six profils de démonstration existants (`src/data/users.js`).

## Comportement

- L’utilisateur saisit un nom, choisit un profil et saisit un mot de passe.
- **Tout mot de passe non vide est accepté.** Il n’est vérifié par rien, n’est transmis nulle part, n’est jamais stocké et n’est jamais passé à `AppContext`.
- Le profil choisi devient l’utilisateur actif (`useApp().user`) : ses données et son rôle sont ceux de `src/data/users.js`.
- Le nom saisi est conservé dans la session (`useApp().session.displayName`) et affiché dans le menu utilisateur (« Connecté en tant que »). Il ne remplace pas le nom du profil.
- Aucune inscription, aucun backend, aucune bibliothèque d’authentification.

## Session

L’état vit dans `AppContext` : `session`, `isAuthenticated`, `login(name, personaId)`, `logout()`.

La session est conservée dans `sessionStorage` (clé `taqaddum.demoSession.v1`, effacée à la fermeture de l’onglet) pour survivre à un rechargement. Elle contient uniquement `{ userId, displayName }`. Un identifiant de profil inconnu est ignoré : l’application ne retombe jamais sur un profil par défaut.

`App.jsx` n’affiche les routes protégées que si `isAuthenticated` est vrai ; la déconnexion les démonte (la navigation et l’état des modules sont donc réinitialisés).

## i18n

Clés `auth.*` dans `src/data/i18n.js` (FR, AR, EN). Les messages d’erreur sont stockés sous forme de clés, ils suivent donc un changement de langue.
