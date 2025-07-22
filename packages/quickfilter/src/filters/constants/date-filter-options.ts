import { getLabel } from '../../labels';
import type { SupportedLocale } from '../../labels';
import { DateFilterOption } from '../types/filters-type';

// Define the option keys for past and future date filters
export const pastOptionKeys = ['yesterday', 'lastWeek', 'lastMonth', 'allPast'] as const;
export const futureOptionKeys = ['today', 'nextWeek', 'nextMonth', 'allFuture'] as const;

// Create date filter options dynamically based on locale
const createDateFilterOptions = (
  keys: readonly string[],
  locale: SupportedLocale | string,
): DateFilterOption[] => {
  return keys.map((key) => ({
    value: key,
    label: getLabel(key as any, locale as SupportedLocale),
  }));
};

export const getDateFilterOptions = (locale: SupportedLocale | string) => {
  return {
    pastOptions: createDateFilterOptions(pastOptionKeys, locale),
    futureOptions: createDateFilterOptions(futureOptionKeys, locale),
  };
};
