# Moteur de calcul des 43 KPI (`src/kpi`)

Source de vérité : le classeur `TAQADDUM_43_KPI_Referentiel_1.xlsx` (SHA-256 dans `referentiel.data.js › meta`).
Identifiants, noms, définitions, formules, unités, sens, seuils, importance, phase, sources, responsables et fréquences
sont copiés tels quels. Rien n'est réécrit à la main : `referentiel.data.js` est **généré**.

```bash
python3 -I scripts/kpi/export-referentiel.py <classeur.xlsx> src/kpi/referentiel.data.js
npm run test:kpi     # 129 vérifications, Node sans dépendance
```

## Architecture (un seul système, pas de doublon)

| Fichier | Rôle |
|---|---|
| `referentiel.data.js` → `registry.js` | Registre gelé des 43 KPI, règles d'alerte, rôles ; `assertRegistry()` refuse tout ≠ 43 identifiants uniques |
| `constants.js` | États de calcul, statuts, sens, niveaux, méthodes d'agrégation |
| `primitives.js` | Dates, médiane (jamais une moyenne), rapports **non plafonnés**, moyenne pondérée, durées fusionnées |
| `thresholds.js` | Évaluateur Vert / Orange / Rouge / Information / Non évaluable, selon le sens ; règles spéciales QR5, QR6, QR8 ; seuils configurables (`overrides`) jamais modifiés en silence |
| `sourceSchema.js`, `validation.js` | Champs sources attendus ; contrôles (TAP > 100 %, paiements > engagements, dates incohérentes, durées négatives, identifiants en double ou absents, montants initiaux/actuels absents…) |
| `calculators.js`, `calculators.field.js`, `classifiers.js`, `strategic.js` | Formule de chaque KPI au niveau projet / classification portefeuille / scores stratégiques |
| `aggregate.js` | Agrégation au portefeuille, méthode documentée par KPI (`AGGREGATION_DOC`) |
| `engine.js` | `calculateKpis(projets, { referenceDate })` — pur, déterministe ; DO1→DO2→DO3 ne lisent que dates, champs et contrôles (aucune dépendance circulaire) |
| `adapters/demoProjects.js` | Seul pont avec les données de démonstration (budget, engagé, payé, avancement, échéance) |
| `catalogue.js`, `useKpiReport.js` | Modèle de vue pur (filtres, formatage) et hook React — le catalogue et le panneau de tableau de bord lisent **le même rapport** |

## États de calcul

`calculated` · `partial` · `missing_data` · `not_applicable` · `not_implemented` · `requires_validation`.
Une valeur absente n'est jamais affichée comme 0 ; l'état liste les champs manquants et le responsable de la donnée.
Chaque résultat porte aussi sa confiance (high / medium / low / none), sa maturité (operational, limited, to_validate,
unavailable, v2_preview, v2_pending, vision_preview, vision_pending, not_implemented), sa phase et son importance.
Les KPI V2 et Vision ne sont jamais présentés comme opérationnels.

## Agrégation portefeuille

Les méthodes réellement utilisées (table `KPI_ENGINE_META`, vérifiée par les tests) :

| Méthode | KPI |
|---|---|
| Rapport des sommes (jamais une moyenne de rapports, jamais plafonné) | AV4, AV5, FI2, FI3, FI4, FI7, BU1, BU3, QR1, QR2, QR4, DO2, PP1, GV1, GV4 |
| Moyenne pondérée par l'AE actuelle | AV1, AV2, FI1 |
| Médiane des éléments regroupés (jamais médiane de médianes) | FI6, QR3 |
| Médiane des valeurs par projet (précisé par le classeur) | DL3 |
| Plus ancien élément du périmètre | FI5, QR7, GV2 |
| Pire marché ou contractant (aucune moyenne entre marchés) | BU2, CO2 |
| Somme des comptages | QR5, QR8, PP3 |
| Proportion de projets actifs | CO3, CO4, CO5, GV3 |
| Proportion de tous les projets | DO3 |
| Répartition par statut (une moyenne mélangerait des valeurs incomparables) | AV3, DL1, DL2, DL4, QR6, DO1, PP2 |
| Non agrégé tant que la méthode n'est pas validée | CO1, CO6 |

Les projets sans données sont exclus **et listés** ; un projet « sans objet » sort du dénominateur ; rien n'est compté deux fois.

## Ce qui n'est pas (ou pas entièrement) pris en charge

**Non implémentés** — le classeur donne les pondérations mais pas la normalisation de chaque composante en note 0–100 ; calculer
un score reviendrait à l'inventer :
- **CO1** (Santé du contractant) et **CO6** (Score de santé du portefeuille). Pondérations provisoires du classeur conservées dans `config.js`,
  `validated: false`. Si des normalisations sont injectées, le résultat reste `requires_validation` tant que `validated` est faux.

**À valider (méthode)** :
- **DO2** (Complétude) : la liste des champs obligatoires n'est pas définie par le classeur ; la liste utilisée est une proposition (`config.requiredFields`, `requiredFieldsValidated: false`).

**Partiels par conception** (`Partiel*` dans 05_Synthese — 16) : AV1, AV4, AV5, FI5, BU2, QR1, QR2, QR4, QR5, CO1, CO2, CO3, CO5, CO6, GV2, GV4.
Précisions de l'implémentation :
- **AV1** : approximé par le TAP consolidé si la valeur des travaux réalisés et le coût total estimé manquent (état `partial`).
- **FI1** : l'écart exact exige le taux financier hors avances ; sinon approximation paiements ÷ AE (état `partial`, signalée).
- **FI4** : AE initiale + ajustement ; sans ajustement renseigné, l'ajustement est supposé nul (`partial`).
- **DL4** : formule appliquée telle qu'écrite, contraintes (blocages) non modélisées (`partial`).
- **CO2** : groupements non modélisés (`partial`).
- **Seuils** : tous provisoires (« propositions TAQADDUM, non validées CNED »), configurables.
- **Règles d'alerte** (17) : décrites et reliées aux KPI, mais pas évaluées par la plateforme.

**Données de démonstration** : seuls budget, engagé, payé, avancement, statut et échéance existent. Résultat honnête au 2026-11-01 :
2 calculés (DL3, DO3), 2 partiels (AV1, FI1), 1 à valider (DO2), 2 non implémentés (CO1, CO6), 36 `missing_data`.
Le catalogue indique pour chacun les champs à fournir et le responsable de la donnée.

## Tests

`scripts/verify-kpi.mjs` — les attendus sont dérivés à la main des formules du classeur et des fixtures (`fixtures.js` :
projet normal, en retard, achevé, finances manquantes, dates incohérentes, dénominateurs nuls, portefeuille de 6 projets).
Un dernier contrôle exige que les **43 KPI** aient chacun une valeur ou un état asserté.
