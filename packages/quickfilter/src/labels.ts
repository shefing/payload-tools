// Centralized labels for the quickfilter plugin

// List of all accepted languages in the system - only those defined in PLUGIN_LABELS
export const acceptedLanguages = ['ar', 'en', 'es', 'fr', 'he', 'zh'];

export const PLUGIN_LABELS = {
  en: {
    quickFilters: 'Quick Filters',
    clearFilters: 'Clear Filters',
    activeFilterSingular: 'Active filter on column',
    activeFilterPlural: 'Active filters on columns',
    custom: 'Custom',
    all: 'All',
    yes: 'Yes',
    no: 'No',
    selectOption: 'Select Option',
    from: 'From',
    to: 'To',
    selectDate: 'Select Date',
    past: 'Past',
    future: 'Future',
    customRange: 'Custom Range',
    apply: 'Apply',
    cancel: 'Cancel',
    yesterday: 'Yesterday',
    lastWeek: 'Last Week',
    lastMonth: 'Last Month',
    allPast: 'All Past',
    today: 'Today',
    nextWeek: 'Next Week', // Corrected from 'This Week'
    nextMonth: 'Next Month', // Corrected from 'This Month'
    allFuture: 'All Future',
  },
  ar: {
    quickFilters: 'فلاتر سريعة',
    clearFilters: 'مسح الفلاتر',
    activeFilterSingular: 'فلتر نشط على العمود',
    activeFilterPlural: 'فلاتر نشطة على الأعمدة',
    custom: 'مخصص',
    all: 'الكل',
    yes: 'نعم',
    no: 'لا',
    selectOption: 'اختر خيارًا',
    from: 'من',
    to: 'إلى',
    selectDate: 'اختر التاريخ',
    past: 'الماضي',
    future: 'المستقبل',
    customRange: 'نطاق مخصص',
    apply: 'تطبيق',
    cancel: 'إلغاء',
    yesterday: 'أمس',
    lastWeek: 'الأسبوع الماضي',
    lastMonth: 'الشهر الماضي',
    allPast: 'كل الماضي',
    today: 'اليوم',
    nextWeek: 'الأسبوع القادم',
    nextMonth: 'الشهر القادم',
    allFuture: 'كل المستقبل',
  },
  fr: {
    quickFilters: 'Filtres rapides',
    clearFilters: 'Effacer les filtres',
    activeFilterSingular: 'Filtre actif sur la colonne',
    activeFilterPlural: 'Filtres actifs sur les colonnes',
    custom: 'Personnalisé',
    all: 'Tous',
    yes: 'Oui',
    no: 'Non',
    selectOption: 'Sélectionner une option',
    from: 'De',
    to: 'À',
    selectDate: 'Sélectionner une date',
    past: 'Passé',
    future: 'Futur',
    customRange: 'Plage personnalisée',
    apply: 'Appliquer',
    cancel: 'Annuler',
    yesterday: 'Hier',
    lastWeek: 'Semaine dernière',
    lastMonth: 'Mois dernier',
    allPast: 'Tout le passé',
    today: 'Aujourd’hui',
    nextWeek: 'Semaine prochaine',
    nextMonth: 'Mois prochain',
    allFuture: 'Tout le futur',
  },
  es: {
    quickFilters: 'Filtros rápidos',
    clearFilters: 'Borrar filtros',
    activeFilterSingular: 'Filtro activo en la columna',
    activeFilterPlural: 'Filtros activos en las columnas',
    custom: 'Personalizado',
    all: 'Todos',
    yes: 'Sí',
    no: 'No',
    selectOption: 'Seleccionar opción',
    from: 'Desde',
    to: 'Hasta',
    selectDate: 'Seleccionar fecha',
    past: 'Pasado',
    future: 'Futuro',
    customRange: 'Rango personalizado',
    apply: 'Aplicar',
    cancel: 'Cancelar',
    yesterday: 'Ayer',
    lastWeek: 'Semana pasada',
    lastMonth: 'Mes pasado',
    allPast: 'Todo el pasado',
    today: 'Hoy',
    nextWeek: 'Próxima semana',
    nextMonth: 'Próximo mes',
    allFuture: 'Todo el futuro',
  },
  zh: {
    quickFilters: '快速筛选',
    clearFilters: '清除筛选',
    activeFilterSingular: '列上激活的筛选',
    activeFilterPlural: '多列上激活的筛选',
    custom: '自定义',
    all: '全部',
    yes: '是',
    no: '否',
    selectOption: '选择选项',
    from: '从',
    to: '到',
    selectDate: '选择日期',
    past: '过去',
    future: '未来',
    customRange: '自定义范围',
    apply: '应用',
    cancel: '取消',
    yesterday: '昨天',
    lastWeek: '上周',
    lastMonth: '上个月',
    allPast: '所有过去',
    today: '今天',
    nextWeek: '下周',
    nextMonth: '下个月',
    allFuture: '所有未来',
  },
  he: {
    quickFilters: 'סינון מהיר',
    clearFilters: 'נקה סינון',
    activeFilterSingular: 'סינון פעיל בעמודה',
    activeFilterPlural: 'סינון פעיל בעמודות',
    custom: 'מותאם אישית',
    all: 'הכל',
    yes: 'כן',
    no: 'לא',
    selectOption: 'בחר אפשרות',
    from: 'מתאריך',
    to: 'עד תאריך',
    selectDate: 'בחר תאריך',
    past: 'עבר',
    future: 'עתיד',
    customRange: 'טווח מותאם אישית',
    apply: 'החל',
    cancel: 'ביטול',
    yesterday: 'אתמול',
    lastWeek: 'שבוע שעבר',
    lastMonth: 'חודש שעבר',
    allPast: 'בעבר',
    today: 'היום',
    nextWeek: 'השבוע הבא', // Corrected from 'השבוע'
    nextMonth: 'החודש הבא', // Corrected from 'החודש'
    allFuture: 'בעתיד',
  },
  // Placeholder for other languages (az, bg, bn-BD, etc.)
  // These can be structured similarly with proper translations
} as const;
export type SupportedLocale = keyof typeof PLUGIN_LABELS;
export type LabelKey = keyof typeof PLUGIN_LABELS.en;

// Helper function to get labels for a specific locale
export const getLabels = (locale: SupportedLocale = 'en') => {
  return PLUGIN_LABELS[locale] || PLUGIN_LABELS.en;
};

// Helper function to get a specific label
export const getLabel = (key: LabelKey, locale: SupportedLocale = 'en'): string => {
  const labels = getLabels(locale);
  const value = labels[key as keyof typeof labels];

  if (typeof value === 'string') {
    return value;
  }

  // Fallback to English if not found
  const fallbackLabels = getLabels('en');
  const fallbackValue = fallbackLabels[key];

  return typeof fallbackValue === 'string' ? fallbackValue : String(key);
};
