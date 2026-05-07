// Centralized labels for the changes-button plugin.
// Mirrors the structure used by `@shefing/quickfilter` so that all labels are
// declared in a single, locale-keyed object and consumed via `getLabel`.

// List of locales for which translations are provided in this file.
export const acceptedLanguages = ['ar', 'en', 'es', 'fr', 'he', 'zh'] as const;

export const PLUGIN_LABELS = {
  en: {
    changes: 'Changes',
    reviewChanges: 'Review changes',
    noChangesToReview: 'No changes to review.',
    failedToLoadDiff: 'Failed to load diff.',
    toggleUnsaved: 'Unsaved',
    toggleLatestDraft: 'Latest draft',
  },
  ar: {
    changes: 'التغييرات',
    reviewChanges: 'مراجعة التغييرات',
    noChangesToReview: 'لا توجد تغييرات للمراجعة.',
    failedToLoadDiff: 'فشل تحميل الفروق.',
    toggleUnsaved: 'غير محفوظ',
    toggleLatestDraft: 'أحدث مسودة',
  },
  fr: {
    changes: 'Modifications',
    reviewChanges: 'Examiner les modifications',
    noChangesToReview: 'Aucune modification à examiner.',
    failedToLoadDiff: 'Échec du chargement des différences.',
    toggleUnsaved: 'Non enregistré',
    toggleLatestDraft: 'Dernier brouillon',
  },
  es: {
    changes: 'Cambios',
    reviewChanges: 'Revisar cambios',
    noChangesToReview: 'No hay cambios que revisar.',
    failedToLoadDiff: 'Error al cargar las diferencias.',
    toggleUnsaved: 'Sin guardar',
    toggleLatestDraft: 'Último borrador',
  },
  zh: {
    changes: '更改',
    reviewChanges: '审核更改',
    noChangesToReview: '没有需要审核的更改。',
    failedToLoadDiff: '加载差异失败。',
    toggleUnsaved: '未保存',
    toggleLatestDraft: '最新草稿',
  },
  he: {
    changes: 'שינויים',
    reviewChanges: 'סקירת שינויים',
    noChangesToReview: 'אין שינויים לסקירה.',
    failedToLoadDiff: 'טעינת ההשוואה נכשלה.',
    toggleUnsaved: 'לא נשמר',
    toggleLatestDraft: 'טיוטה אחרונה',
  },
} as const;

export type SupportedLocale = keyof typeof PLUGIN_LABELS;
export type LabelKey = keyof typeof PLUGIN_LABELS.en;

const isSupportedLocale = (l: string | undefined): l is SupportedLocale =>
  !!l && (acceptedLanguages as readonly string[]).includes(l);

// Helper function to get labels for a specific locale.
export const getLabels = (locale: SupportedLocale = 'en') => {
  return PLUGIN_LABELS[locale] || PLUGIN_LABELS.en;
};

// Helper function to get a specific label, falling back to English when the
// requested locale or key is missing.
export const getLabel = (key: LabelKey, locale: string | undefined = 'en'): string => {
  const safeLocale: SupportedLocale = isSupportedLocale(locale) ? locale : 'en';
  const labels = getLabels(safeLocale);
  const value = labels[key as keyof typeof labels];

  if (typeof value === 'string') {
    return value;
  }

  const fallback = PLUGIN_LABELS.en[key];
  return typeof fallback === 'string' ? fallback : String(key);
};

/** Server-function key registered via the layout `wrapServerFunctions` helper. */
export const SERVER_FUNCTION_KEY = 'shefing/changes-button:render-diff';
