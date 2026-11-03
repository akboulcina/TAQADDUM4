/*
 * GENERATED FILE — do not edit by hand.
 * Source: TAQADDUM_43_KPI_Referentiel (workbook v1, 12/10/2026).
 * Regenerate with: python3 scripts/kpi/export-referentiel.py <workbook.xlsx>
 * Texts are the workbook's own (French); thresholds are PROVISIONAL (see 00_Lecture).
 */

export const REFERENTIEL = {
  "meta": {
    "title": "TAQADDUM — Référentiel de 43 KPI (version recentrée)",
    "version": "v1 — 12/10/2026 — remplace le classeur « 55 KPI » (voir feuille 07_Correspondance).",
    "source": "Fiches projets CNED — situation arrêtée au 30 juin 2025 (51 projets, 6 538,322 Md DA) et critique du classeur précédent.",
    "principle": "43 KPI répartis en 9 familles (AV, FI, DL, BU, QR, DO, PP, CO, GV). L'acteur concerné est un filtre (colonnes Alimenté_par et Responsable), pas un axe de classement.",
    "workbookSha256": "d9adcf6d556b12ab7abc2443ecec4e99a0b90bed92be4c7b2d9ae4f7f08a691b"
  },
  "commonRules": {
    "Projet actif": "Projet ni achevé ni réceptionné. Sur le PDF : 46 projets (38 en cours + 8 en voie d'achèvement).",
    "Deux délais": "Le délai initial et le délai en vigueur (après avenants) sont toujours conservés ; la consommation du délai n'est jamais plafonnée à 100 %.",
    "AE de référence": "AE actuelle approuvée. L'AE initiale est ajustée des transferts de maîtrise d'ouvrage ou de périmètre. L'AE déléguée est distinguée de l'AE totale.",
    "TAP consolidé": "Avancement valorisé de tous les marchés du projet, y compris marchés résiliés et marchés de parachèvement. Les avances forfaitaires sont comptées à part.",
    "Seuils": "Numériques (colonnes K et L) : Vert si « plus haut = mieux » ≥ Seuil_Vert ; Orange si ≥ Seuil_Rouge ; Rouge sinon. Pour « plus bas = mieux » : Vert ≤ Seuil_Vert ; Orange ≤ Seuil_Rouge ; Rouge au-delà. « Écart absolu » : même règle sur la valeur absolue. Les bornes sont incluses côté meilleur niveau. Les règles spéciales et KPI d'information n'ont pas de seuil numérique.",
    "⚠ Seuils provisoires": "Les seuils sont des propositions TAQADDUM, ni officiels CNED ni validés. À recalibrer sur 12–24 mois d'historique. Les pondérations de CO1 et CO6 sont également provisoires et à valider en équipe.",
    "Langage": "Les acronymes techniques (EVM, CPI, SPI) ne sont pas exposés aux utilisateurs non spécialistes ; les définitions de la colonne G sont rédigées en langage courant."
  },
  "roles": [
    {
      "label": "Direction CNED (décideur)",
      "scope": "Portefeuille national (tous les projets)",
      "view": "Synthèse de pilotage : KPI [S] et [M] clés, arbitrage des alertes ROUGE."
    },
    {
      "label": "CNED / PMO (analyste)",
      "scope": "Portefeuille national (tous les projets)",
      "view": "Tous les KPI utiles à l'analyse ; responsable de la qualité des données (DO1 à DO3) et des KPI de portefeuille."
    },
    {
      "label": "Maître d'ouvrage (MO)",
      "scope": "Ses projets uniquement",
      "view": "KPI de pilotage de ses projets ; alimente avancement, délais, blocages, emprises."
    },
    {
      "label": "Bureau d'études (BET) / contrôle",
      "scope": "Projets et marchés qu'il surveille",
      "view": "KPI techniques et qualité ; alimente non-conformités, HSE et consistance."
    },
    {
      "label": "Contractant (entreprise)",
      "scope": "Ses propres marchés uniquement",
      "view": "Sa propre performance et ce qui l'affecte (paiements, emprises, avenants) ; jamais les KPI ni les scores d'autres contractants."
    },
    {
      "label": "Contrôleur budgétaire (Finance)",
      "scope": "Projets de son périmètre budgétaire",
      "view": "KPI financiers (AE, CP, situations) et alertes financières."
    }
  ],
  "kpis": [
    {
      "id": "AV1",
      "familyLabel": "AV – Avancement physique",
      "name": "Avancement physique consolidé",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "calculability": "Partiel",
      "definition": "Part des travaux réellement exécutés sur l'ensemble du projet, tous marchés confondus (y compris marchés résiliés et de parachèvement).",
      "formula": "Valeur des travaux réalisés ÷ coût total estimé du projet × 100",
      "unit": "%",
      "directionLabel": "Information",
      "greenThreshold": null,
      "redThreshold": null,
      "greenText": "Information",
      "orangeText": "—",
      "redText": "Information",
      "dataOwner": "Fiche CNED / MO",
      "kpiOwner": "MO",
      "targetFrequency": "Mensuelle",
      "dataSources": "Projets; Marches; Avancement_Historique",
      "justification": "Socle de tout le suivi : sans lui, aucun autre KPI d'avancement n'a de sens.",
      "roleAccess": [
        null,
        "S",
        "R",
        "V",
        "V",
        "V"
      ]
    },
    {
      "id": "AV2",
      "familyLabel": "AV – Avancement physique",
      "name": "Indice d'avancement",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "calculability": "Calculable sur fiches CNED",
      "definition": "Compare l'avancement physique au temps déjà consommé ; 1 = projet dans le rythme.",
      "formula": "TAP consolidé ÷ % du délai en vigueur consommé",
      "unit": "ratio",
      "directionLabel": "Plus haut = mieux",
      "greenThreshold": 0.9,
      "redThreshold": 0.7,
      "greenText": "≥ 0.9 ratio",
      "orangeText": "de 0.7 à < 0.9 ratio",
      "redText": "< 0.7 ratio",
      "dataOwner": "Plateforme",
      "kpiOwner": "CNED / PMO",
      "targetFrequency": "Mensuelle",
      "dataSources": "Projets; Marches",
      "justification": "KPI central de détection du retard ; remplace cinq anciens KPI d'avancement absolu.",
      "roleAccess": [
        "V",
        "R",
        "V",
        "V",
        "V",
        "V"
      ]
    },
    {
      "id": "AV3",
      "familyLabel": "AV – Avancement physique",
      "name": "Cadence récente",
      "importanceLabel": "[A]",
      "phase": "V2",
      "calculability": "Saisie requise",
      "definition": "Vitesse d'avancement des trois derniers mois comparée à celle nécessaire pour finir dans le délai.",
      "formula": "ΔTAP des 3 derniers mois ÷ ΔTAP requis pour finir dans le délai en vigueur",
      "unit": "ratio",
      "directionLabel": "Plus haut = mieux",
      "greenThreshold": 0.9,
      "redThreshold": 0.7,
      "greenText": "≥ 0.9 ratio",
      "orangeText": "de 0.7 à < 0.9 ratio",
      "redText": "< 0.7 ratio",
      "dataOwner": "MO / BET",
      "kpiOwner": "MO",
      "targetFrequency": "Mensuelle",
      "dataSources": "Avancement_Historique",
      "justification": "Exige un historique mensuel ; utile pour anticiper, pas indispensable au pilote.",
      "roleAccess": [
        null,
        "V",
        "R",
        "S",
        "V",
        null
      ]
    },
    {
      "id": "AV4",
      "familyLabel": "AV – Avancement physique",
      "name": "Part non contractualisée",
      "importanceLabel": "[A]",
      "phase": "MVP",
      "calculability": "Partiel (extraction texte)",
      "definition": "Part du reste à réaliser pour laquelle aucun marché n'est notifié (lots non lancés, appels d'offres infructueux).",
      "formula": "Coût du reste à réaliser sans marché notifié ÷ coût du reste à réaliser × 100",
      "unit": "%",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 10,
      "redThreshold": 30,
      "greenText": "≤ 10 %",
      "orangeText": "> 10 à 30 %",
      "redText": "> 30 %",
      "dataOwner": "MO",
      "kpiOwner": "MO",
      "targetFrequency": "Mensuelle",
      "dataSources": "Marches; Projets",
      "justification": "Distingue lots non lancés et travaux arrêtés ; affine le diagnostic.",
      "roleAccess": [
        null,
        "V",
        "R",
        null,
        null,
        null
      ]
    },
    {
      "id": "AV5",
      "familyLabel": "AV – Avancement physique",
      "name": "Mise en service fonctionnelle",
      "importanceLabel": "[S]",
      "phase": "MVP",
      "calculability": "Partiel (extraction texte)",
      "definition": "Part des ouvrages mis en service qui fonctionnent pleinement (sans réserve ni lot système, signalisation ou énergie en retard).",
      "formula": "Ouvrages mis en service sans réserve ni lot système en retard ÷ ouvrages mis en service × 100",
      "unit": "%",
      "directionLabel": "Plus haut = mieux",
      "greenThreshold": 90,
      "redThreshold": 60,
      "greenText": "≥ 90 %",
      "orangeText": "de 60 à < 90 %",
      "redText": "< 60 %",
      "dataOwner": "CNED / MO",
      "kpiOwner": "CNED",
      "targetFrequency": "Mensuelle",
      "dataSources": "Projets; Marches; Receptions (à créer)",
      "justification": "Mesure le service réellement rendu, pas seulement l'avancement des travaux.",
      "roleAccess": [
        "V",
        "R",
        "S",
        null,
        null,
        null
      ]
    },
    {
      "id": "FI1",
      "familyLabel": "FI – Finance",
      "name": "Écart physique–financier",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "calculability": "Calculable sur fiches CNED",
      "definition": "Écart entre avancement physique et consommation financière des travaux, hors avances. Positif : retard de paiement ; négatif : paiement en avance du réalisé.",
      "formula": "TAP − taux financier travaux hors avances (en points)",
      "unit": "pts",
      "directionLabel": "Écart absolu",
      "greenThreshold": 5,
      "redThreshold": 10,
      "greenText": "|écart| ≤ 5 pts",
      "orangeText": "|écart| > 5 à 10 pts",
      "redText": "|écart| > 10 pts",
      "dataOwner": "MO / Finance",
      "kpiOwner": "MO",
      "targetFrequency": "Mensuelle",
      "dataSources": "Projets; Marches; Situations_Facturations",
      "justification": "Détecte à la fois les retards de paiement et les paiements non adossés à du réalisé.",
      "roleAccess": [
        null,
        "V",
        "R",
        null,
        "V",
        "S"
      ]
    },
    {
      "id": "FI2",
      "familyLabel": "FI – Finance",
      "name": "Couverture du reste à faire",
      "importanceLabel": "[S]",
      "phase": "V2",
      "calculability": "Saisie requise",
      "definition": "Capacité des ressources financières restantes à couvrir ce qu'il reste à payer, avenants en préparation compris.",
      "formula": "(AE actuelle − paiements) ÷ reste à faire estimé × 100",
      "unit": "%",
      "directionLabel": "Plus haut = mieux",
      "greenThreshold": 100,
      "redThreshold": 90,
      "greenText": "≥ 100 %",
      "orangeText": "de 90 à < 100 %",
      "redText": "< 90 %",
      "dataOwner": "MO / Finance",
      "kpiOwner": "MO / Finance",
      "targetFrequency": "Mensuelle",
      "dataSources": "Projets; Reevaluations_AE; AE_Operations (à créer)",
      "justification": "Soutient l'arbitrage de financement ; remplace cinq KPI redondants ou contradictoires.",
      "roleAccess": [
        "V",
        "V",
        "R",
        null,
        null,
        "S"
      ]
    },
    {
      "id": "FI3",
      "familyLabel": "FI – Finance",
      "name": "Couverture des crédits de paiement",
      "importanceLabel": "[S]",
      "phase": "V2",
      "calculability": "Saisie requise",
      "definition": "Les crédits de paiement de l'exercice couvrent-ils les paiements prévus ? (insuffisance des CP : contrainte récurrente.)",
      "formula": "CP inscrits de l'exercice ÷ paiements prévus de l'exercice × 100",
      "unit": "%",
      "directionLabel": "Plus haut = mieux",
      "greenThreshold": 100,
      "redThreshold": 80,
      "greenText": "≥ 100 %",
      "orangeText": "de 80 à < 100 %",
      "redText": "< 80 %",
      "dataOwner": "Finance",
      "kpiOwner": "Contrôleur budgétaire",
      "targetFrequency": "Mensuelle",
      "dataSources": "Credits_Paiement (à créer); Planning",
      "justification": "Les CP étaient absents de l'ancien modèle alors que le PDF les cite comme contrainte.",
      "roleAccess": [
        "V",
        "V",
        "V",
        null,
        null,
        "R"
      ]
    },
    {
      "id": "FI4",
      "familyLabel": "FI – Finance",
      "name": "Dérive d'AE ajustée",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "calculability": "Calculable sur fiches CNED",
      "definition": "Augmentation de l'AE par rapport à l'AE initiale, après neutralisation des transferts de maîtrise d'ouvrage ou de périmètre.",
      "formula": "(AE actuelle − AE initiale ajustée) ÷ AE initiale ajustée × 100",
      "unit": "%",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 20,
      "redThreshold": 60,
      "greenText": "≤ 20 %",
      "orangeText": "> 20 à 60 %",
      "redText": "> 60 %",
      "dataOwner": "Fiche CNED",
      "kpiOwner": "Contrôleur budgétaire",
      "targetFrequency": "Mensuelle",
      "dataSources": "Projets; Reevaluations_AE; AE_Operations (à créer)",
      "justification": "Mesure du dérapage budgétaire ; remplace trois KPI identiques. Seuils provisoires calés sur le portefeuille.",
      "roleAccess": [
        "V",
        "V",
        "V",
        null,
        null,
        "R"
      ]
    },
    {
      "id": "FI5",
      "familyLabel": "FI – Finance",
      "name": "Réévaluations d'AE en attente",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "calculability": "Partiel (extraction texte)",
      "definition": "Ancienneté de la plus ancienne réévaluation d'AE non encore approuvée ; le montant en attente est affiché à côté.",
      "formula": "Date de référence − date de la plus ancienne demande non approuvée (jours)",
      "unit": "j",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 60,
      "redThreshold": 120,
      "greenText": "≤ 60 j",
      "orangeText": "> 60 à 120 j",
      "redText": "> 120 j",
      "dataOwner": "Fiche CNED",
      "kpiOwner": "Contrôleur budgétaire / CNED",
      "targetFrequency": "Mensuelle",
      "dataSources": "Reevaluations_AE",
      "justification": "Les notifications dépendent d'une approbation en réunion de Gouvernement ou Conseil des Ministres : goulot majeur.",
      "roleAccess": [
        "V",
        "S",
        "V",
        null,
        null,
        "R"
      ]
    },
    {
      "id": "FI6",
      "familyLabel": "FI – Finance",
      "name": "Retard de paiement des situations",
      "importanceLabel": "[A]",
      "phase": "V2",
      "calculability": "Saisie requise",
      "definition": "Ancienneté médiane des situations de travaux reçues mais non payées.",
      "formula": "Médiane (date de référence − date de réception) des situations non payées (jours)",
      "unit": "j",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 30,
      "redThreshold": 60,
      "greenText": "≤ 30 j",
      "orangeText": "> 30 à 60 j",
      "redText": "> 60 j",
      "dataOwner": "MO / Finance",
      "kpiOwner": "MO / Finance",
      "targetFrequency": "Mensuelle",
      "dataSources": "Situations_Facturations",
      "justification": "Cause documentée de démobilisation des entreprises ; données hors fiches CNED.",
      "roleAccess": [
        null,
        "V",
        "R",
        null,
        "V",
        "S"
      ],
      "roleScopeNote": "Contractant : ses propres situations."
    },
    {
      "id": "FI7",
      "familyLabel": "FI – Finance",
      "name": "Encours de situations",
      "importanceLabel": "[A]",
      "phase": "V2",
      "calculability": "Saisie requise",
      "definition": "Poids des situations reçues mais non payées par rapport au montant du marché.",
      "formula": "Σ situations reçues non payées ÷ montant du marché × 100",
      "unit": "%",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 5,
      "redThreshold": 15,
      "greenText": "≤ 5 %",
      "orangeText": "> 5 à 15 %",
      "redText": "> 15 %",
      "dataOwner": "Contrôleur budgétaire",
      "kpiOwner": "Contrôleur budgétaire",
      "targetFrequency": "Mensuelle",
      "dataSources": "Situations_Facturations; Marches",
      "justification": "Complète FI6 en montant ; données hors fiches CNED.",
      "roleAccess": [
        null,
        "V",
        "V",
        null,
        "V",
        "R"
      ],
      "roleScopeNote": "Contractant : ses propres situations."
    },
    {
      "id": "DL1",
      "familyLabel": "DL – Délais",
      "name": "Consommation du délai en vigueur",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "calculability": "Calculable sur fiches CNED",
      "definition": "Part du délai contractuel en vigueur (avenants inclus) déjà écoulée ; non plafonnée à 100 %.",
      "formula": "Jours écoulés depuis l'ODS de démarrage ÷ délai en vigueur × 100",
      "unit": "%",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 90,
      "redThreshold": 100,
      "greenText": "≤ 90 %",
      "orangeText": "> 90 à 100 %",
      "redText": "> 100 %",
      "dataOwner": "Fiche CNED",
      "kpiOwner": "MO",
      "targetFrequency": "Mensuelle",
      "dataSources": "Marches; ODS",
      "justification": "Base du suivi des délais ; indispensable à AV2.",
      "roleAccess": [
        null,
        "V",
        "R",
        "V",
        "V",
        "V"
      ]
    },
    {
      "id": "DL2",
      "familyLabel": "DL – Délais",
      "name": "Dérive de délai par avenants",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "calculability": "Calculable sur fiches CNED",
      "definition": "Allongement du délai par avenants par rapport au délai initial ; 1 = aucun allongement.",
      "formula": "Délai en vigueur ÷ délai initial",
      "unit": "ratio",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 1.25,
      "redThreshold": 2,
      "greenText": "≤ 1.25 ratio",
      "orangeText": "> 1.25 à 2.0 ratio",
      "redText": "> 2.0 ratio",
      "dataOwner": "Fiche CNED",
      "kpiOwner": "CNED",
      "targetFrequency": "Mensuelle",
      "dataSources": "Marches; Avenants",
      "justification": "Pathologie n°1 du portefeuille (ex. 24 mois devenus 110), absente de l'ancien référentiel.",
      "roleAccess": [
        "V",
        "R",
        "V",
        "V",
        "V",
        "V"
      ]
    },
    {
      "id": "DL3",
      "familyLabel": "DL – Délais",
      "name": "Dépassement de la date contractuelle",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "calculability": "Calculable sur fiches CNED",
      "definition": "Jours écoulés depuis la date de fin contractuelle en vigueur, pour un projet non achevé (0 si non dépassée). Au niveau portefeuille : médiane.",
      "formula": "max(0 ; date de référence − date de fin contractuelle en vigueur)",
      "unit": "j",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 0,
      "redThreshold": 180,
      "greenText": "≤ 0 j",
      "orangeText": "> 0 à 180 j",
      "redText": "> 180 j",
      "dataOwner": "Fiche CNED",
      "kpiOwner": "CNED",
      "targetFrequency": "Mensuelle",
      "dataSources": "Marches",
      "justification": "Mesure simple et incontestable du retard contractuel.",
      "roleAccess": [
        "V",
        "R",
        "V",
        "V",
        "V",
        "V"
      ]
    },
    {
      "id": "DL4",
      "familyLabel": "DL – Délais",
      "name": "Date d'achèvement prévisionnelle",
      "importanceLabel": "[S]",
      "phase": "V2",
      "calculability": "Saisie requise",
      "definition": "Écart entre la date d'achèvement prévue au rythme actuel (contraintes incluses) et la date contractuelle.",
      "formula": "(date de référence + reste à faire ÷ cadence récente) − date contractuelle (en mois)",
      "unit": "mois",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 0,
      "redThreshold": 6,
      "greenText": "≤ 0 mois",
      "orangeText": "> 0 à 6 mois",
      "redText": "> 6 mois",
      "dataOwner": "MO",
      "kpiOwner": "MO",
      "targetFrequency": "Mensuelle",
      "dataSources": "Avancement_Historique; Planning; Blocages_Institutionnels",
      "justification": "Indicateur de décision (réengagement, arbitrage) ; dépend d'un historique fiable.",
      "roleAccess": [
        "V",
        "V",
        "R",
        "S",
        "V",
        null
      ]
    },
    {
      "id": "BU1",
      "familyLabel": "BU – Coût et avenants",
      "name": "Poids financier des avenants",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "calculability": "Calculable sur fiches CNED",
      "definition": "Part du montant initial d'un marché ajoutée par les avenants.",
      "formula": "Σ avenants ÷ montant initial du marché × 100",
      "unit": "%",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 15,
      "redThreshold": 40,
      "greenText": "≤ 15 %",
      "orangeText": "> 15 à 40 %",
      "redText": "> 40 %",
      "dataOwner": "Fiche CNED",
      "kpiOwner": "CNED / MO",
      "targetFrequency": "Mensuelle",
      "dataSources": "Marches; Avenants",
      "justification": "Révèle les marchés dont la consistance dérive (ex. un marché passé de 17,5 à 68 Md DA).",
      "roleAccess": [
        "V",
        "R",
        "S",
        null,
        "V",
        "V"
      ]
    },
    {
      "id": "BU2",
      "familyLabel": "BU – Coût et avenants",
      "name": "Nombre d'avenants cumulés",
      "importanceLabel": "[A]",
      "phase": "MVP",
      "calculability": "Partiel (extraction texte)",
      "definition": "Nombre d'avenants notifiés sur un marché.",
      "formula": "Nombre d'avenants notifiés",
      "unit": "nombre",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 3,
      "redThreshold": 8,
      "greenText": "≤ 3 nombre",
      "orangeText": "> 3 à 8 nombre",
      "redText": "> 8 nombre",
      "dataOwner": "Fiche CNED",
      "kpiOwner": "MO",
      "targetFrequency": "Mensuelle",
      "dataSources": "Avenants",
      "justification": "Complète BU1 ; utile en analyse fine.",
      "roleAccess": [
        null,
        "V",
        "R",
        "V",
        "V",
        null
      ]
    },
    {
      "id": "BU3",
      "familyLabel": "BU – Coût et avenants",
      "name": "Coût final prévisionnel",
      "importanceLabel": "[S]",
      "phase": "V2",
      "calculability": "Saisie requise",
      "definition": "Coût estimé à l'achèvement rapporté à l'AE actuelle.",
      "formula": "(engagements + reste à faire estimé) ÷ AE actuelle × 100",
      "unit": "%",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 100,
      "redThreshold": 110,
      "greenText": "≤ 100 %",
      "orangeText": "> 100 à 110 %",
      "redText": "> 110 %",
      "dataOwner": "MO / Finance",
      "kpiOwner": "MO / Finance",
      "targetFrequency": "Mensuelle",
      "dataSources": "Projets; AE_Operations (à créer); Reevaluations_AE",
      "justification": "Prévision stratégique ; nécessite une estimation du reste à faire.",
      "roleAccess": [
        "V",
        "V",
        "R",
        "S",
        null,
        "V"
      ]
    },
    {
      "id": "QR1",
      "familyLabel": "QR – Blocages, qualité, risques",
      "name": "Taux de libération des emprises",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "calculability": "Partiel (extraction texte)",
      "definition": "Part de l'emprise nécessaire à date (selon le planning) effectivement libérée.",
      "formula": "Emprise libérée ÷ emprise requise à date × 100",
      "unit": "%",
      "directionLabel": "Plus haut = mieux",
      "greenThreshold": 95,
      "redThreshold": 80,
      "greenText": "≥ 95 %",
      "orangeText": "de 80 à < 95 %",
      "redText": "< 80 %",
      "dataOwner": "MO / autorités locales",
      "kpiOwner": "MO",
      "targetFrequency": "Mensuelle",
      "dataSources": "Emprises; Blocages_Institutionnels",
      "justification": "Foncier : contrainte n°1 du portefeuille, hors de portée de la seule maîtrise de projet.",
      "roleAccess": [
        "V",
        "V",
        "R",
        "V",
        "V",
        null
      ]
    },
    {
      "id": "QR2",
      "familyLabel": "QR – Blocages, qualité, risques",
      "name": "Interférences réseaux traitées",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "calculability": "Partiel (extraction texte)",
      "definition": "Part des interférences avec les réseaux (électricité, gaz, eau, assainissement) déjà déplacées ou protégées.",
      "formula": "Interférences traitées ÷ interférences identifiées × 100",
      "unit": "%",
      "directionLabel": "Plus haut = mieux",
      "greenThreshold": 90,
      "redThreshold": 60,
      "greenText": "≥ 90 %",
      "orangeText": "de 60 à < 90 %",
      "redText": "< 60 %",
      "dataOwner": "MO / gestionnaires de réseaux",
      "kpiOwner": "MO",
      "targetFrequency": "Mensuelle",
      "dataSources": "Reseaux; Blocages_Institutionnels",
      "justification": "Deuxième cause récurrente de retard ; suivi par organisme.",
      "roleAccess": [
        null,
        "V",
        "R",
        "V",
        "V",
        null
      ]
    },
    {
      "id": "QR3",
      "familyLabel": "QR – Blocages, qualité, risques",
      "name": "Âge des blocages ouverts",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "calculability": "Saisie requise",
      "definition": "Ancienneté médiane des blocages institutionnels ouverts ; leur nombre est affiché à côté.",
      "formula": "Médiane (date de référence − date d'ouverture) des blocages ouverts (jours)",
      "unit": "j",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 30,
      "redThreshold": 90,
      "greenText": "≤ 30 j",
      "orangeText": "> 30 à 90 j",
      "redText": "> 90 j",
      "dataOwner": "CNED / PMO",
      "kpiOwner": "CNED / PMO",
      "targetFrequency": "Mensuelle",
      "dataSources": "Blocages_Institutionnels",
      "justification": "Mesure la réactivité de la chaîne de décision.",
      "roleAccess": [
        "V",
        "R",
        "V",
        "V",
        "V",
        null
      ]
    },
    {
      "id": "QR4",
      "familyLabel": "QR – Blocages, qualité, risques",
      "name": "Temps perdu à l'arrêt",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "calculability": "Partiel (extraction texte)",
      "definition": "Part du temps écoulé pendant laquelle le chantier est arrêté (ODS d'arrêt ou arrêt de fait).",
      "formula": "Jours d'arrêt ÷ jours écoulés × 100",
      "unit": "%",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 5,
      "redThreshold": 15,
      "greenText": "≤ 5 %",
      "orangeText": "> 5 à 15 %",
      "redText": "> 15 %",
      "dataOwner": "MO",
      "kpiOwner": "MO",
      "targetFrequency": "Mensuelle",
      "dataSources": "ODS; Blocages_Institutionnels",
      "justification": "Sépare « travaux arrêtés » et « lots non lancés » : distinction clé du portefeuille.",
      "roleAccess": [
        "V",
        "V",
        "R",
        "V",
        "V",
        null
      ]
    },
    {
      "id": "QR5",
      "familyLabel": "QR – Blocages, qualité, risques",
      "name": "Aléas non prévus ouverts",
      "importanceLabel": "[A]",
      "phase": "V2",
      "calculability": "Partiel (extraction texte)",
      "definition": "Événements imprévus ouverts (glissement de terrain, inondation, géologie).",
      "formula": "Nombre d'aléas ouverts et état de la solution",
      "unit": "nombre",
      "directionLabel": "Règle spéciale",
      "greenThreshold": null,
      "redThreshold": null,
      "greenText": "0 aléa ouvert",
      "orangeText": "≥ 1 aléa avec solution arrêtée",
      "redText": "≥ 1 aléa sans solution arrêtée",
      "dataOwner": "MO / BET",
      "kpiOwner": "MO",
      "targetFrequency": "Mensuelle",
      "dataSources": "Blocages_Institutionnels; Taches_Critiques",
      "justification": "Cas particuliers (ex. glissement) ; renforce l'analyse sans être indispensable.",
      "roleAccess": [
        null,
        "V",
        "R",
        "S",
        "V",
        null
      ]
    },
    {
      "id": "QR6",
      "familyLabel": "QR – Blocages, qualité, risques",
      "name": "Modification de consistance en cours",
      "importanceLabel": "[A]",
      "phase": "V2",
      "calculability": "Saisie requise",
      "definition": "Indique si la consistance du projet est en cours de modification (signe de maturation insuffisante).",
      "formula": "Oui / Non",
      "unit": "oui/non",
      "directionLabel": "Règle spéciale",
      "greenThreshold": null,
      "redThreshold": null,
      "greenText": "Non",
      "orangeText": "—",
      "redText": "Oui",
      "dataOwner": "BET / MO",
      "kpiOwner": "BET / MO",
      "targetFrequency": "Mensuelle",
      "dataSources": "Projets; Avenants",
      "justification": "Drapeau de maturation ; utile surtout en revue technique.",
      "roleAccess": [
        null,
        "V",
        "S",
        "R",
        null,
        null
      ]
    },
    {
      "id": "QR7",
      "familyLabel": "QR – Blocages, qualité, risques",
      "name": "Non-conformité critique la plus ancienne",
      "importanceLabel": "[A]",
      "phase": "V2",
      "calculability": "Saisie requise",
      "definition": "Ancienneté de la non-conformité critique ouverte la plus ancienne.",
      "formula": "Date de référence − date de découverte de la NC critique ouverte la plus ancienne (jours)",
      "unit": "j",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 15,
      "redThreshold": 30,
      "greenText": "≤ 15 j",
      "orangeText": "> 15 à 30 j",
      "redText": "> 30 j",
      "dataOwner": "BET",
      "kpiOwner": "BET",
      "targetFrequency": "Mensuelle",
      "dataSources": "Non_Conformites_BET",
      "justification": "Registre de NC absent des fiches CNED ; saisie BET nécessaire.",
      "roleAccess": [
        null,
        "V",
        "V",
        "R",
        "V",
        null
      ],
      "roleScopeNote": "Contractant : les NC qui le concernent."
    },
    {
      "id": "QR8",
      "familyLabel": "QR – Blocages, qualité, risques",
      "name": "Incidents HSE graves",
      "importanceLabel": "[A]",
      "phase": "Vision",
      "calculability": "Saisie requise",
      "definition": "Nombre d'incidents de sécurité graves sur 12 mois.",
      "formula": "Nombre d'incidents graves sur 12 mois",
      "unit": "nombre",
      "directionLabel": "Règle spéciale",
      "greenThreshold": null,
      "redThreshold": null,
      "greenText": "0",
      "orangeText": "—",
      "redText": "≥ 1",
      "dataOwner": "BET / HSE",
      "kpiOwner": "BET / HSE",
      "targetFrequency": "Mensuelle + immédiate",
      "dataSources": "HSE_Incidents",
      "justification": "Hors périmètre du pilote : aucune donnée dans les fiches CNED.",
      "roleAccess": [
        null,
        "V",
        "V",
        "R",
        "V",
        null
      ],
      "roleScopeNote": "Contractant : incidents de ses chantiers."
    },
    {
      "id": "DO1",
      "familyLabel": "DO – Fiabilité des données",
      "name": "Fraîcheur des données",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "calculability": "Calculable par la plateforme",
      "definition": "Âge de la dernière mise à jour d'un projet comparé à la périodicité attendue.",
      "formula": "Âge de la dernière mise à jour ÷ périodicité attendue",
      "unit": "ratio",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 1,
      "redThreshold": 2,
      "greenText": "≤ 1 ratio",
      "orangeText": "> 1 à 2 ratio",
      "redText": "> 2 ratio",
      "dataOwner": "Plateforme",
      "kpiOwner": "PMO",
      "targetFrequency": "Mensuelle",
      "dataSources": "KPI_Valeurs; Projets",
      "justification": "Sans données fraîches, tous les autres KPI sont trompeurs.",
      "roleAccess": [
        null,
        "R",
        "V",
        "V",
        null,
        null
      ]
    },
    {
      "id": "DO2",
      "familyLabel": "DO – Fiabilité des données",
      "name": "Complétude",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "calculability": "Calculable par la plateforme",
      "definition": "Part des champs obligatoires renseignés.",
      "formula": "Champs obligatoires renseignés ÷ champs requis × 100",
      "unit": "%",
      "directionLabel": "Plus haut = mieux",
      "greenThreshold": 90,
      "redThreshold": 70,
      "greenText": "≥ 90 %",
      "orangeText": "de 70 à < 90 %",
      "redText": "< 70 %",
      "dataOwner": "Plateforme",
      "kpiOwner": "PMO",
      "targetFrequency": "Mensuelle",
      "dataSources": "Toutes tables",
      "justification": "Rend visible ce qui manque plutôt que de le masquer.",
      "roleAccess": [
        null,
        "R",
        "V",
        "V",
        null,
        null
      ]
    },
    {
      "id": "DO3",
      "familyLabel": "DO – Fiabilité des données",
      "name": "Cohérence",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "calculability": "Calculable par la plateforme",
      "definition": "Part des projets présentant au moins une anomalie détectée automatiquement (TAP > 100 %, paiements > engagements, dates incohérentes).",
      "formula": "Projets avec ≥ 1 anomalie ÷ projets × 100",
      "unit": "%",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 5,
      "redThreshold": 20,
      "greenText": "≤ 5 %",
      "orangeText": "> 5 à 20 %",
      "redText": "> 20 %",
      "dataOwner": "Plateforme",
      "kpiOwner": "PMO",
      "targetFrequency": "Mensuelle",
      "dataSources": "Projets; Marches",
      "justification": "Contrôle de qualité minimal avant toute présentation au CNED.",
      "roleAccess": [
        null,
        "R",
        "V",
        "V",
        null,
        null
      ]
    },
    {
      "id": "PP1",
      "familyLabel": "PP – Terrain (planification fiable)",
      "name": "Fiabilité du planning hebdomadaire",
      "importanceLabel": "[A]",
      "phase": "V2",
      "calculability": "Saisie requise",
      "definition": "Part des tâches planifiées de la semaine réellement terminées (PPC).",
      "formula": "Tâches terminées ÷ tâches planifiées × 100",
      "unit": "%",
      "directionLabel": "Plus haut = mieux",
      "greenThreshold": 80,
      "redThreshold": 60,
      "greenText": "≥ 80 %",
      "orangeText": "de 60 à < 80 %",
      "redText": "< 60 %",
      "dataOwner": "Terrain / entreprise",
      "kpiOwner": "MO",
      "targetFrequency": "Hebdomadaire",
      "dataSources": "Taches_Critiques; Planning",
      "justification": "Cœur de la logique terrain, mais saisie hebdomadaire hors fiches CNED.",
      "roleAccess": [
        null,
        "V",
        "R",
        "V",
        "S",
        null
      ]
    },
    {
      "id": "PP2",
      "familyLabel": "PP – Terrain (planification fiable)",
      "name": "Mobilisation effective",
      "importanceLabel": "[A]",
      "phase": "V2",
      "calculability": "Saisie requise",
      "definition": "Moyens (heures, main-d'œuvre, matériel) effectivement mobilisés par rapport au plan.",
      "formula": "Moyens effectifs ÷ moyens planifiés × 100",
      "unit": "%",
      "directionLabel": "Plus haut = mieux",
      "greenThreshold": 90,
      "redThreshold": 70,
      "greenText": "≥ 90 %",
      "orangeText": "de 70 à < 90 %",
      "redText": "< 70 %",
      "dataOwner": "Entreprise",
      "kpiOwner": "MO",
      "targetFrequency": "Hebdomadaire",
      "dataSources": "Moyens_Mobilises",
      "justification": "La « faible mobilisation des moyens » est citée dans une dizaine de fiches.",
      "roleAccess": [
        null,
        "V",
        "R",
        "V",
        "S",
        null
      ]
    },
    {
      "id": "PP3",
      "familyLabel": "PP – Terrain (planification fiable)",
      "name": "Causes de non-réalisation externes",
      "importanceLabel": "[A]",
      "phase": "V2",
      "calculability": "Saisie requise",
      "definition": "Répartition des non-réalisations dues à l'emprise, au paiement, aux matériaux ou aux réseaux.",
      "formula": "Non-réalisations d'origine externe par cause ÷ total des non-réalisations",
      "unit": "%",
      "directionLabel": "Information",
      "greenThreshold": null,
      "redThreshold": null,
      "greenText": "Information",
      "orangeText": "—",
      "redText": "Information",
      "dataOwner": "Terrain",
      "kpiOwner": "MO",
      "targetFrequency": "Hebdomadaire",
      "dataSources": "Taches_Critiques",
      "justification": "Pareto des causes : prépare l'escalade vers les bons responsables.",
      "roleAccess": [
        null,
        "V",
        "R",
        "V",
        "S",
        null
      ]
    },
    {
      "id": "CO1",
      "familyLabel": "CO – Contractants et portefeuille",
      "name": "Santé du contractant (0–100)",
      "importanceLabel": "[S]",
      "phase": "MVP",
      "calculability": "Partiel (poids à valider)",
      "definition": "Note synthétique de fiabilité d'un contractant ou groupement.",
      "formula": "40 % AV2 (plafonné à 1) + 25 % inverse de BU1 + 20 % PP2 + 15 % historique de résiliations ; si PP2 absent, ses 20 % sont redistribués (poids provisoires)",
      "unit": "0–100",
      "directionLabel": "Plus haut = mieux",
      "greenThreshold": 75,
      "redThreshold": 50,
      "greenText": "≥ 75 0–100",
      "orangeText": "de 50 à < 75 0–100",
      "redText": "< 50 0–100",
      "dataOwner": "CNED / MO",
      "kpiOwner": "CNED",
      "targetFrequency": "Mensuelle",
      "dataSources": "Scoring_Contractants; Groupements (à créer); Marches",
      "justification": "Aide à décider de la suite donnée à un contractant ; poids à valider en équipe.",
      "roleAccess": [
        "V",
        "R",
        "V",
        null,
        "V",
        null
      ],
      "roleScopeNote": "Contractant : son propre score uniquement."
    },
    {
      "id": "CO2",
      "familyLabel": "CO – Contractants et portefeuille",
      "name": "Concentration par contractant",
      "importanceLabel": "[S]",
      "phase": "V2",
      "calculability": "Partiel (groupements à modéliser)",
      "definition": "Part de l'AE en cours confiée à un même contractant ou groupement.",
      "formula": "AE en cours confiée à un contractant ÷ AE en cours × 100",
      "unit": "%",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 15,
      "redThreshold": 25,
      "greenText": "≤ 15 %",
      "orangeText": "> 15 à 25 %",
      "redText": "> 25 %",
      "dataOwner": "CNED",
      "kpiOwner": "CNED",
      "targetFrequency": "Mensuelle",
      "dataSources": "Marches; Groupements (à créer)",
      "justification": "Risque systémique ; le portefeuille montre une forte concentration.",
      "roleAccess": [
        "V",
        "R",
        null,
        null,
        null,
        null
      ]
    },
    {
      "id": "CO3",
      "familyLabel": "CO – Contractants et portefeuille",
      "name": "Part en parachèvement après résiliation",
      "importanceLabel": "[S]",
      "phase": "MVP",
      "calculability": "Partiel (extraction texte)",
      "definition": "Part de l'AE des projets actifs dont le marché initial a été résilié.",
      "formula": "AE des projets dont le marché initial est résilié ÷ AE des projets actifs × 100",
      "unit": "%",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 5,
      "redThreshold": 15,
      "greenText": "≤ 5 %",
      "orangeText": "> 5 à 15 %",
      "redText": "> 15 %",
      "dataOwner": "CNED",
      "kpiOwner": "CNED",
      "targetFrequency": "Mensuelle",
      "dataSources": "Marches; Projets",
      "justification": "Mesure l'ampleur des défaillances contractuelles à l'échelle du portefeuille.",
      "roleAccess": [
        "V",
        "R",
        null,
        null,
        null,
        null
      ]
    },
    {
      "id": "CO4",
      "familyLabel": "CO – Contractants et portefeuille",
      "name": "Projets en retard important",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "calculability": "Calculable sur fiches CNED",
      "definition": "Part des projets actifs dont le délai est dépassé et l'avancement insuffisant.",
      "formula": "Projets avec DL1 > 100 % et AV2 < 0,90 ÷ projets actifs × 100",
      "unit": "%",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 15,
      "redThreshold": 35,
      "greenText": "≤ 15 %",
      "orangeText": "> 15 à 35 %",
      "redText": "> 35 %",
      "dataOwner": "Plateforme",
      "kpiOwner": "CNED",
      "targetFrequency": "Mensuelle",
      "dataSources": "Projets; Marches",
      "justification": "Donne une définition opérationnelle à « retard important ».",
      "roleAccess": [
        "V",
        "R",
        "V",
        null,
        null,
        "V"
      ]
    },
    {
      "id": "CO5",
      "familyLabel": "CO – Contractants et portefeuille",
      "name": "Projets à l'arrêt",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "calculability": "Partiel (extraction texte)",
      "definition": "Part des projets actifs à l'arrêt (ODS d'arrêt ou arrêt de fait) depuis plus de 60 jours.",
      "formula": "Projets arrêtés > 60 jours ÷ projets actifs × 100",
      "unit": "%",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 5,
      "redThreshold": 15,
      "greenText": "≤ 5 %",
      "orangeText": "> 5 à 15 %",
      "redText": "> 15 %",
      "dataOwner": "CNED",
      "kpiOwner": "CNED",
      "targetFrequency": "Mensuelle + immédiate",
      "dataSources": "ODS; Projets",
      "justification": "Alerte portefeuille de premier niveau.",
      "roleAccess": [
        "V",
        "R",
        "V",
        null,
        null,
        "V"
      ]
    },
    {
      "id": "CO6",
      "familyLabel": "CO – Contractants et portefeuille",
      "name": "Score de santé du portefeuille",
      "importanceLabel": "[S]",
      "phase": "V2",
      "calculability": "Partiel (poids à valider)",
      "definition": "Note synthétique de l'état du portefeuille, pondérée par l'AE.",
      "formula": "25 % AV2 + 20 % délais (DL1, DL3) + 20 % finance (FI2, FI6) + 20 % blocages (QR1 à QR4) + 15 % CO1 (pondéré AE ; poids provisoires)",
      "unit": "0–100",
      "directionLabel": "Plus haut = mieux",
      "greenThreshold": 75,
      "redThreshold": 55,
      "greenText": "≥ 75 0–100",
      "orangeText": "de 55 à < 75 0–100",
      "redText": "< 55 0–100",
      "dataOwner": "Plateforme",
      "kpiOwner": "CNED / PMO",
      "targetFrequency": "Mensuelle",
      "dataSources": "Tous KPI de projet",
      "justification": "Vue de pilotage ; ne doit être publiée qu'après validation des poids.",
      "roleAccess": [
        "V",
        "R",
        null,
        null,
        null,
        null
      ]
    },
    {
      "id": "GV1",
      "familyLabel": "GV – Gouvernance",
      "name": "Blocages avec responsable et échéance",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "calculability": "Saisie requise",
      "definition": "Part des blocages ouverts ayant un responsable nommé et une date cible.",
      "formula": "Blocages ouverts avec responsable et échéance ÷ blocages ouverts × 100",
      "unit": "%",
      "directionLabel": "Plus haut = mieux",
      "greenThreshold": 90,
      "redThreshold": 70,
      "greenText": "≥ 90 %",
      "orangeText": "de 70 à < 90 %",
      "redText": "< 70 %",
      "dataOwner": "CNED / PMO",
      "kpiOwner": "CNED / PMO",
      "targetFrequency": "Mensuelle",
      "dataSources": "Blocages_Institutionnels",
      "justification": "Sans responsable, un blocage ne se débloque pas.",
      "roleAccess": [
        null,
        "R",
        "V",
        null,
        null,
        null
      ]
    },
    {
      "id": "GV2",
      "familyLabel": "GV – Gouvernance",
      "name": "Avenants en attente de visa (CSM)",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "calculability": "Partiel (extraction texte)",
      "definition": "Ancienneté de l'avenant le plus ancien non visé par la Commission sectorielle des marchés ; le nombre est affiché à côté.",
      "formula": "Date de référence − date de dépôt de l'avenant non visé le plus ancien (jours)",
      "unit": "j",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 60,
      "redThreshold": 120,
      "greenText": "≤ 60 j",
      "orangeText": "> 60 à 120 j",
      "redText": "> 120 j",
      "dataOwner": "MO / CNED",
      "kpiOwner": "MO / CNED",
      "targetFrequency": "Mensuelle",
      "dataSources": "Avenants",
      "justification": "Goulot documenté dans le PDF (visa avec réserves, ajournements).",
      "roleAccess": [
        "V",
        "R",
        "S",
        null,
        "V",
        "V"
      ]
    },
    {
      "id": "GV3",
      "familyLabel": "GV – Gouvernance",
      "name": "Arbitrages échus",
      "importanceLabel": "[A]",
      "phase": "V2",
      "calculability": "Saisie requise",
      "definition": "Part des projets actifs avec un arbitrage ayant dépassé son échéance.",
      "formula": "Projets avec arbitrage échu ÷ projets actifs × 100",
      "unit": "%",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 10,
      "redThreshold": 25,
      "greenText": "≤ 10 %",
      "orangeText": "> 10 à 25 %",
      "redText": "> 25 %",
      "dataOwner": "CNED",
      "kpiOwner": "CNED",
      "targetFrequency": "Mensuelle",
      "dataSources": "Decisions_Arbitrages",
      "justification": "Utile quand le registre de décisions sera alimenté.",
      "roleAccess": [
        "V",
        "R",
        "V",
        null,
        null,
        null
      ]
    },
    {
      "id": "GV4",
      "familyLabel": "GV – Gouvernance",
      "name": "Réceptions en attente",
      "importanceLabel": "[A]",
      "phase": "MVP",
      "calculability": "Partiel (extraction texte)",
      "definition": "Part des réceptions provisoires avec réserves non levées depuis plus de 6 mois.",
      "formula": "Réceptions avec réserves non levées > 6 mois ÷ réceptions provisoires × 100",
      "unit": "%",
      "directionLabel": "Plus bas = mieux",
      "greenThreshold": 0,
      "redThreshold": 25,
      "greenText": "≤ 0 %",
      "orangeText": "> 0 à 25 %",
      "redText": "> 25 %",
      "dataOwner": "MO",
      "kpiOwner": "MO",
      "targetFrequency": "Mensuelle",
      "dataSources": "Receptions (à créer)",
      "justification": "Affine le suivi de clôture ; non bloquant pour le pilote.",
      "roleAccess": [
        null,
        "V",
        "R",
        "V",
        null,
        null
      ]
    }
  ],
  "alertRules": [
    {
      "id": "AL01",
      "name": "Avant-coureur d'abandon",
      "level": "ROUGE",
      "importanceLabel": "[A]",
      "phase": "V2",
      "condition": "Retard de paiement > 60 j ET (cadence récente < 0,70 OU mobilisation < 70 %)",
      "logic": "C1 ET (C2 OU C3)",
      "conditions": [
        {
          "field": "FI6",
          "op": ">",
          "threshold": 60
        },
        {
          "field": "AV3",
          "op": "<",
          "threshold": 0.7
        },
        {
          "field": "PP2",
          "op": "<",
          "threshold": 70
        }
      ],
      "recipient": "MO + CNED",
      "action": "Revue contractuelle immédiate ; plan de continuité",
      "frequency": "Hebdomadaire",
      "origin": "AL01 (modifiée)",
      "change": "Seuil de paiement 180 j → 60 j (aligné sur FI6) ; condition « ODS refusé » (non modélisée) supprimée ; trois ET remplacés par ET + OU pour qu'elle se déclenche avant l'abandon et non après.",
      "roleAccess": [
        "I",
        "D",
        "D",
        null,
        null,
        null
      ]
    },
    {
      "id": "AL02",
      "name": "Emprise bloquée critique",
      "level": "ROUGE",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "condition": "Emprise libérée < 50 % ET délai consommé > 60 % ET aucun plan de déblocage validé",
      "logic": "C1 ET C2 ET C3",
      "conditions": [
        {
          "field": "QR1",
          "op": "<",
          "threshold": 50
        },
        {
          "field": "DL1",
          "op": ">",
          "threshold": 60
        },
        {
          "field": "Blocage.Plan_Valide",
          "op": "=",
          "threshold": "Non"
        }
      ],
      "recipient": "MO + CNED + responsable territorial",
      "action": "Escalade institutionnelle",
      "frequency": "Mensuelle",
      "origin": "AL02",
      "change": "Conditions inchangées, désormais reliées à QR1 (qui existe maintenant comme KPI).",
      "roleAccess": [
        "I",
        "D",
        "D",
        null,
        null,
        null
      ]
    },
    {
      "id": "AL03",
      "name": "Étranglement financier",
      "level": "ROUGE",
      "importanceLabel": "[S]",
      "phase": "V2",
      "condition": "Couverture du reste à faire < 90 % ET (réévaluation en attente > 120 j OU couverture des CP < 80 %)",
      "logic": "C1 ET (C2 OU C3)",
      "conditions": [
        {
          "field": "FI2",
          "op": "<",
          "threshold": 90
        },
        {
          "field": "FI5",
          "op": ">",
          "threshold": 120
        },
        {
          "field": "FI3",
          "op": "<",
          "threshold": 80
        }
      ],
      "recipient": "Contrôleur budgétaire + CNED",
      "action": "Arbitrage financement / réévaluation",
      "frequency": "Mensuelle",
      "origin": "AL03 (modifiée)",
      "change": "« Engagement > 95 % » (qui n'est pas un signal de santé) remplacé par la couverture du reste à faire ; ajout des crédits de paiement.",
      "roleAccess": [
        "I",
        "D",
        "I",
        null,
        null,
        "D"
      ]
    },
    {
      "id": "AL04",
      "name": "Dégradation contractant",
      "level": "ORANGE",
      "importanceLabel": "[A]",
      "phase": "V2",
      "condition": "Baisse de santé du contractant > 10 pts en un mois ET mobilisation < 70 % ET retard de paiement > 60 j",
      "logic": "C1 ET C2 ET C3",
      "conditions": [
        {
          "field": "CO1 (variation mensuelle)",
          "op": "<",
          "threshold": -10
        },
        {
          "field": "PP2",
          "op": "<",
          "threshold": 70
        },
        {
          "field": "FI6",
          "op": ">",
          "threshold": 60
        }
      ],
      "recipient": "MO",
      "action": "Plan de redressement du contractant",
      "frequency": "Hebdomadaire",
      "origin": "AL04 (modifiée)",
      "change": "ISC, TMM et paiements remplacés par CO1, PP2 et FI6.",
      "roleAccess": [
        null,
        "I",
        "D",
        null,
        null,
        null
      ]
    },
    {
      "id": "AL05",
      "name": "Déblocage critique qui approche",
      "level": "ORANGE",
      "importanceLabel": "[A]",
      "phase": "V2",
      "condition": "Date de déblocage estimée dans ≤ 60 j ET blocage en cours ET plan non confirmé",
      "logic": "C1 ET C2 ET C3",
      "conditions": [
        {
          "field": "Blocage.Jours_avant_date_estimee",
          "op": "<=",
          "threshold": 60
        },
        {
          "field": "Blocage.Statut",
          "op": "=",
          "threshold": "Ouvert"
        },
        {
          "field": "Blocage.Plan_Confirme",
          "op": "=",
          "threshold": "Non"
        }
      ],
      "recipient": "MO + responsable du déblocage",
      "action": "Confirmer les actions et la date cible",
      "frequency": "Hebdomadaire",
      "origin": "AL05",
      "change": "Inchangée ; s'appuie sur les champs de la table des blocages (pas sur un KPI).",
      "roleAccess": [
        null,
        "I",
        "D",
        null,
        null,
        null
      ]
    },
    {
      "id": "AL06",
      "name": "Dérive de délai",
      "level": "ROUGE",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "condition": "Délai en vigueur dépassé ET indice d'avancement < 0,70 ET projet non achevé",
      "logic": "C1 ET C2 ET C3",
      "conditions": [
        {
          "field": "DL1",
          "op": ">",
          "threshold": 100
        },
        {
          "field": "AV2",
          "op": "<",
          "threshold": 0.7
        },
        {
          "field": "Projet.Statut",
          "op": "≠",
          "threshold": "Achevé"
        }
      ],
      "recipient": "MO + CNED",
      "action": "Plan de rattrapage",
      "frequency": "Mensuelle",
      "origin": "AL06 (modifiée)",
      "change": "« TAP < 90 % » remplacé par AV2 < 0,70 : l'ancienne règle se serait déclenchée sur une bonne quinzaine de fiches (saturation).",
      "roleAccess": [
        "I",
        "D",
        "D",
        null,
        "I",
        null
      ]
    },
    {
      "id": "AL07",
      "name": "Sous-performance physique",
      "level": "ORANGE",
      "importanceLabel": "[A]",
      "phase": "V2",
      "condition": "Indice d'avancement < 0,70 sur ≥ 2 périodes ET cadence récente < 0,70",
      "logic": "C1 ET C2",
      "conditions": [
        {
          "field": "AV2 (2 périodes)",
          "op": "<",
          "threshold": 0.7
        },
        {
          "field": "AV3",
          "op": "<",
          "threshold": 0.7
        }
      ],
      "recipient": "MO + contractant",
      "action": "Plan de rattrapage sous 7 jours",
      "frequency": "Mensuelle",
      "origin": "AL07 (modifiée)",
      "change": "Seuils reliés à AV2 et AV3.",
      "roleAccess": [
        null,
        "I",
        "D",
        null,
        "D",
        null
      ]
    },
    {
      "id": "AL08",
      "name": "Dérive d'AE",
      "level": "ROUGE",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "condition": "Dérive d'AE ajustée > 60 % ET réévaluation en attente > 60 j",
      "logic": "C1 ET C2",
      "conditions": [
        {
          "field": "FI4",
          "op": ">",
          "threshold": 60
        },
        {
          "field": "FI5",
          "op": ">",
          "threshold": 60
        }
      ],
      "recipient": "Finance + MO",
      "action": "Analyse des causes et sécurisation de l'AE",
      "frequency": "Mensuelle",
      "origin": "AL08 (modifiée)",
      "change": "Seuil 15 % → 60 % (à 15 %, 20 projets sur 24 se déclenchaient) ; condition « impact délai > 60 j » retirée.",
      "roleAccess": [
        "I",
        "I",
        "D",
        null,
        null,
        "D"
      ]
    },
    {
      "id": "AL09",
      "name": "NC critique persistante",
      "level": "ROUGE",
      "importanceLabel": "[A]",
      "phase": "V2",
      "condition": "NC critique ouverte > 30 j ET action corrective non validée",
      "logic": "C1 ET C2",
      "conditions": [
        {
          "field": "QR7",
          "op": ">",
          "threshold": 30
        },
        {
          "field": "NC.Action_Validee",
          "op": "=",
          "threshold": "Non"
        }
      ],
      "recipient": "BET + MO",
      "action": "Action corrective immédiate",
      "frequency": "Hebdomadaire",
      "origin": "AL09",
      "change": "Inchangée ; reliée à QR7.",
      "roleAccess": [
        null,
        "I",
        "D",
        "D",
        "I",
        null
      ]
    },
    {
      "id": "AL10",
      "name": "Responsable de blocage absent",
      "level": "ORANGE",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "condition": "Blocage ouvert > 30 j ET responsable vide",
      "logic": "C1 ET C2",
      "conditions": [
        {
          "field": "Blocage.Age_jours",
          "op": ">",
          "threshold": 30
        },
        {
          "field": "Blocage.Responsable",
          "op": "=",
          "threshold": "Vide"
        }
      ],
      "recipient": "CNED / PMO",
      "action": "Nommer un responsable et une date cible",
      "frequency": "Mensuelle",
      "origin": "AL10",
      "change": "Inchangée ; alimente GV1.",
      "roleAccess": [
        null,
        "D",
        "I",
        null,
        null,
        null
      ]
    },
    {
      "id": "AL11",
      "name": "Paiement anormalement lent",
      "level": "ROUGE",
      "importanceLabel": "[A]",
      "phase": "V2",
      "condition": "Retard de paiement des situations > 60 j OU situation individuelle > 90 j",
      "logic": "C1 OU C2",
      "conditions": [
        {
          "field": "FI6",
          "op": ">",
          "threshold": 60
        },
        {
          "field": "Situation.Age_jours",
          "op": ">",
          "threshold": 90
        }
      ],
      "recipient": "Finance + MO",
      "action": "Identifier la cause et fixer une date de paiement",
      "frequency": "Hebdomadaire",
      "origin": "AL11 (modifiée)",
      "change": "Niveau ORANGE → ROUGE pour être cohérent avec le seuil Rouge de FI6 (> 60 j).",
      "roleAccess": [
        null,
        "I",
        "D",
        null,
        "I",
        "D"
      ]
    },
    {
      "id": "AL12",
      "name": "Maturation critique",
      "level": "ORANGE",
      "importanceLabel": "[A]",
      "phase": "V2",
      "condition": "Modification de consistance en cours ET avancement < 50 % ET avenant en préparation",
      "logic": "C1 ET C2 ET C3",
      "conditions": [
        {
          "field": "QR6",
          "op": "=",
          "threshold": "Oui"
        },
        {
          "field": "AV1",
          "op": "<",
          "threshold": 50
        },
        {
          "field": "Avenant.Statut",
          "op": "=",
          "threshold": "En préparation"
        }
      ],
      "recipient": "MO + BET",
      "action": "Revue technique du périmètre",
      "frequency": "Mensuelle",
      "origin": "AL12 (modifiée)",
      "change": "Reliée à QR6 et AV1.",
      "roleAccess": [
        null,
        "I",
        "D",
        "D",
        null,
        null
      ]
    },
    {
      "id": "AL13",
      "name": "Dérive de délai extrême",
      "level": "ORANGE",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "condition": "Délai en vigueur > 2 × le délai initial ET délai en vigueur dépassé",
      "logic": "C1 ET C2",
      "conditions": [
        {
          "field": "DL2",
          "op": ">",
          "threshold": 2
        },
        {
          "field": "DL1",
          "op": ">",
          "threshold": 100
        }
      ],
      "recipient": "CNED",
      "action": "Revue contractuelle : poursuite, résiliation ou réengagement",
      "frequency": "Mensuelle",
      "origin": "Nouvelle",
      "change": "Couvre la pathologie n°1 du portefeuille (ex. 24 mois devenus 110), sans règle dédiée auparavant.",
      "roleAccess": [
        "I",
        "D",
        "I",
        null,
        null,
        null
      ]
    },
    {
      "id": "AL14",
      "name": "Avenant bloqué au visa",
      "level": "ORANGE",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "condition": "Avenant non visé par la CSM depuis plus de 120 j",
      "logic": "C1",
      "conditions": [
        {
          "field": "GV2",
          "op": ">",
          "threshold": 120
        }
      ],
      "recipient": "MO + CNED",
      "action": "Relancer la CSM ; lever les réserves",
      "frequency": "Mensuelle",
      "origin": "Nouvelle",
      "change": "Goulot très présent dans les fiches (visa avec réserves, ajournements).",
      "roleAccess": [
        null,
        "D",
        "D",
        null,
        "I",
        null
      ]
    },
    {
      "id": "AL15",
      "name": "Arrêt prolongé",
      "level": "ROUGE",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "condition": "Temps perdu à l'arrêt > 15 % OU arrêt en cours depuis > 60 j",
      "logic": "C1 OU C2",
      "conditions": [
        {
          "field": "QR4",
          "op": ">",
          "threshold": 15
        },
        {
          "field": "Projet.Arret_en_cours_jours",
          "op": ">",
          "threshold": 60
        }
      ],
      "recipient": "CNED + MO",
      "action": "Plan de reprise ; sécuriser les travaux déjà réalisés",
      "frequency": "Mensuelle",
      "origin": "Nouvelle",
      "change": "Les projets à l'arrêt (Skikda, Ténès, Guelma…) n'avaient aucune règle dédiée.",
      "roleAccess": [
        "I",
        "D",
        "D",
        null,
        "I",
        null
      ]
    },
    {
      "id": "AL16",
      "name": "Données peu fiables",
      "level": "ORANGE",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "condition": "Fraîcheur > 2 OU cohérence : anomalies > 20 % des projets",
      "logic": "C1 OU C2",
      "conditions": [
        {
          "field": "DO1",
          "op": ">",
          "threshold": 2
        },
        {
          "field": "DO3",
          "op": ">",
          "threshold": 20
        }
      ],
      "recipient": "PMO",
      "action": "Corriger / valider les données avant diffusion des KPI",
      "frequency": "Mensuelle",
      "origin": "Nouvelle",
      "change": "Empêche de tirer des conclusions sur des KPI calculés sur des données périmées ou incohérentes.",
      "roleAccess": [
        null,
        "D",
        "I",
        "I",
        null,
        null
      ]
    },
    {
      "id": "AL17",
      "name": "Blocage ancien",
      "level": "ORANGE",
      "importanceLabel": "[M]",
      "phase": "MVP",
      "condition": "Âge médian des blocages ouverts > 90 j",
      "logic": "C1",
      "conditions": [
        {
          "field": "QR3",
          "op": ">",
          "threshold": 90
        }
      ],
      "recipient": "CNED / PMO",
      "action": "Escalade au niveau décisionnel",
      "frequency": "Mensuelle",
      "origin": "Nouvelle",
      "change": "Complète AL10 : AL10 vise l'absence de responsable, AL17 la stagnation.",
      "roleAccess": [
        "I",
        "D",
        null,
        null,
        null,
        null
      ]
    }
  ],
  "glossary": [
    {
      "term": "AE",
      "meaning": "Autorisation d'engagement : enveloppe financière autorisant à engager une opération."
    },
    {
      "term": "CP",
      "meaning": "Crédits de paiement : crédits annuels permettant de payer les situations."
    },
    {
      "term": "TAP",
      "meaning": "Taux d'avancement physique."
    },
    {
      "term": "TAF",
      "meaning": "Taux d'avancement financier (consommation financière des travaux)."
    },
    {
      "term": "MO",
      "meaning": "Maître d'ouvrage. (Dans le modèle de données, la main-d'œuvre doit s'écrire « Main_Oeuvre » pour éviter toute confusion.)"
    },
    {
      "term": "BET",
      "meaning": "Bureau d'études (contrôle et surveillance des travaux)."
    },
    {
      "term": "ODS",
      "meaning": "Ordre de service (démarrage, arrêt, reprise)."
    },
    {
      "term": "CSM",
      "meaning": "Commission sectorielle des marchés (visa des marchés et avenants)."
    },
    {
      "term": "CNED",
      "meaning": "Caisse Nationale d'Équipement pour le Développement."
    },
    {
      "term": "PMO",
      "meaning": "Bureau de pilotage de projet (Project Monitoring Office)."
    },
    {
      "term": "PPC",
      "meaning": "Pourcentage de plan complété : fiabilité du planning hebdomadaire (approche Last Planner)."
    },
    {
      "term": "STE",
      "meaning": "Signalisation, télécommunication, énergie (lot système ferroviaire)."
    },
    {
      "term": "Délai en vigueur",
      "meaning": "Délai contractuel après prise en compte de tous les avenants."
    },
    {
      "term": "Reste à faire",
      "meaning": "Coût estimé des travaux restant à exécuter."
    },
    {
      "term": "Emprise",
      "meaning": "Terrain à libérer pour réaliser le projet (expropriation, déplacement de réseaux)."
    },
    {
      "term": "Parachèvement",
      "meaning": "Marché conclu pour terminer les travaux après résiliation du marché initial."
    }
  ]
};
