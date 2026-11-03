# TAQADDUM — Phase 3: role-based KPI visibility, permissions and workspaces

> Généré par `node scripts/generate-role-docs.mjs` à partir du code (ne pas éditer à la main). Comportement de démonstration côté navigateur : **pas une frontière de sécurité**.

## 1. Role-to-reference mapping

| Persona | Rôle du classeur | Statut | Base / réserve | Décisions |
| --- | --- | --- | --- | --- |
| Amina Belkacem (`dg`, Direction Générale) | Direction CNED (décideur) | supported | Fonction « décideur » et périmètre « Portefeuille national » identiques ; la persona porte les arbitrages de portefeuille (focus de users.js). Libellé différent (« Direction CNED » / « Direction Générale ») : rapprochement par fonction et par périmètre, retenu depuis les phases 1 et 2. | D-06 |
| Yacine Hamdi (`pmo`, PMO Central) | CNED / PMO (analyste) | supported | Rôle « CNED / PMO » : coordination transverse et suivi de la performance sur le portefeuille national ; responsable de DO1 à DO3. | — |
| Nadia Cherif (`mo`, Maître d’Ouvrage) | Maître d’ouvrage (MO) | supported | Même rôle (Maître d’ouvrage) ; périmètre « Ses projets uniquement » = scope `assigned` (champ `manager`). | — |
| Sofiane Merabet (`pm`, Chef de Projet) | — aucun — | unresolved | Le classeur ne contient aucun rôle « chef de projet ». | D-03 |
| Karim Benali (`finance`, Responsable Financier) | Contrôleur budgétaire (Finance) | partial | Fonction financière (engagements, paiements) rapprochée de « Contrôleur budgétaire (Finance) » ; visibilité KPI et alertes appliquée telle que dans le classeur. Libellé différent (« Responsable Financier » / « Contrôleur budgétaire »). | D-05 |
| Lila Mansouri (`territorial`, Responsable Territorial) | — aucun — | unresolved | Le classeur ne contient aucun rôle territorial. | D-04, D-07 |

### Rôles du classeur sans persona

| Rôle | Statut | Raison | Décision |
| --- | --- | --- | --- |
| Bureau d’études (BET) / contrôle | missing | Aucune persona « Bureau d’études / contrôle » dans l’application. | D-01 |
| Contractant (entreprise) | missing | Aucune persona « Contractant » et aucune donnée d’appartenance projet → marché → entreprise pour limiter la vue à « ses propres marchés ». | D-02 |

### Équivalences volontairement refusées

| Persona | Rôle du classeur | Pourquoi pas |
| --- | --- | --- |
| `pm` | Contractant (entreprise) | Le chef de projet de la plateforme gère des projets assignés ; le contractant est l’entreprise titulaire d’un marché et ne voit que ses marchés. |
| `pm` | Bureau d’études (BET) / contrôle | Rien dans le classeur ni dans la persona n’indique une mission de contrôle technique. |
| `territorial` | Bureau d’études (BET) / contrôle | Le suivi géographique n’est pas un contrôle technique ou qualité. |
| `territorial` | Maître d’ouvrage (MO) | Le MO ne voit que ses projets ; le responsable territorial suit une répartition régionale. Les périmètres diffèrent. |
| `pm` | Maître d’ouvrage (MO) | Le MO valide ; le chef de projet exécute. Les droits d’action de roleConfig.js les séparent déjà. |

## 2. Decisions needed (unresolved)

| ID | Sujet | Question | Comportement actuel (défaut sûr) | Il faut |
| --- | --- | --- | --- | --- |
| D-01 | Bureau d’études (BET) / contrôle | Faut-il créer une persona BET, ou rattacher ce rôle à une persona existante ? | Aucune persona BET : ses droits (R, S, V et D/I) ne sont attribués à personne. 9 affectations d’alertes restent non servies. | Décision produit + périmètre « projets et marchés surveillés » (aucune donnée de contrôle dans le jeu actuel). |
| D-02 | Contractant (entreprise) | Faut-il créer une persona Contractant, et comment lui lier ses marchés ? | Aucune persona Contractant. Les règles « ses propres marchés / jamais les scores d’autres contractants » (CO1, FI6, FI7, QR7, QR8) ne peuvent pas être appliquées sans données marché → entreprise : aucun droit attribué. | Modèle de données projet → marché → entreprise ; décision d’authentification externe. |
| D-03 | Chef de Projet | À quel rôle du classeur correspond le chef de projet (MO délégué ? BET ? rôle nouveau à ajouter au référentiel) ? | Aucun KPI du référentiel visible, aucune alerte de règle (ni D ni I). Conservés : projets assignés, actions de démonstration (`project.update`, `project.note`, `alerts.acknowledge` historique) et indicateurs de tableau de bord hors référentiel. | Une ligne « chef de projet » dans 03_Matrice_Roles (R/S/V par KPI, D/I par règle). |
| D-04 | Responsable Territorial — rôle | Quels KPI et quelles alertes du référentiel le responsable territorial doit-il voir ? | Aucun KPI du référentiel visible, aucune alerte de règle. Conservés : carte, classement des wilayas et indicateurs territoriaux hors référentiel. | Une ligne « responsable territorial » dans 03_Matrice_Roles. |
| D-05 | Finance — périmètre budgétaire | Quel est le « périmètre budgétaire » du contrôleur budgétaire (programme, secteur, ligne budgétaire, wilaya…) ? | Périmètre `portfolio` conservé (comportement existant, demandé par la phase 3 : « préserver le périmètre projet existant »). Le classeur dit « projets de son périmètre budgétaire » : cette restriction n’est donc PAS encore appliquée. Une note l’indique sur le tableau de bord. | Un champ de rattachement budgétaire sur les projets (non présent dans projects.js) et son affectation à la persona. |
| D-06 | Direction — arbitrage des alertes ROUGE | La Direction doit-elle être destinataire (D) de certaines alertes rouges ? | La feuille 04_Vue_Role annonce « arbitrage des alertes ROUGE », mais 03_Matrice_Roles ne donne à la Direction que des « I » (informé). La matrice fait foi : la Direction voit les alertes rouges et n’agit sur aucune alerte de règle. | Arbitrage entre le texte de la vue et les codes de la matrice. |
| D-07 | Responsable Territorial — autorisation géographique | Sur quelles wilayas porte l’autorisation géographique de la persona ? | Périmètre `portfolio` conservé (comportement existant). Aucune affectation persona → wilayas n’existe dans les données : la restriction géographique n’est donc PAS encore appliquée. | Une liste de wilayas autorisées par persona. |
| D-08 | Montants financiers bruts pour Chef de Projet et Territorial | Ces personas peuvent-elles voir budget, engagements et paiements ? | Masqués (permission `finance.view` absente) : le classeur ne leur accorde aucun KPI financier et la règle phase 3 impose un défaut sûr. Les montants restent visibles pour Direction, PMO, MO et Finance. | Décision métier ; l’ajout de `finance.view` dans roleConfig.js suffit à les rétablir. |
| D-09 | Sens opérationnel de « S » et « R » | Existe-t-il une saisie de données par les rôles « S » ? | « S » = alimente la donnée et « R » = valide et rend compte, exprimés comme droits de lecture/étiquettes (canContributeKpi, canValidateKpi). Aucun écran de saisie n’existe : aucun droit d’écriture ni d’administration n’en découle. | Spécification des interfaces de saisie (I1–I7) et d’un backend. |

## 3. Exact KPI visibility mapping

R = responsable (valide et rend compte) · S = alimente · V = consulte · vide = non visible. Lu depuis `03_Matrice_Roles`, jamais ressaisi.

| KPI | Nom | `dg` | `pmo` | `mo` | `pm` | `finance` | `territorial` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AV1 | Avancement physique consolidé |  | S | R |  | V |  |
| AV2 | Indice d'avancement | V | R | V |  | V |  |
| AV3 | Cadence récente |  | V | R |  |  |  |
| AV4 | Part non contractualisée |  | V | R |  |  |  |
| AV5 | Mise en service fonctionnelle | V | R | S |  |  |  |
| FI1 | Écart physique–financier |  | V | R |  | S |  |
| FI2 | Couverture du reste à faire | V | V | R |  | S |  |
| FI3 | Couverture des crédits de paiement | V | V | V |  | R |  |
| FI4 | Dérive d'AE ajustée | V | V | V |  | R |  |
| FI5 | Réévaluations d'AE en attente | V | S | V |  | R |  |
| FI6 | Retard de paiement des situations |  | V | R |  | S |  |
| FI7 | Encours de situations |  | V | V |  | R |  |
| DL1 | Consommation du délai en vigueur |  | V | R |  | V |  |
| DL2 | Dérive de délai par avenants | V | R | V |  | V |  |
| DL3 | Dépassement de la date contractuelle | V | R | V |  | V |  |
| DL4 | Date d'achèvement prévisionnelle | V | V | R |  |  |  |
| BU1 | Poids financier des avenants | V | R | S |  | V |  |
| BU2 | Nombre d'avenants cumulés |  | V | R |  |  |  |
| BU3 | Coût final prévisionnel | V | V | R |  | V |  |
| QR1 | Taux de libération des emprises | V | V | R |  |  |  |
| QR2 | Interférences réseaux traitées |  | V | R |  |  |  |
| QR3 | Âge des blocages ouverts | V | R | V |  |  |  |
| QR4 | Temps perdu à l'arrêt | V | V | R |  |  |  |
| QR5 | Aléas non prévus ouverts |  | V | R |  |  |  |
| QR6 | Modification de consistance en cours |  | V | S |  |  |  |
| QR7 | Non-conformité critique la plus ancienne |  | V | V |  |  |  |
| QR8 | Incidents HSE graves |  | V | V |  |  |  |
| DO1 | Fraîcheur des données |  | R | V |  |  |  |
| DO2 | Complétude |  | R | V |  |  |  |
| DO3 | Cohérence |  | R | V |  |  |  |
| PP1 | Fiabilité du planning hebdomadaire |  | V | R |  |  |  |
| PP2 | Mobilisation effective |  | V | R |  |  |  |
| PP3 | Causes de non-réalisation externes |  | V | R |  |  |  |
| CO1 | Santé du contractant (0–100) | V | R | V |  |  |  |
| CO2 | Concentration par contractant | V | R |  |  |  |  |
| CO3 | Part en parachèvement après résiliation | V | R |  |  |  |  |
| CO4 | Projets en retard important | V | R | V |  | V |  |
| CO5 | Projets à l'arrêt | V | R | V |  | V |  |
| CO6 | Score de santé du portefeuille | V | R |  |  |  |  |
| GV1 | Blocages avec responsable et échéance |  | R | V |  |  |  |
| GV2 | Avenants en attente de visa (CSM) | V | R | S |  | V |  |
| GV3 | Arbitrages échus | V | R | V |  |  |  |
| GV4 | Réceptions en attente |  | V | R |  |  |  |

### Per persona

| Persona | Visibles | R (responsable) | S (alimente) | V (lecture seule) | Masqués | Familles visibles |
| --- | --- | --- | --- | --- | --- | --- |
| `dg` | 22 | — | — | AV2 AV5 FI2 FI3 FI4 FI5 DL2 DL3 DL4 BU1 BU3 QR1 QR3 QR4 CO1 CO2 CO3 CO4 CO5 CO6 GV2 GV3 | 21 | AV FI DL BU QR CO GV |
| `pmo` | 43 | AV2 AV5 DL2 DL3 BU1 QR3 DO1 DO2 DO3 CO1 CO2 CO3 CO4 CO5 CO6 GV1 GV2 GV3 | AV1 FI5 | AV3 AV4 FI1 FI2 FI3 FI4 FI6 FI7 DL1 DL4 BU2 BU3 QR1 QR2 QR4 QR5 QR6 QR7 QR8 PP1 PP2 PP3 GV4 | 0 | AV FI DL BU QR DO PP CO GV |
| `mo` | 40 | AV1 AV3 AV4 FI1 FI2 FI6 DL1 DL4 BU2 BU3 QR1 QR2 QR4 QR5 PP1 PP2 PP3 GV4 | AV5 BU1 QR6 GV2 | AV2 FI3 FI4 FI5 FI7 DL2 DL3 QR3 QR7 QR8 DO1 DO2 DO3 CO1 CO4 CO5 GV1 GV3 | 3 | AV FI DL BU QR DO PP CO GV |
| `pm` | 0 | — | — | — | 43 | — |
| `finance` | 17 | FI3 FI4 FI5 FI7 | FI1 FI2 FI6 | AV1 AV2 DL1 DL2 DL3 BU1 BU3 CO4 CO5 GV2 | 26 | AV FI DL BU CO GV |
| `territorial` | 0 | — | — | — | 43 | — |

## 4. Exact alert recipient mapping

D = doit agir · I = informé · vide = non destinataire.

| Règle | Nom | Niveau | Catégorie | `dg` | `pmo` | `mo` | `pm` | `finance` | `territorial` | BET | Contractant |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AL01 | Avant-coureur d'abandon | ROUGE | Contractuel | I | D | D |  |  |  |  |  |
| AL02 | Emprise bloquée critique | ROUGE | Terrain / qualité | I | D | D |  |  |  |  |  |
| AL03 | Étranglement financier | ROUGE | Financier | I | D | I |  | D |  |  |  |
| AL04 | Dégradation contractant | ORANGE | Contractuel |  | I | D |  |  |  |  |  |
| AL05 | Déblocage critique qui approche | ORANGE | Terrain / qualité |  | I | D |  |  |  |  |  |
| AL06 | Dérive de délai | ROUGE | Délais / avancement | I | D | D |  |  |  |  | I |
| AL07 | Sous-performance physique | ORANGE | Délais / avancement |  | I | D |  |  |  |  | D |
| AL08 | Dérive d'AE | ROUGE | Financier | I | I | D |  | D |  |  |  |
| AL09 | NC critique persistante | ROUGE | Terrain / qualité |  | I | D |  |  |  | D | I |
| AL10 | Responsable de blocage absent | ORANGE | Gouvernance |  | D | I |  |  |  |  |  |
| AL11 | Paiement anormalement lent | ROUGE | Financier |  | I | D |  | D |  |  | I |
| AL12 | Maturation critique | ORANGE | Terrain / qualité |  | I | D |  |  |  | D |  |
| AL13 | Dérive de délai extrême | ORANGE | Délais / avancement | I | D | I |  |  |  |  |  |
| AL14 | Avenant bloqué au visa | ORANGE | Gouvernance |  | D | D |  |  |  |  | I |
| AL15 | Arrêt prolongé | ROUGE | Terrain / qualité | I | D | D |  |  |  |  | I |
| AL16 | Données peu fiables | ORANGE | Qualité des données |  | D | I |  |  |  | I |  |
| AL17 | Blocage ancien | ORANGE | Gouvernance | I | D |  |  |  |  |  |  |

Les colonnes BET et Contractant ne sont servies à aucune persona (D-01, D-02).

## 5. Permissions

| Permission | `dg` | `pmo` | `mo` | `pm` | `finance` | `territorial` |
| --- | --- | --- | --- | --- | --- | --- |
| alerts.acknowledge | – | ✔ | ✔ | ✔ | ✔ | – |
| alerts.resolve | ✔ | ✔ | ✔ | – | – | – |
| alerts.dismiss | – | ✔ | – | – | – | – |
| project.update | – | – | – | ✔ | – | – |
| project.validate | – | – | ✔ | – | – | – |
| project.note | ✔ | ✔ | ✔ | ✔ | – | – |
| report.export | ✔ | ✔ | ✔ | – | ✔ | ✔ |
| finance.view | ✔ | ✔ | ✔ | – | ✔ | – |
| Agir sur une alerte de règle | – | ✔ (D : 10) | ✔ (D : 12) | – | ✔ (D : 3) | – |

- `canViewKpi` = R, S ou V ; `canContributeKpi` = S uniquement ; `canValidateKpi` = R uniquement. Aucun n’implique un droit d’écriture sur les projets (aucun écran de saisie n’existe, D-09).
- Une alerte n’est agissable que si la persona est **D**, détient la permission de rôle et voit le projet (périmètre).
- Non résolu ⇒ masqué : `pm` et `territorial` n’ont ni KPI du référentiel, ni alerte de règle, ni `finance.view`.

## 6. Workspaces

| Persona | Landing | Cartes KPI | Panneaux | Périmètre projets |
| --- | --- | --- | --- | --- |
| `dg` | dashboard.title | projectsActive, committedBudget, physicalProgress, ref.CO4, ref.CO5, criticalInformed | health, budget, siteMap, ruleAlerts, wilayaRanking, kpiShelf, priorityProjects, pendingDecisions | portfolio |
| `pmo` | role.pmo.title | trackedProjects, lateOrAtRisk, overdueDeadlines, openAlerts, ref.DO2, ref.DO1 | coordinationQueue, ruleAlerts, kpiShelf, kpiShelf, workload, activity | portfolio |
| `mo` | role.mo.title | assignedProjects, pendingValidations, contractualDueSoon, ref.AV1, ref.QR1, openAlerts | validations, contractualMilestones, kpiShelf, kpiShelf, projectList, ruleAlerts, activity | assigned |
| `pm` | role.pm.title | ownProjects, avgProgress, nextDue, actionsToAdvance, awaitingValidation, overdueDeadlines | focusProject, dailyActions, workflowBoard, projectList, ruleAlerts, pendingDecisions, activity | assigned |
| `finance` | role.finance.title | budgetApproved, committedBudget, paymentsTotal, spendingGap, ref.FI4, ref.FI5 | budget, financialReview, kpiShelf, ruleAlerts, projectFinance, pendingDecisions, activity | portfolio |
| `territorial` | role.territorial.title | wilayasCovered, territorialProgress, wilayasDelayed, wilayasAtRisk, lowestWilaya, overdueDeadlines | siteMap, wilayaRanking, fieldAttention, ruleAlerts, pendingDecisions | portfolio |
