# TAQADDUM — Release 0

Prototype frontend de démonstration pour le pilotage stratégique d’un portefeuille de projets publics.

> **Avertissement** : cette application est un prototype. Les projets, budgets, indicateurs, alertes et conversations sont des données de démonstration déterministes. Ils ne représentent pas des données réelles du CNED.

## Stack

- React 18
- Vite 5
- JavaScript
- CSS personnalisé, sans Tailwind
- Aucun backend, base de données, API ou authentification réelle

## Commandes

```bash
npm install
npm run dev
npm run build
npm run preview
npm run test:roles   # vérifie le modèle de rôles et les traductions (Node, sans dépendance)
npm run test:kpi     # vérifie le moteur des 43 KPI (voir src/kpi/README.md)
```

## Fonctionnalités Release 0

- Shell applicatif de niveau entreprise
- Navigation fonctionnelle entre les modules
- Connexion de démonstration (nom, profil, mot de passe quelconque) — **non sécurisée**, voir `src/features/auth/README.md`
- Sélecteur de six personas de démonstration, **chacun avec son tableau de bord, sa navigation, son périmètre de projets et ses droits d’action** (voir `src/roles/README.md`)
- Interface en français, arabe (RTL) et anglais
- Jetons de design partagés
- Tableaux de bord par rôle (Direction Générale, PMO, Maître d’Ouvrage, Chef de Projet, Financier, Territorial), KPI dérivés des données
- Données locales déterministes
- Points d’intégration isolés pour les modules à venir

## Architecture

```text
src/
├─ app/                 Shell, navigation, en-tête, routes
├─ context/             État global de démonstration, état partagé des actions et i18n
├─ roles/               Modèle de rôles : configuration, accès, sélecteurs (voir son README)
├─ data/                Contrat de données mock partagées
├─ components/          Composants UI réutilisables
├─ styles/              Design tokens et styles globaux
└─ features/            Modules isolés
```

## Contrats d’intégration

Les dossiers suivants sont réservés aux contributeurs des modules indépendants :

- `src/features/portfolio`
- `src/features/map`
- `src/features/kpi`
- `src/features/alerts`
- `src/features/collaboration`
- `src/features/project-details`
- `src/features/role-dashboards`

Chaque dossier contient un `README.md` décrivant le contrat attendu. Les contributeurs ne doivent pas modifier `src/app`, `src/context`, `src/styles` ou `src/data` sans coordination.

## Rôles et restrictions

Les rôles sont définis à un seul endroit (`src/roles/roleConfig.js`) : page d’accueil, menu, périmètre de projets,
droits d’action, vue des alertes et composition du tableau de bord.

> **Ces restrictions sont un comportement de démonstration exécuté dans le navigateur.** Elles peuvent être
> contournées et ne protègent rien. En production, l’accès aux routes, le périmètre de projets et chaque droit
> d’écriture doivent être appliqués par un backend.

## Moteur et catalogue des 43 KPI

`src/kpi` contient le registre des 43 KPI (généré depuis le classeur de référence), le moteur de calcul pur, l'évaluateur de seuils, la validation des données et le modèle de confiance. Le catalogue (`features/kpi`) et le panneau « Référentiel des 43 KPI » des tableaux de bord DG, PMO et Finance lisent le même rapport. Voir `src/kpi/README.md` pour les indicateurs non ou partiellement pris en charge.
