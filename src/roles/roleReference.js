/*
 * ROLE ↔ REFERENCE MAPPING — which application persona stands for which role of
 * the 43-KPI workbook (03_Matrice_Roles), and what is still undecided.
 *
 * This file is DATA ONLY (no imports): kpi/, alerts/ and roles/ all read it, so
 * the mapping exists exactly once. It never grants anything by itself; the
 * visibility rules are derived from it in referenceAccess.js.
 *
 * Rules of the mapping
 *  - A persona is mapped to a workbook role only when the workbook supports it.
 *  - Nothing is inferred from a similar-sounding label. `REJECTED_EQUIVALENCES`
 *    lists the tempting equivalences that are deliberately NOT made.
 *  - An unresolved persona (no workbook role) gets the safe default: no KPI of the
 *    referentiel visible, no D/I alert recipient, no restricted financial view.
 *  - Every open question has an id in `PENDING_DECISIONS`. Resolving one means
 *    editing this file (and roleConfig.js where it says so) — nothing else.
 *
 * ⚠ Demonstration behaviour: these rules run in the browser and are not a
 * security boundary (see roleConfig.js).
 */

/** Roles of the workbook, in the order of the columns of 03_Matrice_Roles. */
export const REFERENCE_ROLE_KEYS = Object.freeze(['direction', 'pmo', 'mo', 'bet', 'contractor', 'budgetController']);

/** Wording of the workbook (columns E–J headers and « Périmètre de données » / « Ce que le rôle voit »). */
export const REFERENCE_ROLES = Object.freeze({
  direction: { label: 'Direction CNED (décideur)', dataScope: 'Portefeuille national (tous les projets)', view: 'Synthèse de pilotage : KPI [S] et [M] clés, arbitrage des alertes ROUGE.' },
  pmo: { label: 'CNED / PMO (analyste)', dataScope: 'Portefeuille national (tous les projets)', view: 'Tous les KPI utiles à l’analyse ; responsable de la qualité des données (DO1 à DO3) et des KPI de portefeuille.' },
  mo: { label: 'Maître d’ouvrage (MO)', dataScope: 'Ses projets uniquement', view: 'KPI de pilotage de ses projets ; alimente avancement, délais, blocages, emprises.' },
  bet: { label: 'Bureau d’études (BET) / contrôle', dataScope: 'Projets et marchés qu’il surveille', view: 'KPI techniques et qualité ; alimente non-conformités, HSE et consistance.' },
  contractor: { label: 'Contractant (entreprise)', dataScope: 'Ses propres marchés uniquement', view: 'Sa propre performance et ce qui l’affecte (paiements, emprises, avenants) ; jamais les KPI ni les scores d’autres contractants.' },
  budgetController: { label: 'Contrôleur budgétaire (Finance)', dataScope: 'Projets de son périmètre budgétaire', view: 'KPI financiers (AE, CP, situations) et alertes financières.' }
});

/*
 * status
 *   supported   the workbook role matches the persona's function AND scope, and the persona's
 *               project scope in roleConfig.js agrees with « Périmètre de données ».
 *   partial     visibility (KPI R/S/V, alert D/I) is applied from the workbook, but a part of the
 *               workbook role cannot be reproduced from the data (named in `open`).
 *   unresolved  the workbook has no role for this persona. Safe default applies.
 */
export const PERSONA_REFERENCE_MAP = Object.freeze({
  dg: Object.freeze({
    excelRole: 'direction',
    status: 'supported',
    basis: 'Fonction « décideur » et périmètre « Portefeuille national » identiques ; la persona porte les arbitrages de portefeuille (focus de users.js).',
    labelNote: 'Libellé différent (« Direction CNED » / « Direction Générale ») : rapprochement par fonction et par périmètre, retenu depuis les phases 1 et 2.',
    open: ['D-06']
  }),
  pmo: Object.freeze({
    excelRole: 'pmo',
    status: 'supported',
    basis: 'Rôle « CNED / PMO » : coordination transverse et suivi de la performance sur le portefeuille national ; responsable de DO1 à DO3.',
    open: []
  }),
  mo: Object.freeze({
    excelRole: 'mo',
    status: 'supported',
    basis: 'Même rôle (Maître d’ouvrage) ; périmètre « Ses projets uniquement » = scope `assigned` (champ `manager`).',
    open: []
  }),
  finance: Object.freeze({
    excelRole: 'budgetController',
    status: 'partial',
    basis: 'Fonction financière (engagements, paiements) rapprochée de « Contrôleur budgétaire (Finance) » ; visibilité KPI et alertes appliquée telle que dans le classeur.',
    labelNote: 'Libellé différent (« Responsable Financier » / « Contrôleur budgétaire »).',
    open: ['D-05']
  }),
  pm: Object.freeze({
    excelRole: null,
    status: 'unresolved',
    basis: 'Le classeur ne contient aucun rôle « chef de projet ».',
    open: ['D-03']
  }),
  territorial: Object.freeze({
    excelRole: null,
    status: 'unresolved',
    basis: 'Le classeur ne contient aucun rôle territorial.',
    open: ['D-04', 'D-07']
  })
});

/** Workbook roles that no persona represents. They stay unassigned: no right is granted on their behalf. */
export const UNMAPPED_REFERENCE_ROLES = Object.freeze({
  bet: Object.freeze({
    status: 'missing',
    decision: 'D-01',
    reason: 'Aucune persona « Bureau d’études / contrôle » dans l’application.'
  }),
  contractor: Object.freeze({
    status: 'missing',
    decision: 'D-02',
    reason: 'Aucune persona « Contractant » et aucune donnée d’appartenance projet → marché → entreprise pour limiter la vue à « ses propres marchés ».',
  })
});

/** Equivalences that look plausible but are NOT supported by the workbook. Never applied; checked by the tests. */
export const REJECTED_EQUIVALENCES = Object.freeze([
  { persona: 'pm', excelRole: 'contractor', reason: 'Le chef de projet de la plateforme gère des projets assignés ; le contractant est l’entreprise titulaire d’un marché et ne voit que ses marchés.' },
  { persona: 'pm', excelRole: 'bet', reason: 'Rien dans le classeur ni dans la persona n’indique une mission de contrôle technique.' },
  { persona: 'territorial', excelRole: 'bet', reason: 'Le suivi géographique n’est pas un contrôle technique ou qualité.' },
  { persona: 'territorial', excelRole: 'mo', reason: 'Le MO ne voit que ses projets ; le responsable territorial suit une répartition régionale. Les périmètres diffèrent.' },
  { persona: 'pm', excelRole: 'mo', reason: 'Le MO valide ; le chef de projet exécute. Les droits d’action de roleConfig.js les séparent déjà.' }
]);

/*
 * Decisions that cannot be taken from the reference. `safeDefault` is what the code does today.
 * status: 'open' until a decision is recorded here.
 */
export const PENDING_DECISIONS = Object.freeze([
  {
    id: 'D-01', status: 'open', subject: 'Bureau d’études (BET) / contrôle', affects: ['bet'],
    question: 'Faut-il créer une persona BET, ou rattacher ce rôle à une persona existante ?',
    safeDefault: 'Aucune persona BET : ses droits (R, S, V et D/I) ne sont attribués à personne. 9 affectations d’alertes restent non servies.',
    needs: 'Décision produit + périmètre « projets et marchés surveillés » (aucune donnée de contrôle dans le jeu actuel).'
  },
  {
    id: 'D-02', status: 'open', subject: 'Contractant (entreprise)', affects: ['contractor'],
    question: 'Faut-il créer une persona Contractant, et comment lui lier ses marchés ?',
    safeDefault: 'Aucune persona Contractant. Les règles « ses propres marchés / jamais les scores d’autres contractants » (CO1, FI6, FI7, QR7, QR8) ne peuvent pas être appliquées sans données marché → entreprise : aucun droit attribué.',
    needs: 'Modèle de données projet → marché → entreprise ; décision d’authentification externe.'
  },
  {
    id: 'D-03', status: 'open', subject: 'Chef de Projet', affects: ['pm'],
    question: 'À quel rôle du classeur correspond le chef de projet (MO délégué ? BET ? rôle nouveau à ajouter au référentiel) ?',
    safeDefault: 'Aucun KPI du référentiel visible, aucune alerte de règle (ni D ni I). Conservés : projets assignés, actions de démonstration (`project.update`, `project.note`, `alerts.acknowledge` historique) et indicateurs de tableau de bord hors référentiel.',
    needs: 'Une ligne « chef de projet » dans 03_Matrice_Roles (R/S/V par KPI, D/I par règle).'
  },
  {
    id: 'D-04', status: 'open', subject: 'Responsable Territorial — rôle', affects: ['territorial'],
    question: 'Quels KPI et quelles alertes du référentiel le responsable territorial doit-il voir ?',
    safeDefault: 'Aucun KPI du référentiel visible, aucune alerte de règle. Conservés : carte, classement des wilayas et indicateurs territoriaux hors référentiel.',
    needs: 'Une ligne « responsable territorial » dans 03_Matrice_Roles.'
  },
  {
    id: 'D-05', status: 'open', subject: 'Finance — périmètre budgétaire', affects: ['finance'],
    question: 'Quel est le « périmètre budgétaire » du contrôleur budgétaire (programme, secteur, ligne budgétaire, wilaya…) ?',
    safeDefault: 'Périmètre `portfolio` conservé (comportement existant, demandé par la phase 3 : « préserver le périmètre projet existant »). Le classeur dit « projets de son périmètre budgétaire » : cette restriction n’est donc PAS encore appliquée. Une note l’indique sur le tableau de bord.',
    needs: 'Un champ de rattachement budgétaire sur les projets (non présent dans projects.js) et son affectation à la persona.'
  },
  {
    id: 'D-06', status: 'open', subject: 'Direction — arbitrage des alertes ROUGE', affects: ['dg'],
    question: 'La Direction doit-elle être destinataire (D) de certaines alertes rouges ?',
    safeDefault: 'La feuille 04_Vue_Role annonce « arbitrage des alertes ROUGE », mais 03_Matrice_Roles ne donne à la Direction que des « I » (informé). La matrice fait foi : la Direction voit les alertes rouges et n’agit sur aucune alerte de règle.',
    needs: 'Arbitrage entre le texte de la vue et les codes de la matrice.'
  },
  {
    id: 'D-07', status: 'open', subject: 'Responsable Territorial — autorisation géographique', affects: ['territorial'],
    question: 'Sur quelles wilayas porte l’autorisation géographique de la persona ?',
    safeDefault: 'Périmètre `portfolio` conservé (comportement existant). Aucune affectation persona → wilayas n’existe dans les données : la restriction géographique n’est donc PAS encore appliquée.',
    needs: 'Une liste de wilayas autorisées par persona.'
  },
  {
    id: 'D-08', status: 'open', subject: 'Montants financiers bruts pour Chef de Projet et Territorial', affects: ['pm', 'territorial'],
    question: 'Ces personas peuvent-elles voir budget, engagements et paiements ?',
    safeDefault: 'Masqués (permission `finance.view` absente) : le classeur ne leur accorde aucun KPI financier et la règle phase 3 impose un défaut sûr. Les montants restent visibles pour Direction, PMO, MO et Finance.',
    needs: 'Décision métier ; l’ajout de `finance.view` dans roleConfig.js suffit à les rétablir.'
  },
  {
    id: 'D-09', status: 'open', subject: 'Sens opérationnel de « S » et « R »', affects: ['dg', 'pmo', 'mo', 'finance'],
    question: 'Existe-t-il une saisie de données par les rôles « S » ?',
    safeDefault: '« S » = alimente la donnée et « R » = valide et rend compte, exprimés comme droits de lecture/étiquettes (canContributeKpi, canValidateKpi). Aucun écran de saisie n’existe : aucun droit d’écriture ni d’administration n’en découle.',
    needs: 'Spécification des interfaces de saisie (I1–I7) et d’un backend.'
  }
]);

/** Persona ids that have a workbook role. */
export const MAPPED_PERSONAS = Object.freeze(Object.keys(PERSONA_REFERENCE_MAP).filter((id) => PERSONA_REFERENCE_MAP[id].excelRole));

/** Workbook role key → persona id (null when no persona represents the role). */
export const EXCEL_ROLE_TO_PERSONA_MAP = Object.freeze(Object.fromEntries(
  REFERENCE_ROLE_KEYS.map((key) => [key, MAPPED_PERSONAS.find((id) => PERSONA_REFERENCE_MAP[id].excelRole === key) ?? null])
));

export const getDecisions = (ids = []) => PENDING_DECISIONS.filter((decision) => ids.includes(decision.id));
