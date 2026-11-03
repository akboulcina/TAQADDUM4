import { roleTranslations } from './i18n.roles.js';
import { mapTranslations } from './i18n.map.js';
import { kpiReferentielTranslations } from './i18n.kpi.js';
import { referenceTranslations } from './i18n.reference.js';

const baseTranslations = {
  fr: {
    'app.name': 'TAQADDUM', 'app.tagline': 'Pilotage de portefeuille', 'app.demo': 'Démonstration',
    'nav.pilotage': 'Pilotage', 'nav.dashboard': 'Tableau de bord exécutif', 'nav.portfolio': 'Portefeuille de projets', 'nav.map': 'Cartographie interactive', 'nav.performance': 'KPI & Performance', 'nav.alerts': 'Alertes & Risques', 'nav.collaboration': 'Collaboration', 'nav.operations': 'Opérations', 'nav.projects': 'Détail projet', 'nav.reports': 'Rapports & Documents',
    'search.placeholder': 'Rechercher un projet, une wilaya, un indicateur…', 'topbar.notifications': 'Notifications', 'topbar.language': 'Langue', 'topbar.demoUser': 'Utilisateur de démonstration',
    'dashboard.title': 'Tableau de bord exécutif', 'dashboard.description': 'Vue consolidée de la santé du portefeuille, de l’exécution budgétaire, des priorités territoriales et des risques nécessitant une décision.',
    'action.export': 'Exporter', 'action.report': 'Nouveau rapport',
    'demo.banner': 'Prototype de démonstration — les données affichées sont simulées et ne constituent pas des données réelles du CNED.',
    'kpi.projects': 'Projets actifs', 'kpi.budget': 'Budget engagé', 'kpi.execution': 'Taux d’exécution physique', 'kpi.alerts': 'Alertes critiques', 'kpi.payments': 'Paiements cumulés', 'kpi.variance': 'Écart budgétaire',
    'chart.health': 'Santé du portefeuille', 'chart.healthSub': 'Répartition des projets par état d’avancement', 'chart.budget': 'Exécution budgétaire par secteur', 'chart.budgetSub': 'Engagements et paiements, en milliards de DZD', 'chart.map': 'Progression territoriale', 'chart.mapSub': 'Aperçu compact des wilayas prioritaires', 'chart.projects': 'Projets prioritaires', 'chart.projectsSub': 'Projets nécessitant une attention exécutive',
    'alerts.title': 'Alertes prioritaires', 'alerts.subtitle': 'Risques et points de décision', 'alerts.viewAll': 'Voir toutes les alertes',
    'table.project': 'Projet', 'table.wilaya': 'Wilaya', 'table.sector': 'Secteur', 'table.budget': 'Budget', 'table.progress': 'Avancement', 'table.status': 'Statut', 'table.due': 'Échéance',
    'status.onTrack': 'En bonne voie', 'status.atRisk': 'À risque', 'status.delayed': 'En retard', 'status.completed': 'Achevé',
    'placeholder.title': 'Module en préparation', 'placeholder.description': 'Ce module sera intégré dans une tâche dédiée. Le shell, les données partagées et les contrats d’intégration sont déjà disponibles.', 'placeholder.contract': 'Contrat d’intégration',
    'auth.title': 'Connexion', 'auth.subtitle': 'Choisissez un profil pour explorer la démonstration.', 'auth.brand.headline': 'Le suivi de l’investissement public, du national au territoire.', 'auth.brand.description': 'Avancement des projets, exécution budgétaire, risques et couverture territoriale du portefeuille, réunis dans un même espace de pilotage.',
    'auth.name.label': 'Nom', 'auth.name.placeholder': 'Votre nom complet', 'auth.persona.label': 'Profil de démonstration', 'auth.persona.hint': 'Le profil détermine le rôle affiché dans l’application.', 'auth.password.label': 'Mot de passe', 'auth.password.show': 'Afficher le mot de passe', 'auth.password.hide': 'Masquer le mot de passe', 'auth.password.demoNote': 'Démonstration : tout mot de passe non vide est accepté. Cette connexion n’offre aucune sécurité réelle.', 'auth.submit': 'Se connecter',
    'auth.error.name': 'Saisissez votre nom.', 'auth.error.persona': 'Sélectionnez un profil de démonstration.', 'auth.error.password': 'Saisissez un mot de passe. Tout mot de passe est accepté en démonstration.',
    'auth.logout': 'Se déconnecter', 'auth.userMenu': 'Menu utilisateur', 'auth.signedInAs': 'Connecté en tant que', 'auth.demoSession': 'Session de démonstration, sans authentification réelle.',
    'footer.demo': 'Prototype TAQADDUM · Données fictives à des fins de démonstration'
  },
  ar: {
    'app.name': 'تقدّم', 'app.tagline': 'إدارة محفظة المشاريع', 'app.demo': 'عرض توضيحي',
    'nav.pilotage': 'القيادة', 'nav.dashboard': 'لوحة القيادة التنفيذية', 'nav.portfolio': 'محفظة المشاريع', 'nav.map': 'الخريطة التفاعلية', 'nav.performance': 'مؤشرات الأداء', 'nav.alerts': 'التنبيهات والمخاطر', 'nav.collaboration': 'التعاون', 'nav.operations': 'العمليات', 'nav.projects': 'تفاصيل المشروع', 'nav.reports': 'التقارير والوثائق',
    'search.placeholder': 'ابحث عن مشروع أو ولاية أو مؤشر…', 'topbar.notifications': 'الإشعارات', 'topbar.language': 'اللغة', 'topbar.demoUser': 'مستخدم العرض التوضيحي',
    'dashboard.title': 'لوحة القيادة التنفيذية', 'dashboard.description': 'نظرة موحدة على صحة المحفظة، والتنفيذ المالي، والأولويات الإقليمية، والمخاطر التي تتطلب قرارًا.',
    'action.export': 'تصدير', 'action.report': 'تقرير جديد',
    'demo.banner': 'نموذج عرض توضيحي — البيانات المعروضة محاكاة وليست بيانات حقيقية.',
    'kpi.projects': 'المشاريع النشطة', 'kpi.budget': 'الميزانية الملتزم بها', 'kpi.execution': 'نسبة الإنجاز المادي', 'kpi.alerts': 'تنبيهات حرجة', 'kpi.payments': 'المدفوعات التراكمية', 'kpi.variance': 'الفارق المالي',
    'chart.health': 'صحة المحفظة', 'chart.healthSub': 'توزيع المشاريع حسب حالة التقدم', 'chart.budget': 'التنفيذ المالي حسب القطاع', 'chart.budgetSub': 'الالتزامات والمدفوعات، بمليارات دينار', 'chart.map': 'التقدم الإقليمي', 'chart.mapSub': 'نظرة مختصرة على الولايات ذات الأولوية', 'chart.projects': 'المشاريع ذات الأولوية', 'chart.projectsSub': 'مشاريع تتطلب انتباهًا تنفيذيًا',
    'alerts.title': 'التنبيهات ذات الأولوية', 'alerts.subtitle': 'المخاطر ونقاط اتخاذ القرار', 'alerts.viewAll': 'عرض جميع التنبيهات',
    'table.project': 'المشروع', 'table.wilaya': 'الولاية', 'table.sector': 'القطاع', 'table.budget': 'الميزانية', 'table.progress': 'نسبة الإنجاز', 'table.status': 'الحالة', 'table.due': 'تاريخ الاستحقاق',
    'status.onTrack': 'في المسار الصحيح', 'status.atRisk': 'معرض للخطر', 'status.delayed': 'متأخر', 'status.completed': 'مكتمل',
    'placeholder.title': 'وحدة قيد الإعداد', 'placeholder.description': 'سيتم دمج هذه الوحدة في مهمة مستقلة. الهيكل العام والبيانات المشتركة وعقود التكامل متوفرة بالفعل.', 'placeholder.contract': 'عقد التكامل',
    'auth.title': 'تسجيل الدخول', 'auth.subtitle': 'اختر ملفًا لاستكشاف العرض التوضيحي.', 'auth.brand.headline': 'متابعة الاستثمار العمومي، من المستوى الوطني إلى الإقليم.', 'auth.brand.description': 'تقدّم المشاريع والتنفيذ المالي والمخاطر والتغطية الإقليمية للمحفظة، مجتمعة في فضاء واحد للقيادة.',
    'auth.name.label': 'الاسم', 'auth.name.placeholder': 'اسمك الكامل', 'auth.persona.label': 'ملف العرض التوضيحي', 'auth.persona.hint': 'يحدد الملف الدور المعروض في التطبيق.', 'auth.password.label': 'كلمة المرور', 'auth.password.show': 'إظهار كلمة المرور', 'auth.password.hide': 'إخفاء كلمة المرور', 'auth.password.demoNote': 'عرض توضيحي: تُقبل أي كلمة مرور غير فارغة. لا يوفّر تسجيل الدخول هذا أي حماية حقيقية.', 'auth.submit': 'تسجيل الدخول',
    'auth.error.name': 'أدخل اسمك.', 'auth.error.persona': 'اختر ملف العرض التوضيحي.', 'auth.error.password': 'أدخل كلمة مرور. تُقبل أي كلمة مرور في العرض التوضيحي.',
    'auth.logout': 'تسجيل الخروج', 'auth.userMenu': 'قائمة المستخدم', 'auth.signedInAs': 'تم الدخول باسم', 'auth.demoSession': 'جلسة توضيحية، من دون مصادقة حقيقية.',
    'footer.demo': 'نموذج تقدّم · بيانات وهمية لأغراض العرض التوضيحي'
  },
  en: {
    'app.name': 'TAQADDUM', 'app.tagline': 'Portfolio oversight', 'app.demo': 'Demo',
    'nav.pilotage': 'Oversight', 'nav.dashboard': 'Executive dashboard', 'nav.portfolio': 'Project portfolio', 'nav.map': 'Interactive map', 'nav.performance': 'KPIs & performance', 'nav.alerts': 'Alerts & risks', 'nav.collaboration': 'Collaboration', 'nav.operations': 'Operations', 'nav.projects': 'Project details', 'nav.reports': 'Reports & documents',
    'search.placeholder': 'Search a project, wilaya or indicator…', 'topbar.notifications': 'Notifications', 'topbar.language': 'Language', 'topbar.demoUser': 'Demo user',
    'dashboard.title': 'Executive dashboard', 'dashboard.description': 'Consolidated view of portfolio health, budget execution, territorial priorities and risks requiring a decision.',
    'action.export': 'Export', 'action.report': 'New report',
    'demo.banner': 'Demonstration prototype — displayed data are simulated and do not represent real CNED data.',
    'kpi.projects': 'Active projects', 'kpi.budget': 'Committed budget', 'kpi.execution': 'Physical execution rate', 'kpi.alerts': 'Critical alerts', 'kpi.payments': 'Cumulative payments', 'kpi.variance': 'Budget variance',
    'chart.health': 'Portfolio health', 'chart.healthSub': 'Project distribution by delivery status', 'chart.budget': 'Budget execution by sector', 'chart.budgetSub': 'Commitments and payments, in billions of DZD', 'chart.map': 'Territorial progress', 'chart.mapSub': 'Compact preview of priority wilayas', 'chart.projects': 'Priority projects', 'chart.projectsSub': 'Projects requiring executive attention',
    'alerts.title': 'Priority alerts', 'alerts.subtitle': 'Risks and decision points', 'alerts.viewAll': 'View all alerts',
    'table.project': 'Project', 'table.wilaya': 'Wilaya', 'table.sector': 'Sector', 'table.budget': 'Budget', 'table.progress': 'Progress', 'table.status': 'Status', 'table.due': 'Due date',
    'status.onTrack': 'On track', 'status.atRisk': 'At risk', 'status.delayed': 'Delayed', 'status.completed': 'Completed',
    'placeholder.title': 'Module in preparation', 'placeholder.description': 'This module will be integrated in a dedicated task. The shell, shared data and integration contracts are already available.', 'placeholder.contract': 'Integration contract',
    'auth.title': 'Sign in', 'auth.subtitle': 'Choose a profile to explore the demo.', 'auth.brand.headline': 'Public investment oversight, from national portfolio to local territory.', 'auth.brand.description': 'Project progress, budget execution, risks and territorial coverage of the portfolio, brought together in one oversight workspace.',
    'auth.name.label': 'Name', 'auth.name.placeholder': 'Your full name', 'auth.persona.label': 'Demo profile', 'auth.persona.hint': 'The profile sets the role shown across the application.', 'auth.password.label': 'Password', 'auth.password.show': 'Show password', 'auth.password.hide': 'Hide password', 'auth.password.demoNote': 'Demo only: any non-empty password is accepted. This sign-in provides no real security.', 'auth.submit': 'Sign in',
    'auth.error.name': 'Enter your name.', 'auth.error.persona': 'Select a demo profile.', 'auth.error.password': 'Enter a password. Any password works in this demo.',
    'auth.logout': 'Sign out', 'auth.userMenu': 'User menu', 'auth.signedInAs': 'Signed in as', 'auth.demoSession': 'Demo session, no real authentication.',
    'footer.demo': 'TAQADDUM prototype · Fictional data for demonstration purposes'
  }
};

// Role-based experience strings live in i18n.roles.js and map strings in i18n.map.js; both are merged here.
export const translations = Object.fromEntries(
  Object.entries(baseTranslations).map(([lang, entries]) => [lang, { ...entries, ...roleTranslations[lang], ...mapTranslations[lang], ...kpiReferentielTranslations[lang], ...referenceTranslations[lang] }])
);
