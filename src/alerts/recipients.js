import { ALERT_RULES } from './ruleRegistry.js';
import { EXCEL_ROLE_TO_PERSONA_MAP } from '../roles/roleReference.js';

// Single source: src/roles/roleReference.js (BET and Contractant map to null, deliberately).
export const EXCEL_ROLE_TO_PERSONA = EXCEL_ROLE_TO_PERSONA_MAP;

export const RECIPIENT_MAPPING_GAPS = Object.freeze(ALERT_RULES.flatMap((rule) =>
  rule.recipientRoles.filter((recipient) => !recipient.persona).map((recipient) => ({
    ruleId: rule.id,
    ruleName: rule.name,
    excelRole: recipient.excelRole,
    code: recipient.code,
    reason: 'Aucun persona équivalent dans les six personas TAQADDUM actuels.'
  }))
));

export function getRuleRecipients(rule, personaId = null) {
  const recipients = rule.recipientRoles.map((recipient) => ({
    ...recipient,
    persona: EXCEL_ROLE_TO_PERSONA[recipient.excelRole] ?? null
  }));
  return personaId ? recipients.filter((recipient) => recipient.persona === personaId) : recipients;
}

export function getRecipientSummary(rule) {
  return rule.recipientRoles.map((recipient) =>
    `${recipient.excelRole}:${recipient.code}${recipient.persona ? ` (${recipient.persona})` : ' [mapping à revoir]'}`
  );
}
