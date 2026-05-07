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
    notPublishedYet: 'This document has not been published yet — there is no published baseline to compare against.',
  },
  ar: {
    changes: 'التغييرات',
    reviewChanges: 'مراجعة التغييرات',
    noChangesToReview: 'لا توجد تغييرات للمراجعة.',
    failedToLoadDiff: 'فشل تحميل الفروق.',
    toggleUnsaved: 'غير محفوظ',
    toggleLatestDraft: 'أحدث مسودة',
    notPublishedYet: 'لم يتم نشر هذا المستند بعد — لا يوجد إصدار منشور للمقارنة معه.',
  },
  fr: {
    changes: 'Modifications',
    reviewChanges: 'Examiner les modifications',
    noChangesToReview: 'Aucune modification à examiner.',
    failedToLoadDiff: 'Échec du chargement des différences.',
    toggleUnsaved: 'Non enregistré',
    toggleLatestDraft: 'Dernier brouillon',
    notPublishedYet: 'Ce document n\'a pas encore été publié — il n\'y a pas de version publiée à comparer.',
  },
  es: {
    changes: 'Cambios',
    reviewChanges: 'Revisar cambios',
    noChangesToReview: 'No hay cambios que revisar.',
    failedToLoadDiff: 'Error al cargar las diferencias.',
    toggleUnsaved: 'Sin guardar',
    toggleLatestDraft: 'Último borrador',
    notPublishedYet: 'Este documento aún no se ha publicado — no hay versión publicada con la que comparar.',
  },
  zh: {
    changes: '更改',
    reviewChanges: '审核更改',
    noChangesToReview: '没有需要审核的更改。',
    failedToLoadDiff: '加载差异失败。',
    toggleUnsaved: '未保存',
    toggleLatestDraft: '最新草稿',
    notPublishedYet: '此文档尚未发布 — 没有可对比的已发布版本。',
  },
  he: {
    changes: 'שינויים',
    reviewChanges: 'סקירת שינויים',
    noChangesToReview: 'אין שינויים לסקירה.',
    failedToLoadDiff: 'טעינת ההשוואה נכשלה.',
    toggleUnsaved: 'לא נשמר',
    toggleLatestDraft: 'טיוטה אחרונה',
    notPublishedYet: 'מסמך זה עדיין לא פורסם — אין גרסה מפורסמת להשוואה.',
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
