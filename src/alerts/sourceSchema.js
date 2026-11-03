/**
 * Auxiliary source contract for fields referenced by 02_Regles_Alertes.
 * These fields are optional in the demo dataset. Absence remains undefined and
 * is never replaced with a default value.
 *
 * Populate on a project as `alertSources` with the exact nested structure below.
 * Historical KPI samples belong in `alertHistory`, keyed by KPI id.
 */
export const ALERT_SOURCE_FIELD_SCHEMA = Object.freeze({
  'Blocage.id': { type: 'string', optional: true, source: 'Blocages_Institutionnels', requiredBy: ['AL02', 'AL05', 'AL10'] },
  'NC.id': { type: 'string', optional: true, source: 'NonConformites', requiredBy: ['AL09'] },
  'Situation.id': { type: 'string', optional: true, source: 'Situations_Facturations', requiredBy: ['AL11'] },
  'Avenant.id': { type: 'string', optional: true, source: 'Avenants', requiredBy: ['AL12'] },
  'contractId': { type: 'string', optional: true, source: 'Marches', requiredBy: ['AL01', 'AL03', 'AL08', 'AL11', 'AL14'] },
  'Blocage.Plan_Valide': { type: 'boolean-or-label', accepted: [true, false, 'Oui', 'Non'], source: 'Blocages_Institutionnels', requiredBy: ['AL02'] },
  'Blocage.Jours_avant_date_estimee': { type: 'number', unit: 'jours', source: 'Blocages_Institutionnels', requiredBy: ['AL05'] },
  'Blocage.Statut': { type: 'string', accepted: ['Ouvert', 'Clos'], source: 'Blocages_Institutionnels', requiredBy: ['AL05'] },
  'Blocage.Plan_Confirme': { type: 'boolean-or-label', accepted: [true, false, 'Oui', 'Non'], source: 'Blocages_Institutionnels', requiredBy: ['AL05'] },
  'Blocage.Age_jours': { type: 'number', unit: 'jours', source: 'Blocages_Institutionnels', requiredBy: ['AL10'] },
  'Blocage.Responsable': { type: 'string', emptyAllowed: true, source: 'Blocages_Institutionnels', requiredBy: ['AL10'] },
  'NC.Action_Validee': { type: 'boolean-or-label', accepted: [true, false, 'Oui', 'Non'], source: 'NonConformites', requiredBy: ['AL09'] },
  'Situation.Age_jours': { type: 'number', unit: 'jours', source: 'Situations_Facturations', requiredBy: ['AL11'] },
  'Avenant.Statut': { type: 'string', accepted: ['En préparation', 'Validé', 'Rejeté'], source: 'Avenants', requiredBy: ['AL12'] },
  'Projet.Statut': { type: 'string', accepted: ['Achevé', 'En cours'], source: 'Projets', requiredBy: ['AL06'] },
  'Projet.Arret_en_cours_jours': { type: 'number', unit: 'jours', source: 'ODS_Arret / Journal_Chantier', requiredBy: ['AL15'] }
});

export const ALERT_HISTORY_SCHEMA = Object.freeze({
  CO1: { type: 'number[]', semantics: 'monthly contractor-health observations; last two values determine variation', requiredBy: ['AL04'] },
  AV2: { type: 'number[]', semantics: 'progress-index observations by period; last two periods are tested', requiredBy: ['AL07'] }
});
