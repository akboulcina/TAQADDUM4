/* Phase 3 — role visibility from the workbook (KPI R/S/V, alert D/I). Entries: [fr, en, ar]. */
const entries = {
  'action.viewAlerts': ['Voir les alertes', 'View alerts', 'عرض التنبيهات'],
  'action.openKpi': ['Indicateurs du référentiel', 'Referentiel indicators', 'مؤشرات المرجعية'],

  'kpi.criticalInformed': ['Alertes rouges (information)', 'Red alerts (for information)', 'التنبيهات الحمراء (للإعلام)'],
  'kpi.note.informedOnly': ['Vous êtes informé, sans action requise', 'You are informed; no action required', 'أنت مُطّلع دون إجراء مطلوب'],
  'kpi.note.alertsSplit': ['{critical} rouges · {act} à traiter', '{critical} red · {act} to act on', '{critical} حمراء · {act} للمعالجة'],
  'kpi.note.financeHidden': ['Information financière non accessible à votre profil', 'Financial information not available to your profile', 'المعلومة المالية غير متاحة لملفك'],

  'panel.critical.title': ['Alertes critiques', 'Critical alerts', 'التنبيهات الحرجة'],
  'panel.critical.subtitle': ['Alertes rouges dont la Direction est informée (code « I »)', 'Red alerts the Direction is informed of (code “I”)', 'التنبيهات الحمراء التي تُبلَّغ بها الإدارة (الرمز «I»)'],
  'panel.critical.empty': ['Aucune alerte rouge active pour votre périmètre.', 'No active red alert in your scope.', 'لا يوجد تنبيه أحمر نشط ضمن نطاقك.'],
  'panel.ruleAlerts.title': ['Alertes de règles', 'Rule alerts', 'تنبيهات القواعد'],
  'panel.ruleAlerts.empty': ['Aucune alerte de règle active pour votre périmètre.', 'No active rule alert in your scope.', 'لا يوجد تنبيه قاعدة نشط ضمن نطاقك.'],
  'panel.ruleAlerts.noRole': ['Votre profil n’est rattaché à aucun rôle destinataire du référentiel : aucune alerte de règle ne vous est attribuée.', 'Your profile is not linked to any recipient role of the referentiel: no rule alert is assigned to you.', 'ملفك غير مرتبط بأي دور مستلم في المرجعية: لا تُسند إليك أي تنبيهات قواعد.'],
  'panel.ruleAlerts.noRoleHint': ['Comportement par défaut sûr, en attente de décision (voir « Décisions en attente »).', 'Safe default, pending a decision (see “Pending decisions”).', 'سلوك افتراضي آمن بانتظار قرار (انظر «قرارات معلّقة»).'],
  'panel.ruleAlerts.coverage': ['Règles suivies : {d} à traiter (D), {i} pour information (I) · évaluations non concluantes : {bad} / {all}', 'Rules followed: {d} to act on (D), {i} for information (I) · inconclusive evaluations: {bad} / {all}', 'القواعد المتابعة: {d} للمعالجة (D)، {i} للإعلام (I) · تقييمات غير حاسمة: {bad} / {all}'],
  'panel.pending.title': ['Décisions en attente', 'Pending decisions', 'قرارات معلّقة'],
  'panel.pending.subtitle': ['Ce que le référentiel ne permet pas de trancher, et ce que l’application fait en attendant', 'What the referentiel cannot settle, and what the app does meanwhile', 'ما لا تحسمه المرجعية، وما يفعله التطبيق في الأثناء'],
  'panel.pending.empty': ['Aucune décision en attente pour votre profil.', 'No pending decision for your profile.', 'لا توجد قرارات معلّقة لملفك.'],
  'panel.pending.open': ['Ouverte', 'Open', 'مفتوحة'],

  'shelf.strategic.title': ['Indicateurs stratégiques', 'Strategic indicators', 'المؤشرات الاستراتيجية'],
  'shelf.strategic.subtitle': ['KPI [S] et [M] visibles pour la Direction', '[S] and [M] KPIs visible to the Direction', 'مؤشرات [S] و[M] المرئية للإدارة'],
  'shelf.quality.title': ['Qualité et complétude des données', 'Data quality and completeness', 'جودة واكتمال البيانات'],
  'shelf.quality.subtitle': ['DO1 à DO3 : le PMO en est responsable', 'DO1 to DO3: owned by the PMO', 'DO1 إلى DO3: مسؤولية المكتب'],
  'shelf.portfolio.title': ['Performance transversale', 'Cross-project performance', 'الأداء العابر للمشاريع'],
  'shelf.portfolio.subtitle': ['Indicateurs de portefeuille dont le PMO est responsable (R)', 'Portfolio indicators the PMO is responsible for (R)', 'مؤشرات المحفظة التي يتولاها المكتب (R)'],
  'shelf.progress.title': ['Avancement et jalons contractuels', 'Progress and contractual milestones', 'التقدم والمراحل التعاقدية'],
  'shelf.progress.subtitle': ['Avancement physique et délais de vos projets', 'Physical progress and deadlines of your projects', 'التقدم المادي وآجال مشاريعك'],
  'shelf.constraints.title': ['Emprises, réseaux et blocages', 'Land, networks and blockers', 'الأراضي والشبكات والعوائق'],
  'shelf.constraints.subtitle': ['Contraintes terrain, blocages et décisions attendues', 'Field constraints, blockers and decisions awaited', 'قيود الميدان والعوائق والقرارات المنتظرة'],
  'shelf.finance.title': ['Indicateurs financiers', 'Financial indicators', 'المؤشرات المالية'],
  'shelf.finance.subtitle': ['AE, CP, situations, dérive et réévaluations', 'AE, CP, payment statements, drift and revaluations', 'AE وCP والوضعيات والانحراف وإعادة التقييم'],
  'shelf.noRole': ['Aucun indicateur du référentiel n’est visible pour ce profil.', 'No referentiel indicator is visible to this profile.', 'لا يظهر أي مؤشر من المرجعية لهذا الملف.'],
  'shelf.none': ['Aucun indicateur correspondant n’est visible pour votre rôle.', 'No matching indicator is visible to your role.', 'لا يوجد مؤشر مطابق ظاهر لدورك.'],
  'shelf.counts': ['{shown} affichés sur {total} · {valued} avec une valeur', '{shown} shown of {total} · {valued} with a value', '{shown} معروضة من {total} · {valued} بقيمة'],

  'kpr.roleView': ['Votre vue ({role}) : {visible} KPI visibles — {owned} dont vous êtes responsable (R), {feeds} que vous alimentez (S), {view} en lecture seule (V) · {hidden} non visibles.', 'Your view ({role}): {visible} visible KPIs — {owned} you are responsible for (R), {feeds} you feed (S), {view} read-only (V) · {hidden} not visible.', 'عرضك ({role}): {visible} مؤشرًا ظاهرًا — {owned} مسؤول عنها (R)، {feeds} تغذّيها (S)، {view} للقراءة فقط (V) · {hidden} غير ظاهرة.'],
  'kpr.noRights.title': ['Aucun KPI du référentiel n’est attribué à ce profil', 'No referentiel KPI is assigned to this profile', 'لا يوجد مؤشر من المرجعية مُسند لهذا الملف'],
  'kpr.noRights.body': ['Le classeur ne comporte pas de rôle correspondant à cette persona. Par défaut sûr, les 43 KPI restent masqués jusqu’à décision.', 'The workbook has no role matching this persona. As a safe default the 43 KPIs stay hidden until a decision is made.', 'لا يتضمن المصنف دورًا مطابقًا لهذه الشخصية. افتراضيًا وبشكل آمن تبقى المؤشرات الـ43 مخفية حتى صدور قرار.']
};

const index = { fr: 0, en: 1, ar: 2 };
export const referenceTranslations = Object.fromEntries(
  Object.entries(index).map(([lang, position]) => [lang, Object.fromEntries(Object.entries(entries).map(([key, values]) => [key, values[position]]))])
);
