import { getLabel } from '../../labels';
import type { LabelKey, SupportedLocale } from '../../labels';
import { DateFilterOption } from '../types/filters-type';

// Define the option keys for past and future date filters
export const pastOptionKeys = ['yesterday', 'last7Days', 'lastWeek', 'last30Days', 'lastMonth', 'allPast'] as const;
export const futureOptionKeys = ['today', 'next7Days', 'thisWeek', 'next30Days', 'thisMonth', 'allFuture'] as const;

// Create date filter options dynamically based on locale
const createDateFilterOptions = (
  keys: readonly string[],
  locale: SupportedLocale | string,
): DateFilterOption[] => {
  return keys.map((key) => ({
    value: key,
    label: getLabel(key as LabelKey, locale as SupportedLocale),
  }));
};

export const getDateFilterOptions = (locale: SupportedLocale | string) => {
  return {
    pastOptions: createDateFilterOptions(pastOptionKeys, locale),
    futureOptions: createDateFilterOptions(futureOptionKeys, locale),
  };
};
