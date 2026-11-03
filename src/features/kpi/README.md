# KPI & Performance module

```js
import { KpiModule } from './features/kpi/KpiModule.jsx';
```

Props: `projects`, `kpis`, `user`.

Deux onglets :

1. **Catalogue des 43 KPI** (par défaut) — `KpiCatalogue.jsx` + `KpiDetail.jsx`. Lit le rapport du moteur `src/kpi`
   (`useKpiReport`) calculé sur les projets du **périmètre du profil connecté**. Recherche et filtres : code, famille, importance,
   phase, état du calcul, sens, niveau, « mes KPI » (profils DG, PMO, MO, Finance uniquement ; Chef de projet et Territorial n'ont
   pas d'équivalent dans la matrice de rôles du classeur). Bascule portefeuille / projet. Fiche détaillée : définition, formule,
   valeur (seulement si calculable), unité, seuils, statut, état et confiance, tables sources, responsables, champs manquants,
   méthode d'agrégation, droits R/S/V par rôle, règles d'alerte liées, date de mise à jour.
2. **Aperçu des données de démonstration** — l'ancien module (`KpiDemoOverview.jsx`), conservé. Il trace des champs bruts
   (statut, secteur, wilaya) : ce **ne sont pas** des KPI du référentiel.

Noms, définitions, formules et textes de seuils sont ceux du classeur (français, balisés `lang="fr"`) ; l'interface est en FR/EN/AR (clés `kpr.*`, `src/data/i18n.kpi.js`).
Toutes les valeurs proviennent de données de démonstration et ne doivent pas être présentées comme des statistiques officielles du CNED.
