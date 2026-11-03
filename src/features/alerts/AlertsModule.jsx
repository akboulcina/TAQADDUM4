import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { ALERT_RULES } from '../../alerts/ruleRegistry.js';
import { getRecipientSummary, RECIPIENT_MAPPING_GAPS } from '../../alerts/recipients.js';
import { ACTIVE_ALERT_STATUSES } from '../../alerts/lifecycle.js';
import { alertCategoryLabel } from '../../alerts/categories.js';
import { getDecisions } from '../../roles/roleReference.js';
import './AlertsModule.css';

const RULE_BY_ID = Object.fromEntries(ALERT_RULES.map((rule) => [rule.id, rule]));
const STATUS_LABELS = {
  open: 'Ouverte', acknowledged: 'Prise en charge', under_review: 'En cours de revue',
  action_planned: 'Action planifiée', resolved: 'Résolue', dismissed: 'Écartée'
};
const categoryFor = (rule) => alertCategoryLabel(rule.id);
const severityLabel = (severity) => severity === 'ROUGE' ? 'Rouge' : 'Orange';
const severityRank = (severity) => severity === 'ROUGE' ? 2 : 1;
const fmt = (value) => value === null || value === undefined ? 'Absent' : typeof value === 'object' ? JSON.stringify(value) : String(value);

/*
 * Alert centre. Visibility is decided by the role model (src/roles/access.js), never here:
 *   1. `projects` are the persona's SCOPED projects — an alert on any other project is dropped first;
 *   2. the persona must be a D/I recipient of the rule in the workbook (access.canViewRuleAlert);
 *   3. the role's alert view narrows further.
 * `evaluations` are produced upstream (useRoleScope) from the same scoped projects.
 * KPI values the persona may not see (blank in 03_Matrice_Roles) are masked in the evidence.
 */
export function AlertsModule({
  projects = [], user, actionState = {}, onAction, canAct = () => true,
  alertRecords = {}, notifications = [], evaluations = [], onMarkNotificationRead,
  onOpenProject, onOpenKpi, onUpdateAssignment
}) {
  const { access } = useApp();
  const [severity, setSeverity] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [projectFilter, setProjectFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [dueFilter, setDueFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [ownerDraft, setOwnerDraft] = useState('');
  const [dueDraft, setDueDraft] = useState('');
  const [resolutionDraft, setResolutionDraft] = useState('');
  const todayIso = new Date().toISOString().slice(0, 10);
  const horizonIso = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const projectById = useMemo(() => new Map(projects.map((project) => [project.id ?? project.code, project])), [projects]);
  const canSee = (record) => access.canViewRuleAlert({ ruleId: record.ruleId, projectId: record.projectId, severity: RULE_BY_ID[record.ruleId]?.severity }, projectById.get(record.projectId));
  const allInstances = useMemo(() => Object.values(alertRecords)
    .filter((record) => RULE_BY_ID[record.ruleId] && canSee(record))
    .map((record) => {
      const rule = RULE_BY_ID[record.ruleId];
      return { ...record, rule, severity: rule.severity, category: categoryFor(rule), state: record.status, recipientCode: access.alertRecipientCode(rule.id) };
    }), [alertRecords, projectById, access]);

  const visible = useMemo(() => allInstances
    .filter((item) => (severity === 'all' || item.severity === severity))
    .filter((item) => statusFilter === 'all' || (statusFilter === 'active' ? ACTIVE_ALERT_STATUSES.includes(item.state) : item.state === statusFilter))
    .filter((item) => projectFilter === 'all' || item.projectId === projectFilter)
    .filter((item) => categoryFilter === 'all' || item.category === categoryFilter)
    .filter((item) => ownerFilter === 'all' || item.assignedOwner === ownerFilter)
    .filter((item) => dueFilter === 'all' || (dueFilter === 'soon' && item.dueDate && item.dueDate >= todayIso && item.dueDate <= horizonIso))
    .filter((item) => !search || `${item.rule.name} ${item.rule.readableCondition} ${item.projectId}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || String(b.createdAt).localeCompare(String(a.createdAt))),
  [allInstances, severity, statusFilter, projectFilter, categoryFilter, ownerFilter, dueFilter, search, todayIso, horizonIso]);

  const selected = visible.find((item) => item.id === selectedId) ?? visible[0] ?? null;
  useEffect(() => {
    setOwnerDraft(selected?.assignedOwner ?? '');
    setDueDraft(selected?.dueDate ?? '');
    setResolutionDraft(selected?.resolutionNote ?? '');
  }, [selected?.id]);

  // Only rules the persona is a D/I recipient of: coverage of other rules is not shown (blank = not visible).
  const myEvaluations = useMemo(() => evaluations.filter((item) => access.alertRecipientCode(item.ruleId)), [evaluations, access]);
  const myRules = useMemo(() => ALERT_RULES.filter((rule) => access.alertRecipientCode(rule.id)), [access]);
  const myGaps = RECIPIENT_MAPPING_GAPS.filter((gap) => access.alertRecipientCode(gap.ruleId));
  const triggeredCount = myEvaluations.filter((item) => item.triggered).length;
  const unevaluable = myEvaluations.filter((item) => item.status !== 'evaluable');
  const activeCount = allInstances.filter((item) => ACTIVE_ALERT_STATUSES.includes(item.state)).length;
  const dueSoonCount = allInstances.filter((item) => ACTIVE_ALERT_STATUSES.includes(item.state) && item.dueDate && item.dueDate >= todayIso && item.dueDate <= horizonIso).length;
  const criticalCount = allInstances.filter((item) => item.severity === 'ROUGE' && ACTIVE_ALERT_STATUSES.includes(item.state)).length;
  const highCount = allInstances.filter((item) => item.severity === 'ORANGE' && ACTIVE_ALERT_STATUSES.includes(item.state)).length;
  const visibleNotifications = notifications.filter((item) => RULE_BY_ID[item.ruleId] && canSee(item));
  const unread = visibleNotifications.filter((item) => !item.read).length;
  const categories = [...new Set(allInstances.map((item) => item.category))];
  const owners = [...new Set(allInstances.map((item) => item.assignedOwner).filter(Boolean))].sort();
  const unevaluableByRule = Object.values(unevaluable.reduce((groups, item) => {
    const group = groups[item.ruleId] ??= { ruleId: item.ruleId, count: 0, statuses: new Set(), missing: new Set(), invalid: new Set(), gateReasons: new Set() };
    group.count += 1;
    group.statuses.add(item.status);
    item.values.filter((value) => value.missing).forEach((value) => group.missing.add(value.field));
    item.values.filter((value) => value.invalid).forEach((value) => group.invalid.add(value.field));
    (item.qualityGate?.reasons ?? []).forEach((reason) => group.gateReasons.add(reason));
    return groups;
  }, {}));

  const update = (alert, state, note = '') => {
    if (!canAct(alert, state)) return;
    const next = onAction?.(alert, state, note);
    return next;
  };

  return (
    <section className="alerts-module" aria-label="Centre des alertes et risques">
      <header className="alerts-header">
        <div>
          <p className="alerts-brand">TAQADDUM · RULE ENGINE</p>
          <h2>Centre des alertes et des risques</h2>
          <p>17 règles de référence · Évaluation fondée sur les KPI et les données sources disponibles.</p>
        </div>
        <button className="alerts-notification-toggle" type="button" onClick={() => setShowNotifications((value) => !value)}>
          Notifications <span>{unread} non lue(s)</span>
        </button>
      </header>

      {showNotifications && <section className="alerts-notifications">
        <div className="alerts-section-heading"><h3>Notifications in-app</h3><span>{visibleNotifications.length} notification(s)</span></div>
        {visibleNotifications.slice(0, 12).map((item) => (
          <button key={item.id} type="button" className={`alerts-notification ${item.read ? 'read' : 'unread'}`} onClick={() => {
            onMarkNotificationRead?.(item.id);
            setSelectedId(item.alertId);
            setShowNotifications(false);
            setStatusFilter('all');
          }}>
            <strong>{item.title}</strong><span>{item.projectId} · {new Date(item.createdAt).toLocaleString()}</span>
          </button>
        ))}
        {!visibleNotifications.length && <p className="alerts-muted">Aucune notification.</p>}
      </section>}

      {!access.reference.alerts.visible.length && (
        <section className="alerts-mapping-gap">
          <strong>Rôle non raccordé aux destinataires du référentiel Excel</strong>
          <p>Cette persona ne correspond à aucun des six rôles du classeur : aucune alerte de règle ne lui est attribuée (ni « D » ni « I »). C’est le comportement par défaut sûr, pas un oubli.</p>
          <small>Décisions en attente : {getDecisions(['D-01', 'D-02', 'D-03', 'D-04']).map((decision) => `${decision.id} ${decision.subject}`).join(' · ')}</small>
        </section>
      )}

      <div className="alerts-summary">
        <article><strong>{activeCount}</strong><span>Alertes actives</span></article>
        <article className="red"><strong>{criticalCount}</strong><span>Rouges ouvertes</span></article>
        <article className="orange"><strong>{highCount}</strong><span>Oranges ouvertes</span></article>
        <article><strong>{triggeredCount}</strong><span>Conditions déclenchées</span></article>
        <article><strong>{unevaluable.length}</strong><span>Évaluations non concluantes</span></article><article><strong>{dueSoonCount}</strong><span>Échéances sous 7 jours</span></article>
      </div>

      <div className="alerts-toolbar">
        <input type="search" placeholder="Rechercher une règle, un projet…" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="all">Toutes sévérités</option><option value="ROUGE">Rouge</option><option value="ORANGE">Orange</option></select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="active">Alertes actives</option><option value="all">Tous les statuts</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}><option value="all">Tous les projets</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">Toutes catégories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select>
        <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}><option value="all">Tous responsables</option>{owners.map((owner) => <option key={owner}>{owner}</option>)}</select>
        <select value={dueFilter} onChange={(event) => setDueFilter(event.target.value)}><option value="all">Toutes les échéances</option><option value="soon">Sous 7 jours</option></select>
      </div>

      <div className="alerts-section-heading"><h3>Alertes par projet et par statut</h3><span>{visible.length} résultat(s)</span></div>
      <div className="alerts-layout">
        <div className="alerts-list">
          {visible.length === 0 && <div className="alerts-empty"><strong>Aucune alerte active ne correspond aux filtres</strong><p>Les conditions non évaluables ne sont jamais converties en alertes rouges ou orange.</p></div>}
          {visible.map((alert) => (
            <article key={alert.id} className={`alerts-item ${alert.severity.toLowerCase()} ${alert.state} ${selected?.id === alert.id ? 'selected' : ''}`} onClick={() => setSelectedId(alert.id)}>
              <span className={`alerts-severity ${alert.severity.toLowerCase()}`} />
              <div className="alerts-item-content">
                <div className="alerts-item-top"><strong>{alert.rule.id} · {alert.rule.name}</strong><span className={`alerts-state ${alert.state}`}>{STATUS_LABELS[alert.state]}</span></div>
                <p>{alert.rule.readableCondition}</p>
                <div className="alerts-meta"><span>{severityLabel(alert.severity)}</span><span>{alert.recipientCode === 'D' ? 'Action requise' : 'Pour information'}</span><span>{alert.category}</span><span>{alert.projectId}</span><span>{new Date(alert.createdAt).toLocaleDateString()}</span></div>
                <div className="alerts-actions">
                  <button type="button" onClick={(event) => { event.stopPropagation(); update(alert, 'acknowledged'); }} disabled={alert.state !== 'open' || !canAct(alert, 'acknowledged')}>Prendre en charge</button>
                  <button type="button" onClick={(event) => { event.stopPropagation(); update(alert, 'under_review'); }} disabled={alert.state !== 'acknowledged' || !canAct(alert, 'under_review')}>En revue</button>
                  <button type="button" onClick={(event) => { event.stopPropagation(); update(alert, 'action_planned'); }} disabled={alert.state !== 'under_review' || !canAct(alert, 'action_planned')}>Planifier action</button>
                  <button type="button" onClick={(event) => { event.stopPropagation(); update(alert, 'resolved', resolutionDraft); }} disabled={alert.state !== 'action_planned' || !canAct(alert, 'resolved')}>Résoudre</button>
                  <button type="button" onClick={(event) => { event.stopPropagation(); update(alert, 'dismissed'); }} disabled={['resolved', 'dismissed'].includes(alert.state) || !canAct(alert, 'dismissed')}>Écarter</button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="alerts-detail">
          {selected ? <>
            <p className="alerts-brand">{selected.rule.id} · {selected.rule.importance} · {selected.rule.phase}</p>
            <h3>{selected.rule.name}</h3>
            <span className={`alerts-state ${selected.state}`}>{STATUS_LABELS[selected.state]}</span>
            <dl>
              <div><dt>Sévérité Excel</dt><dd>{selected.rule.severity}</dd></div>
              <div><dt>Condition source</dt><dd>{selected.rule.readableCondition}</dd></div>
              <div><dt>Logique</dt><dd>{selected.rule.logic}</dd></div>
              <div><dt>Projet</dt><dd>{selected.projectId}</dd></div>
              <div><dt>Créée le</dt><dd>{new Date(selected.createdAt).toLocaleString()}</dd></div>
              <div><dt>Dernière évaluation</dt><dd>{new Date(selected.lastEvaluatedAt).toLocaleString()}</dd></div>
              <div><dt>Responsable affecté</dt><dd>{selected.assignedOwner || 'Non affecté'}</dd></div>
              <div><dt>Échéance</dt><dd>{selected.dueDate || 'Non définie'}</dd></div>
              <div><dt>Note de résolution</dt><dd>{selected.resolutionNote || 'Aucune'}</dd></div>
              <div><dt>Action attendue</dt><dd>{selected.rule.requiredAction}</dd></div>
              <div><dt>Fréquence</dt><dd>{selected.rule.frequency}</dd></div>
              <div><dt>Destinataires D/I</dt><dd>{getRecipientSummary(selected.rule).join(' · ') || 'Non renseignés'}</dd></div>
              <div><dt>Destinataires prévus</dt><dd>{selected.rule.intendedRecipients}</dd></div>
            </dl>
            <h4>Preuves de déclenchement</h4>
            <div className="alerts-evidence">
              {selected.triggeredValues?.map((item) => {
                const kpiId = String(item.field).match(/^([A-Z]{2}\d)/)?.[1];
                const hidden = kpiId && !access.canViewKpi(kpiId);
                return <div key={item.id}>
                  <strong>{item.id} · {item.field}</strong>
                  {hidden
                    ? <span>Valeur masquée : ce KPI n’est pas visible pour votre rôle. La condition fait partie de la règle ; son détail ne vous est pas communiqué.</span>
                    : <span>Valeur : {fmt(item.actual)} · Opérateur : {item.operator} · Seuil : {fmt(item.expected)}</span>}
                  <small>Source : {item.sourceType} · Confiance : {hidden ? 's.o.' : item.confidence ?? 's.o.'}</small>
                </div>;
              })}
            </div>
            <h4>Affectation et échéance</h4>
            <div className="alerts-assignment">
              <input aria-label="Responsable affecté" placeholder="Nom du responsable" value={ownerDraft} onChange={(event) => setOwnerDraft(event.target.value)} />
              <input aria-label="Date d'échéance" type="date" value={dueDraft} onChange={(event) => setDueDraft(event.target.value)} />
              <button type="button" disabled={!canAct(selected, 'action_planned')} onClick={() => onUpdateAssignment?.(selected, ownerDraft, dueDraft)}>Enregistrer l'affectation</button>
            </div>
            <h4>Note de résolution</h4>
            <textarea aria-label="Note de résolution" placeholder="Décrire la résolution ou la décision de revue…" value={resolutionDraft} onChange={(event) => setResolutionDraft(event.target.value)} />
            <h4>Historique d'audit</h4>
            <ol className="alerts-audit">{(selected.auditHistory ?? []).map((item, index) => <li key={`${item.at}-${index}`}><strong>{item.from ?? '—'} → {item.to}</strong><span>{item.actor} · {new Date(item.at).toLocaleString()}</span>{item.note && <small>{item.note}</small>}</li>)}</ol>
            <div className="alerts-detail-links">
              <button type="button" onClick={() => selected.projectId !== 'PORTFOLIO' && onOpenProject?.(selected.projectId)} disabled={selected.projectId === 'PORTFOLIO'}>Ouvrir le projet</button>
              {[...new Set(selected.rule.conditions.map((condition) => condition.field.match(/^([A-Z]{2}\d)/)?.[1]).filter(Boolean))].filter((kpiId) => access.canViewKpi(kpiId)).map((kpiId) => (
                <button key={kpiId} type="button" onClick={() => onOpenKpi?.(kpiId)}>KPI {kpiId}</button>
              ))}
            </div>
          </> : <p className="alerts-muted">Sélectionnez une alerte pour afficher ses conditions et ses preuves.</p>}
        </aside>
      </div>

      <section className="alerts-unevaluable">
        <div className="alerts-section-heading"><h3>Règles non évaluables / données insuffisantes</h3><span>{unevaluable.length} / {myEvaluations.length}</span></div>
        <p className="alerts-muted">Une règle non évaluable n'est pas une alerte opérationnelle. Les champs auxiliaires absents restent explicitement absents.</p>
        <div className="alerts-unevaluable-grid">
          {unevaluableByRule.map((item) => <article key={item.ruleId}>
            <strong>{item.ruleId} · {RULE_BY_ID[item.ruleId]?.name}</strong><span>{item.count} évaluation(s) · {[...item.statuses].join(', ')}</span>
            {item.missing.size > 0 && <p>Sources absentes : {[...item.missing].join(', ')}</p>}
            {item.invalid.size > 0 && <small>Valeurs invalides : {[...item.invalid].join(', ')}</small>}
            {item.gateReasons.size > 0 && <small>Garde-fous qualité : {[...item.gateReasons].join(' ; ')}</small>}
          </article>)}
        </div>
      </section>
      <section className="alerts-unevaluable">
        <div className="alerts-section-heading"><h3>Filières destinataires à raccorder</h3><span>{myGaps.length} affectations à valider</span></div>
        <p className="alerts-muted">Les codes D/I du classeur sont conservés. Aucun rattachement arbitraire n'est appliqué aux personas applicatifs.</p>
        <div className="alerts-unevaluable-grid">{myGaps.map((gap) => <article key={`${gap.ruleId}-${gap.excelRole}`}><strong>{gap.ruleId} · {gap.excelRole}</strong><span>{gap.code} · non mappé</span><p>{gap.reason}</p></article>)}</div>
      </section>
      <section className="alerts-unevaluable">
        <div className="alerts-section-heading"><h3>Règles de référence et couverture</h3><span>{myRules.length} / {ALERT_RULES.length} règles vous concernent</span></div>
        <p className="alerts-muted">Les règles conservent leur origine, leurs notes et leur définition Excel. Aucun service externe de notification n'est utilisé.</p>
        <div className="alerts-rule-grid">{myRules.map((rule) => <article key={rule.id}><strong>{rule.id} · {rule.name}</strong><span>{rule.severity} · [{rule.importance}] · {rule.phase} · {access.alertRecipientCode(rule.id) === 'D' ? 'Destinataire (action)' : 'Informé'}</span><p>{rule.readableCondition}</p></article>)}</div>
      </section>
    </section>
  );
}
export default AlertsModule;
