/* Generated from workbook sheets 02_Regles_Alertes and 03_Matrice_Roles. Preserve source wording and thresholds. */
const freezeTree = (value) => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freezeTree);
    Object.freeze(value);
  }
  return value;
};
export const ALERT_RULES = Object.freeze([
  {
    "id": "AL01",
    "name": "Avant-coureur d'abandon",
    "severity": "ROUGE",
    "importance": "A",
    "phase": "V2",
    "readableCondition": "Retard de paiement > 60 j ET (cadence récente < 0,70 OU mobilisation < 70 %)",
    "logic": "C1 ET (C2 OU C3)",
    "conditions": [
      {
        "id": "C1",
        "field": "FI6",
        "operator": ">",
        "value": 60,
        "temporal": null
      },
      {
        "id": "C2",
        "field": "AV3",
        "operator": "<",
        "value": 0.7,
        "temporal": null
      },
      {
        "id": "C3",
        "field": "PP2",
        "operator": "<",
        "value": 70,
        "temporal": null
      }
    ],
    "expression": {
      "all": [
        {
          "condition": "C1"
        },
        {
          "any": [
            {
              "condition": "C2"
            },
            {
              "condition": "C3"
            }
          ]
        }
      ]
    },
    "intendedRecipients": "MO + CNED",
    "requiredAction": "Revue contractuelle immédiate ; plan de continuité",
    "frequency": "Hebdomadaire",
    "origin": "AL01 (modifiée)",
    "notes": "Seuil de paiement 180 j → 60 j (aligné sur FI6) ; condition « ODS refusé » (non modélisée) supprimée ; trois ET remplacés par ET + OU pour qu'elle se déclenche avant l'abandon et non après.",
    "recipientRoles": [
      {
        "excelRole": "direction",
        "code": "I",
        "persona": "dg",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "pmo",
        "code": "D",
        "persona": "pmo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "mo",
        "code": "D",
        "persona": "mo",
        "mappingStatus": "mapped"
      }
    ]
  },
  {
    "id": "AL02",
    "name": "Emprise bloquée critique",
    "severity": "ROUGE",
    "importance": "M",
    "phase": "MVP",
    "readableCondition": "Emprise libérée < 50 % ET délai consommé > 60 % ET aucun plan de déblocage validé",
    "logic": "C1 ET C2 ET C3",
    "conditions": [
      {
        "id": "C1",
        "field": "QR1",
        "operator": "<",
        "value": 50,
        "temporal": null
      },
      {
        "id": "C2",
        "field": "DL1",
        "operator": ">",
        "value": 60,
        "temporal": null
      },
      {
        "id": "C3",
        "field": "Blocage.Plan_Valide",
        "operator": "=",
        "value": "Non",
        "temporal": null
      }
    ],
    "expression": {
      "all": [
        {
          "all": [
            {
              "condition": "C1"
            },
            {
              "condition": "C2"
            }
          ]
        },
        {
          "condition": "C3"
        }
      ]
    },
    "intendedRecipients": "MO + CNED + responsable territorial",
    "requiredAction": "Escalade institutionnelle",
    "frequency": "Mensuelle",
    "origin": "AL02",
    "notes": "Conditions inchangées, désormais reliées à QR1 (qui existe maintenant comme KPI).",
    "recipientRoles": [
      {
        "excelRole": "direction",
        "code": "I",
        "persona": "dg",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "pmo",
        "code": "D",
        "persona": "pmo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "mo",
        "code": "D",
        "persona": "mo",
        "mappingStatus": "mapped"
      }
    ]
  },
  {
    "id": "AL03",
    "name": "Étranglement financier",
    "severity": "ROUGE",
    "importance": "S",
    "phase": "V2",
    "readableCondition": "Couverture du reste à faire < 90 % ET (réévaluation en attente > 120 j OU couverture des CP < 80 %)",
    "logic": "C1 ET (C2 OU C3)",
    "conditions": [
      {
        "id": "C1",
        "field": "FI2",
        "operator": "<",
        "value": 90,
        "temporal": null
      },
      {
        "id": "C2",
        "field": "FI5",
        "operator": ">",
        "value": 120,
        "temporal": null
      },
      {
        "id": "C3",
        "field": "FI3",
        "operator": "<",
        "value": 80,
        "temporal": null
      }
    ],
    "expression": {
      "all": [
        {
          "condition": "C1"
        },
        {
          "any": [
            {
              "condition": "C2"
            },
            {
              "condition": "C3"
            }
          ]
        }
      ]
    },
    "intendedRecipients": "Contrôleur budgétaire + CNED",
    "requiredAction": "Arbitrage financement / réévaluation",
    "frequency": "Mensuelle",
    "origin": "AL03 (modifiée)",
    "notes": "« Engagement > 95 % » (qui n'est pas un signal de santé) remplacé par la couverture du reste à faire ; ajout des crédits de paiement.",
    "recipientRoles": [
      {
        "excelRole": "direction",
        "code": "I",
        "persona": "dg",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "pmo",
        "code": "D",
        "persona": "pmo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "mo",
        "code": "I",
        "persona": "mo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "budgetController",
        "code": "D",
        "persona": "finance",
        "mappingStatus": "mapped"
      }
    ]
  },
  {
    "id": "AL04",
    "name": "Dégradation contractant",
    "severity": "ORANGE",
    "importance": "A",
    "phase": "V2",
    "readableCondition": "Baisse de santé du contractant > 10 pts en un mois ET mobilisation < 70 % ET retard de paiement > 60 j",
    "logic": "C1 ET C2 ET C3",
    "conditions": [
      {
        "id": "C1",
        "field": "CO1 (variation mensuelle)",
        "operator": "<",
        "value": -10,
        "temporal": {
          "temporal": "variation",
          "window": "1 month"
        }
      },
      {
        "id": "C2",
        "field": "PP2",
        "operator": "<",
        "value": 70,
        "temporal": null
      },
      {
        "id": "C3",
        "field": "FI6",
        "operator": ">",
        "value": 60,
        "temporal": null
      }
    ],
    "expression": {
      "all": [
        {
          "all": [
            {
              "condition": "C1"
            },
            {
              "condition": "C2"
            }
          ]
        },
        {
          "condition": "C3"
        }
      ]
    },
    "intendedRecipients": "MO",
    "requiredAction": "Plan de redressement du contractant",
    "frequency": "Hebdomadaire",
    "origin": "AL04 (modifiée)",
    "notes": "ISC, TMM et paiements remplacés par CO1, PP2 et FI6.",
    "recipientRoles": [
      {
        "excelRole": "pmo",
        "code": "I",
        "persona": "pmo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "mo",
        "code": "D",
        "persona": "mo",
        "mappingStatus": "mapped"
      }
    ]
  },
  {
    "id": "AL05",
    "name": "Déblocage critique qui approche",
    "severity": "ORANGE",
    "importance": "A",
    "phase": "V2",
    "readableCondition": "Date de déblocage estimée dans ≤ 60 j ET blocage en cours ET plan non confirmé",
    "logic": "C1 ET C2 ET C3",
    "conditions": [
      {
        "id": "C1",
        "field": "Blocage.Jours_avant_date_estimee",
        "operator": "<=",
        "value": 60,
        "temporal": null
      },
      {
        "id": "C2",
        "field": "Blocage.Statut",
        "operator": "=",
        "value": "Ouvert",
        "temporal": null
      },
      {
        "id": "C3",
        "field": "Blocage.Plan_Confirme",
        "operator": "=",
        "value": "Non",
        "temporal": null
      }
    ],
    "expression": {
      "all": [
        {
          "all": [
            {
              "condition": "C1"
            },
            {
              "condition": "C2"
            }
          ]
        },
        {
          "condition": "C3"
        }
      ]
    },
    "intendedRecipients": "MO + responsable du déblocage",
    "requiredAction": "Confirmer les actions et la date cible",
    "frequency": "Hebdomadaire",
    "origin": "AL05",
    "notes": "Inchangée ; s'appuie sur les champs de la table des blocages (pas sur un KPI).",
    "recipientRoles": [
      {
        "excelRole": "pmo",
        "code": "I",
        "persona": "pmo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "mo",
        "code": "D",
        "persona": "mo",
        "mappingStatus": "mapped"
      }
    ]
  },
  {
    "id": "AL06",
    "name": "Dérive de délai",
    "severity": "ROUGE",
    "importance": "M",
    "phase": "MVP",
    "readableCondition": "Délai en vigueur dépassé ET indice d'avancement < 0,70 ET projet non achevé",
    "logic": "C1 ET C2 ET C3",
    "conditions": [
      {
        "id": "C1",
        "field": "DL1",
        "operator": ">",
        "value": 100,
        "temporal": null
      },
      {
        "id": "C2",
        "field": "AV2",
        "operator": "<",
        "value": 0.7,
        "temporal": null
      },
      {
        "id": "C3",
        "field": "Projet.Statut",
        "operator": "≠",
        "value": "Achevé",
        "temporal": null
      }
    ],
    "expression": {
      "all": [
        {
          "all": [
            {
              "condition": "C1"
            },
            {
              "condition": "C2"
            }
          ]
        },
        {
          "condition": "C3"
        }
      ]
    },
    "intendedRecipients": "MO + CNED",
    "requiredAction": "Plan de rattrapage",
    "frequency": "Mensuelle",
    "origin": "AL06 (modifiée)",
    "notes": "« TAP < 90 % » remplacé par AV2 < 0,70 : l'ancienne règle se serait déclenchée sur une bonne quinzaine de fiches (saturation).",
    "recipientRoles": [
      {
        "excelRole": "direction",
        "code": "I",
        "persona": "dg",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "pmo",
        "code": "D",
        "persona": "pmo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "mo",
        "code": "D",
        "persona": "mo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "contractor",
        "code": "I",
        "persona": null,
        "mappingStatus": "unmapped"
      }
    ]
  },
  {
    "id": "AL07",
    "name": "Sous-performance physique",
    "severity": "ORANGE",
    "importance": "A",
    "phase": "V2",
    "readableCondition": "Indice d'avancement < 0,70 sur ≥ 2 périodes ET cadence récente < 0,70",
    "logic": "C1 ET C2",
    "conditions": [
      {
        "id": "C1",
        "field": "AV2 (2 périodes)",
        "operator": "<",
        "value": 0.7,
        "temporal": {
          "temporal": "consecutive_periods",
          "minimumPeriods": 2
        }
      },
      {
        "id": "C2",
        "field": "AV3",
        "operator": "<",
        "value": 0.7,
        "temporal": null
      }
    ],
    "expression": {
      "all": [
        {
          "condition": "C1"
        },
        {
          "condition": "C2"
        }
      ]
    },
    "intendedRecipients": "MO + contractant",
    "requiredAction": "Plan de rattrapage sous 7 jours",
    "frequency": "Mensuelle",
    "origin": "AL07 (modifiée)",
    "notes": "Seuils reliés à AV2 et AV3.",
    "recipientRoles": [
      {
        "excelRole": "pmo",
        "code": "I",
        "persona": "pmo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "mo",
        "code": "D",
        "persona": "mo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "contractor",
        "code": "D",
        "persona": null,
        "mappingStatus": "unmapped"
      }
    ]
  },
  {
    "id": "AL08",
    "name": "Dérive d'AE",
    "severity": "ROUGE",
    "importance": "M",
    "phase": "MVP",
    "readableCondition": "Dérive d'AE ajustée > 60 % ET réévaluation en attente > 60 j",
    "logic": "C1 ET C2",
    "conditions": [
      {
        "id": "C1",
        "field": "FI4",
        "operator": ">",
        "value": 60,
        "temporal": null
      },
      {
        "id": "C2",
        "field": "FI5",
        "operator": ">",
        "value": 60,
        "temporal": null
      }
    ],
    "expression": {
      "all": [
        {
          "condition": "C1"
        },
        {
          "condition": "C2"
        }
      ]
    },
    "intendedRecipients": "Finance + MO",
    "requiredAction": "Analyse des causes et sécurisation de l'AE",
    "frequency": "Mensuelle",
    "origin": "AL08 (modifiée)",
    "notes": "Seuil 15 % → 60 % (à 15 %, 20 projets sur 24 se déclenchaient) ; condition « impact délai > 60 j » retirée.",
    "recipientRoles": [
      {
        "excelRole": "direction",
        "code": "I",
        "persona": "dg",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "pmo",
        "code": "I",
        "persona": "pmo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "mo",
        "code": "D",
        "persona": "mo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "budgetController",
        "code": "D",
        "persona": "finance",
        "mappingStatus": "mapped"
      }
    ]
  },
  {
    "id": "AL09",
    "name": "NC critique persistante",
    "severity": "ROUGE",
    "importance": "A",
    "phase": "V2",
    "readableCondition": "NC critique ouverte > 30 j ET action corrective non validée",
    "logic": "C1 ET C2",
    "conditions": [
      {
        "id": "C1",
        "field": "QR7",
        "operator": ">",
        "value": 30,
        "temporal": null
      },
      {
        "id": "C2",
        "field": "NC.Action_Validee",
        "operator": "=",
        "value": "Non",
        "temporal": null
      }
    ],
    "expression": {
      "all": [
        {
          "condition": "C1"
        },
        {
          "condition": "C2"
        }
      ]
    },
    "intendedRecipients": "BET + MO",
    "requiredAction": "Action corrective immédiate",
    "frequency": "Hebdomadaire",
    "origin": "AL09",
    "notes": "Inchangée ; reliée à QR7.",
    "recipientRoles": [
      {
        "excelRole": "pmo",
        "code": "I",
        "persona": "pmo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "mo",
        "code": "D",
        "persona": "mo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "bet",
        "code": "D",
        "persona": null,
        "mappingStatus": "unmapped"
      },
      {
        "excelRole": "contractor",
        "code": "I",
        "persona": null,
        "mappingStatus": "unmapped"
      }
    ]
  },
  {
    "id": "AL10",
    "name": "Responsable de blocage absent",
    "severity": "ORANGE",
    "importance": "M",
    "phase": "MVP",
    "readableCondition": "Blocage ouvert > 30 j ET responsable vide",
    "logic": "C1 ET C2",
    "conditions": [
      {
        "id": "C1",
        "field": "Blocage.Age_jours",
        "operator": ">",
        "value": 30,
        "temporal": null
      },
      {
        "id": "C2",
        "field": "Blocage.Responsable",
        "operator": "=",
        "value": "Vide",
        "temporal": null
      }
    ],
    "expression": {
      "all": [
        {
          "condition": "C1"
        },
        {
          "condition": "C2"
        }
      ]
    },
    "intendedRecipients": "CNED / PMO",
    "requiredAction": "Nommer un responsable et une date cible",
    "frequency": "Mensuelle",
    "origin": "AL10",
    "notes": "Inchangée ; alimente GV1.",
    "recipientRoles": [
      {
        "excelRole": "pmo",
        "code": "D",
        "persona": "pmo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "mo",
        "code": "I",
        "persona": "mo",
        "mappingStatus": "mapped"
      }
    ]
  },
  {
    "id": "AL11",
    "name": "Paiement anormalement lent",
    "severity": "ROUGE",
    "importance": "A",
    "phase": "V2",
    "readableCondition": "Retard de paiement des situations > 60 j OU situation individuelle > 90 j",
    "logic": "C1 OU C2",
    "conditions": [
      {
        "id": "C1",
        "field": "FI6",
        "operator": ">",
        "value": 60,
        "temporal": null
      },
      {
        "id": "C2",
        "field": "Situation.Age_jours",
        "operator": ">",
        "value": 90,
        "temporal": null
      }
    ],
    "expression": {
      "any": [
        {
          "condition": "C1"
        },
        {
          "condition": "C2"
        }
      ]
    },
    "intendedRecipients": "Finance + MO",
    "requiredAction": "Identifier la cause et fixer une date de paiement",
    "frequency": "Hebdomadaire",
    "origin": "AL11 (modifiée)",
    "notes": "Niveau ORANGE → ROUGE pour être cohérent avec le seuil Rouge de FI6 (> 60 j).",
    "recipientRoles": [
      {
        "excelRole": "pmo",
        "code": "I",
        "persona": "pmo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "mo",
        "code": "D",
        "persona": "mo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "contractor",
        "code": "I",
        "persona": null,
        "mappingStatus": "unmapped"
      },
      {
        "excelRole": "budgetController",
        "code": "D",
        "persona": "finance",
        "mappingStatus": "mapped"
      }
    ]
  },
  {
    "id": "AL12",
    "name": "Maturation critique",
    "severity": "ORANGE",
    "importance": "A",
    "phase": "V2",
    "readableCondition": "Modification de consistance en cours ET avancement < 50 % ET avenant en préparation",
    "logic": "C1 ET C2 ET C3",
    "conditions": [
      {
        "id": "C1",
        "field": "QR6",
        "operator": "=",
        "value": "Oui",
        "temporal": null
      },
      {
        "id": "C2",
        "field": "AV1",
        "operator": "<",
        "value": 50,
        "temporal": null
      },
      {
        "id": "C3",
        "field": "Avenant.Statut",
        "operator": "=",
        "value": "En préparation",
        "temporal": null
      }
    ],
    "expression": {
      "all": [
        {
          "all": [
            {
              "condition": "C1"
            },
            {
              "condition": "C2"
            }
          ]
        },
        {
          "condition": "C3"
        }
      ]
    },
    "intendedRecipients": "MO + BET",
    "requiredAction": "Revue technique du périmètre",
    "frequency": "Mensuelle",
    "origin": "AL12 (modifiée)",
    "notes": "Reliée à QR6 et AV1.",
    "recipientRoles": [
      {
        "excelRole": "pmo",
        "code": "I",
        "persona": "pmo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "mo",
        "code": "D",
        "persona": "mo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "bet",
        "code": "D",
        "persona": null,
        "mappingStatus": "unmapped"
      }
    ]
  },
  {
    "id": "AL13",
    "name": "Dérive de délai extrême",
    "severity": "ORANGE",
    "importance": "M",
    "phase": "MVP",
    "readableCondition": "Délai en vigueur > 2 × le délai initial ET délai en vigueur dépassé",
    "logic": "C1 ET C2",
    "conditions": [
      {
        "id": "C1",
        "field": "DL2",
        "operator": ">",
        "value": 2,
        "temporal": null
      },
      {
        "id": "C2",
        "field": "DL1",
        "operator": ">",
        "value": 100,
        "temporal": null
      }
    ],
    "expression": {
      "all": [
        {
          "condition": "C1"
        },
        {
          "condition": "C2"
        }
      ]
    },
    "intendedRecipients": "CNED",
    "requiredAction": "Revue contractuelle : poursuite, résiliation ou réengagement",
    "frequency": "Mensuelle",
    "origin": "Nouvelle",
    "notes": "Couvre la pathologie n°1 du portefeuille (ex. 24 mois devenus 110), sans règle dédiée auparavant.",
    "recipientRoles": [
      {
        "excelRole": "direction",
        "code": "I",
        "persona": "dg",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "pmo",
        "code": "D",
        "persona": "pmo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "mo",
        "code": "I",
        "persona": "mo",
        "mappingStatus": "mapped"
      }
    ]
  },
  {
    "id": "AL14",
    "name": "Avenant bloqué au visa",
    "severity": "ORANGE",
    "importance": "M",
    "phase": "MVP",
    "readableCondition": "Avenant non visé par la CSM depuis plus de 120 j",
    "logic": "C1",
    "conditions": [
      {
        "id": "C1",
        "field": "GV2",
        "operator": ">",
        "value": 120,
        "temporal": null
      }
    ],
    "expression": {
      "condition": "C1"
    },
    "intendedRecipients": "MO + CNED",
    "requiredAction": "Relancer la CSM ; lever les réserves",
    "frequency": "Mensuelle",
    "origin": "Nouvelle",
    "notes": "Goulot très présent dans les fiches (visa avec réserves, ajournements).",
    "recipientRoles": [
      {
        "excelRole": "pmo",
        "code": "D",
        "persona": "pmo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "mo",
        "code": "D",
        "persona": "mo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "contractor",
        "code": "I",
        "persona": null,
        "mappingStatus": "unmapped"
      }
    ]
  },
  {
    "id": "AL15",
    "name": "Arrêt prolongé",
    "severity": "ROUGE",
    "importance": "M",
    "phase": "MVP",
    "readableCondition": "Temps perdu à l'arrêt > 15 % OU arrêt en cours depuis > 60 j",
    "logic": "C1 OU C2",
    "conditions": [
      {
        "id": "C1",
        "field": "QR4",
        "operator": ">",
        "value": 15,
        "temporal": null
      },
      {
        "id": "C2",
        "field": "Projet.Arret_en_cours_jours",
        "operator": ">",
        "value": 60,
        "temporal": null
      }
    ],
    "expression": {
      "any": [
        {
          "condition": "C1"
        },
        {
          "condition": "C2"
        }
      ]
    },
    "intendedRecipients": "CNED + MO",
    "requiredAction": "Plan de reprise ; sécuriser les travaux déjà réalisés",
    "frequency": "Mensuelle",
    "origin": "Nouvelle",
    "notes": "Les projets à l'arrêt (Skikda, Ténès, Guelma…) n'avaient aucune règle dédiée.",
    "recipientRoles": [
      {
        "excelRole": "direction",
        "code": "I",
        "persona": "dg",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "pmo",
        "code": "D",
        "persona": "pmo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "mo",
        "code": "D",
        "persona": "mo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "contractor",
        "code": "I",
        "persona": null,
        "mappingStatus": "unmapped"
      }
    ]
  },
  {
    "id": "AL16",
    "name": "Données peu fiables",
    "severity": "ORANGE",
    "importance": "M",
    "phase": "MVP",
    "readableCondition": "Fraîcheur > 2 OU cohérence : anomalies > 20 % des projets",
    "logic": "C1 OU C2",
    "conditions": [
      {
        "id": "C1",
        "field": "DO1",
        "operator": ">",
        "value": 2,
        "temporal": null
      },
      {
        "id": "C2",
        "field": "DO3",
        "operator": ">",
        "value": 20,
        "temporal": null
      }
    ],
    "expression": {
      "any": [
        {
          "condition": "C1"
        },
        {
          "condition": "C2"
        }
      ]
    },
    "intendedRecipients": "PMO",
    "requiredAction": "Corriger / valider les données avant diffusion des KPI",
    "frequency": "Mensuelle",
    "origin": "Nouvelle",
    "notes": "Empêche de tirer des conclusions sur des KPI calculés sur des données périmées ou incohérentes.",
    "recipientRoles": [
      {
        "excelRole": "pmo",
        "code": "D",
        "persona": "pmo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "mo",
        "code": "I",
        "persona": "mo",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "bet",
        "code": "I",
        "persona": null,
        "mappingStatus": "unmapped"
      }
    ]
  },
  {
    "id": "AL17",
    "name": "Blocage ancien",
    "severity": "ORANGE",
    "importance": "M",
    "phase": "MVP",
    "readableCondition": "Âge médian des blocages ouverts > 90 j",
    "logic": "C1",
    "conditions": [
      {
        "id": "C1",
        "field": "QR3",
        "operator": ">",
        "value": 90,
        "temporal": null
      }
    ],
    "expression": {
      "condition": "C1"
    },
    "intendedRecipients": "CNED / PMO",
    "requiredAction": "Escalade au niveau décisionnel",
    "frequency": "Mensuelle",
    "origin": "Nouvelle",
    "notes": "Complète AL10 : AL10 vise l'absence de responsable, AL17 la stagnation.",
    "recipientRoles": [
      {
        "excelRole": "direction",
        "code": "I",
        "persona": "dg",
        "mappingStatus": "mapped"
      },
      {
        "excelRole": "pmo",
        "code": "D",
        "persona": "pmo",
        "mappingStatus": "mapped"
      }
    ]
  }
].map((rule) => freezeTree(rule)));
export const ALERT_RULE_IDS = Object.freeze(ALERT_RULES.map((rule) => rule.id));
