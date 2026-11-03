export const ALERT_STATUSES = Object.freeze([
  'open', 'acknowledged', 'under_review', 'action_planned', 'resolved', 'dismissed'
]);

export const ACTIVE_ALERT_STATUSES = Object.freeze(['open', 'acknowledged', 'under_review', 'action_planned']);

export function stableAlertKey(ruleId, projectId, entityId = null) {
  return [ruleId, projectId ?? 'portfolio', entityId ?? ''].join(':');
}

export function transitionAlert(alert, nextStatus, actor, note = '', at = new Date().toISOString()) {
  if (!ALERT_STATUSES.includes(nextStatus)) throw new Error(`Unknown alert status: ${nextStatus}`);
  const allowed = {
    open: ['acknowledged', 'dismissed'],
    acknowledged: ['under_review', 'dismissed'],
    under_review: ['action_planned', 'dismissed'],
    action_planned: ['resolved', 'dismissed'],
    resolved: [],
    dismissed: []
  };
  if (!allowed[alert.status]?.includes(nextStatus)) {
    throw new Error(`Invalid alert transition: ${alert.status} → ${nextStatus}`);
  }
  return {
    ...alert,
    status: nextStatus,
    resolutionNote: nextStatus === 'resolved' ? note : alert.resolutionNote ?? '',
    updatedAt: at,
    auditHistory: [...(alert.auditHistory ?? []), { at, actor, from: alert.status, to: nextStatus, note }]
  };
}

/** Stable IDs deduplicate active rule/entity pairs and preserve prior occurrences. */
export function reconcileAlertInstances(previous, evaluations, rulesById, actor = 'TAQADDUM') {
  const records = { ...previous };
  const emitted = [];
  evaluations.forEach((evaluation) => {
    const key = stableAlertKey(evaluation.ruleId, evaluation.projectId, evaluation.entityId);
    const existing = records[key];
    if (evaluation.triggered) {
      if (!existing) {
        const rule = rulesById[evaluation.ruleId];
        const instance = {
          id: key, key, ruleId: evaluation.ruleId, projectId: evaluation.projectId,
          entityId: evaluation.entityId, severity: evaluation.severity, status: 'open',
          triggeredValues: evaluation.values, createdAt: evaluation.evaluatedAt,
          lastEvaluatedAt: evaluation.evaluatedAt, assignedOwner: null, dueDate: null,
          resolutionNote: '', lastConditionTriggered: true,
          auditHistory: [{ at: evaluation.evaluatedAt, actor, from: null, to: 'open', note: 'Alerte créée par le moteur de règles.' }],
          title: rule.name, requiredAction: rule.requiredAction, frequency: rule.frequency
        };
        records[key] = instance;
        emitted.push(instance);
      } else if ((existing.status === 'resolved' || existing.status === 'dismissed') && existing.lastConditionTriggered === false) {
        const reopened = {
          ...existing, id: `${key}:R${(existing.reopenCount ?? 0) + 1}`, key,
          status: 'open', createdAt: evaluation.evaluatedAt, lastEvaluatedAt: evaluation.evaluatedAt,
          triggeredValues: evaluation.values, lastConditionTriggered: true,
          reopenCount: (existing.reopenCount ?? 0) + 1,
          auditHistory: [...existing.auditHistory, { at: evaluation.evaluatedAt, actor, from: existing.status, to: 'open', note: 'Condition redevenue vraie après résolution/écartement.' }]
        };
        records[key] = reopened;
        emitted.push(reopened);
      } else {
        const updated = { ...existing, lastEvaluatedAt: evaluation.evaluatedAt, triggeredValues: evaluation.values, lastConditionTriggered: true };
        records[key] = updated;
        emitted.push(updated);
      }
    } else if (existing) {
      records[key] = { ...existing, lastEvaluatedAt: evaluation.evaluatedAt, lastConditionTriggered: false };
    }
  });
  return { records, active: emitted };
}


export function assignAlertOwnerAndDueDate(alert, assignedOwner, dueDate, actor, at = new Date().toISOString()) {
  return {
    ...alert,
    assignedOwner: assignedOwner?.trim() || null,
    dueDate: dueDate || null,
    updatedAt: at,
    auditHistory: [...(alert.auditHistory ?? []), {
      at, actor, from: alert.status, to: alert.status,
      note: `Affectation mise à jour : responsable=${assignedOwner?.trim() || 'non renseigné'} ; échéance=${dueDate || 'non renseignée'}.`
    }]
  };
}
