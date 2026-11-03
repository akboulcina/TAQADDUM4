/*
 * Translations for the interactive map. One entry per key: [français, English, العربية].
 * Same shape as i18n.roles.js; merged in i18n.js and checked by scripts/verify-roles.mjs.
 * Statuses, table headers and "open project sheet" reuse the existing status.*, table.* and
 * action.* keys instead of being repeated here.
 */
const entries = {
  'map.title': ['Cartographie interactive des projets', 'Interactive project map', 'الخريطة التفاعلية للمشاريع'],
  'map.subtitle': ['Localisez le portefeuille, filtrez par wilaya, secteur ou statut et ouvrez la fiche d’un projet.', 'Locate the portfolio, filter by wilaya, sector or status and open a project sheet.', 'حدّد مواقع المحفظة، وصفِّ حسب الولاية أو القطاع أو الحالة، وافتح ملف أي مشروع.'],
  'map.demoBadge': ['Données simulées', 'Simulated data', 'بيانات محاكاة'],
  'map.region': ['Carte interactive de l’Algérie', 'Interactive map of Algeria', 'خريطة تفاعلية للجزائر'],
  'map.loading': ['Chargement de la carte…', 'Loading the map…', 'جارٍ تحميل الخريطة…'],
  'map.error.title': ['La carte n’a pas pu s’afficher.', 'The map could not be displayed.', 'تعذّر عرض الخريطة.'],
  'map.error.body': ['Le reste de l’application reste utilisable. Réessayez ou rechargez la page.', 'The rest of the application still works. Try again or reload the page.', 'بقية التطبيق تعمل بشكل طبيعي. أعد المحاولة أو حمّل الصفحة من جديد.'],
  'map.error.retry': ['Réessayer', 'Try again', 'إعادة المحاولة'],

  'map.search.label': ['Recherche', 'Search', 'بحث'],
  'map.search.placeholder': ['Nom ou code du projet', 'Project name or code', 'اسم المشروع أو رمزه'],
  'map.filter.wilaya': ['Wilaya', 'Wilaya', 'الولاية'],
  'map.filter.sector': ['Secteur', 'Sector', 'القطاع'],
  'map.filter.status': ['Statut', 'Status', 'الحالة'],
  'map.filter.allWilayas': ['Toutes les wilayas', 'All wilayas', 'كل الولايات'],
  'map.filter.allSectors': ['Tous les secteurs', 'All sectors', 'كل القطاعات'],
  'map.filter.allStatuses': ['Tous les statuts', 'All statuses', 'كل الحالات'],
  'map.filter.reset': ['Réinitialiser', 'Reset', 'إعادة الضبط'],
  'map.count.shown': ['{shown} sur {total} projets affichés', '{shown} of {total} projects shown', '{shown} من أصل {total} مشاريع معروضة'],
  'map.count.unlocated': ['dont {n} sans position sur la carte', 'of which {n} have no map position', 'منها {n} بلا موقع على الخريطة'],

  'map.basemap.label': ['Fond de carte', 'Base map', 'خريطة الأساس'],
  'map.basemap.osm': ['Plan', 'Streets', 'شوارع'],
  'map.basemap.topo': ['Relief', 'Terrain', 'تضاريس'],
  'map.basemap.satellite': ['Satellite', 'Satellite', 'أقمار صناعية'],
  'map.basemap.tileError': ['Les tuiles du fond « {name} » ne se chargent pas. Vérifiez la connexion ou choisissez un autre fond de carte.', 'Tiles for the “{name}” base map are not loading. Check the connection or choose another base map.', 'تعذّر تحميل بلاطات خريطة «{name}». تحقّق من الاتصال أو اختر خريطة أساس أخرى.'],
  'map.basemap.nonCommercial': ['Usage non commercial uniquement', 'Non-commercial use only', 'للاستخدام غير التجاري فقط'],

  'map.layers.title': ['Couches', 'Layers', 'الطبقات'],
  'map.layers.projects': ['Projets', 'Projects', 'المشاريع'],
  'map.layers.clusters': ['Regrouper les projets proches', 'Group nearby projects', 'تجميع المشاريع المتقاربة'],
  'map.layers.boundaries': ['Limites des wilayas', 'Wilaya boundaries', 'حدود الولايات'],
  'map.layers.wilayaStatus': ['Statut par wilaya', 'Status by wilaya', 'حالة كل ولاية'],
  'map.layers.colorBy': ['Couleur des repères', 'Marker colour', 'لون العلامات'],
  'map.layers.colorStatus': ['Statut', 'Status', 'الحالة'],
  'map.layers.colorSector': ['Secteur', 'Sector', 'القطاع'],
  'map.layers.boundariesNote': ['Limites généralisées (Natural Earth, domaine public), indicatives : 48 wilayas, sans celles créées depuis 2019.', 'Generalised boundaries (Natural Earth, public domain), indicative only: 48 wilayas, without those created since 2019.', 'حدود مبسّطة (Natural Earth، ملكية عامة) للاسترشاد فقط: 48 ولاية، دون الولايات المستحدثة منذ 2019.'],
  'map.legend.approx': ['Position indicative (pointillé)', 'Indicative position (dashed)', 'موقع إرشادي (خط متقطع)'],

  'map.view.reset': ['Vue Algérie', 'Whole Algeria', 'عرض الجزائر'],
  'map.view.fit': ['Ajuster aux projets', 'Fit to projects', 'ملاءمة المشاريع'],
  'map.zoomIn': ['Zoom avant', 'Zoom in', 'تكبير'],
  'map.zoomOut': ['Zoom arrière', 'Zoom out', 'تصغير'],
  'map.keyboard': ['Glisser : déplacer · Molette ou + / − : zoom · Entrée sur un repère : détails', 'Drag: pan · Wheel or + / −: zoom · Enter on a marker: details', 'اسحب للتحريك · العجلة أو + / − للتقريب · Enter على علامة للتفاصيل'],

  'map.field.code': ['Code', 'Code', 'الرمز'],
  'map.field.missing': ['Non renseigné', 'Not provided', 'غير متوفر'],
  'map.popup.zoom': ['Centrer sur le projet', 'Zoom to project', 'التركيز على المشروع'],
  'map.precision.recorded': ['Coordonnées issues des données du projet.', 'Coordinates taken from the project data.', 'الإحداثيات مأخوذة من بيانات المشروع.'],
  'map.precision.namedSite': ['Position approximative du site nommé dans le titre. Emplacement des travaux à confirmer.', 'Approximate position of the site named in the title. Location of the works to be confirmed.', 'موقع تقريبي للموقع المذكور في العنوان. موقع الأشغال يحتاج إلى تأكيد.'],
  'map.precision.wilayaCapital': ['Position indicative : chef-lieu de la wilaya. L’emplacement exact du projet n’est pas renseigné.', 'Indicative position: the wilaya’s capital city. The exact project location is not recorded.', 'موقع إرشادي: عاصمة الولاية. الموقع الدقيق للمشروع غير مسجّل.'],
  'map.precision.short.recorded': ['Coordonnées du projet', 'Project coordinates', 'إحداثيات المشروع'],
  'map.precision.short.namedSite': ['Site approximatif', 'Approximate site', 'موقع تقريبي'],
  'map.precision.short.wilayaCapital': ['Chef-lieu (indicatif)', 'Wilaya capital (indicative)', 'عاصمة الولاية (إرشادي)'],
  'map.issue.missing': ['Aucune coordonnée disponible.', 'No coordinates available.', 'لا توجد إحداثيات.'],
  'map.issue.invalid': ['Coordonnées invalides.', 'Invalid coordinates.', 'إحداثيات غير صالحة.'],
  'map.issue.outOfRange': ['Coordonnées hors de l’Algérie : ignorées.', 'Coordinates outside Algeria: ignored.', 'إحداثيات خارج الجزائر: تم تجاهلها.'],

  'map.panel.selected': ['Projet sélectionné', 'Selected project', 'المشروع المحدد'],
  'map.panel.clear': ['Désélectionner', 'Clear selection', 'إلغاء التحديد'],
  'map.panel.results': ['Résultats', 'Results', 'النتائج'],
  'map.panel.empty': ['Aucun projet ne correspond aux filtres actuels.', 'No project matches the current filters.', 'لا يوجد مشروع يطابق المرشحات الحالية.'],
  'map.panel.hint': ['Sélectionnez un repère sur la carte ou un projet dans la liste.', 'Select a marker on the map or a project in the list.', 'اختر علامة على الخريطة أو مشروعًا من القائمة.'],
  'map.panel.unlocated': ['Sans position sur la carte', 'Not placed on the map', 'غير مثبّتة على الخريطة'],
  'map.wilaya.selected': ['Wilaya sélectionnée', 'Selected wilaya', 'الولاية المحددة'],
  'map.wilaya.clear': ['Effacer la wilaya', 'Clear wilaya', 'إلغاء تحديد الولاية'],
  'map.wilaya.noProject': ['Aucun projet dans cette wilaya pour votre périmètre.', 'No project in this wilaya within your scope.', 'لا يوجد مشروع في هذه الولاية ضمن نطاقك.'],
  'map.tooltip.wilaya': ['{name} · {n} projet(s)', '{name} · {n} project(s)', '{name} · {n} مشروع'],
  'map.tooltip.noProject': ['{name} · aucun projet', '{name} · no project', '{name} · لا مشاريع'],

  'map.sources.title': ['Sources et conditions d’usage', 'Sources and terms of use', 'المصادر وشروط الاستخدام'],
  'map.sources.osm': ['OpenStreetMap : tuiles du serveur de la fondation OSM, usage léger et attribution obligatoires. Une mise en production doit passer par un autre fournisseur ou un serveur de tuiles dédié.', 'OpenStreetMap: tiles from the OSM Foundation server, light use and attribution required. A production deployment must use another provider or its own tile server.', 'OpenStreetMap: بلاطات من خادم مؤسسة OSM، الاستخدام الخفيف والإسناد إلزاميان. عند الإنتاج يجب استخدام مزوّد آخر أو خادم بلاطات خاص.'],
  'map.sources.topo': ['OpenTopoMap : relief issu d’OSM et SRTM, licence CC-BY-SA, attribution obligatoire. Contacter le projet avant un usage à grande échelle.', 'OpenTopoMap: terrain from OSM and SRTM, CC-BY-SA licence, attribution required. Contact the project before large-scale use.', 'OpenTopoMap: تضاريس من OSM وSRTM، ترخيص CC-BY-SA، الإسناد إلزامي. تواصل مع المشروع قبل أي استخدام واسع.'],
  'map.sources.satellite': ['EOX Sentinel-2 cloudless 2024 : imagerie d’environ 10 m, sans clé, gratuite pour un usage non commercial (CC BY-NC-SA 4.0). Un usage commercial exige une licence EOX. Pas de détail plus fin que 10 m.', 'EOX Sentinel-2 cloudless 2024: roughly 10 m imagery, no key, free for non-commercial use (CC BY-NC-SA 4.0). Commercial use needs an EOX licence. No detail finer than 10 m.', 'EOX Sentinel-2 cloudless 2024: صور بدقة نحو 10 م، دون مفتاح، مجانية للاستخدام غير التجاري (CC BY-NC-SA 4.0). الاستخدام التجاري يتطلب ترخيصًا من EOX. لا تفاصيل أدق من 10 م.'],
  'map.sources.offline': ['Aucune tuile n’est stockée pour un usage hors ligne : la carte nécessite une connexion.', 'No tiles are stored for offline use: the map needs a connection.', 'لا تُخزَّن أي بلاطات للعمل دون اتصال: تحتاج الخريطة إلى اتصال بالإنترنت.'],
  'map.sources.terms': ['Conditions', 'Terms', 'الشروط']
};

const index = { fr: 0, en: 1, ar: 2 };
export const mapTranslations = Object.fromEntries(
  Object.entries(index).map(([lang, position]) => [lang, Object.fromEntries(Object.entries(entries).map(([key, values]) => [key, values[position]]))])
);
