// Custom date utilities to replace date-fns

import { SupportedLocale, getLabel } from '../../labels';

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function subDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function subWeeks(date: Date, weeks: number): Date {
  return addWeeks(date, -weeks);
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function subMonths(date: Date, months: number): Date {
  return addMonths(date, -months);
}

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function startOfWeek(date: Date, options: { weekStartsOn?: number } = {}): Date {
  const { weekStartsOn = 0 } = options;
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  result.setDate(result.getDate() - diff);
  return startOfDay(result);
}

export function endOfWeek(date: Date, options: { weekStartsOn?: number } = {}): Date {
  const { weekStartsOn = 0 } = options;
  const result = startOfWeek(date, { weekStartsOn });
  result.setDate(result.getDate() + 6);
  return endOfDay(result);
}

export function startOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  return startOfDay(result);
}

export function endOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1, 0);
  return endOfDay(result);
}

export function formatDate(date: Date, formatStr: string): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();

  switch (formatStr) {
    case 'dd/MM/yyyy':
      return `${day}/${month}/${year}`;
    case 'dd/MM':
      return `${day}/${month}`;
    case 'MM/yyyy':
      return `${month}/${year}`;
    case 'PPP':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    default:
      return date.toLocaleDateString();
  }
}

export function getDateRangeForOption(
  option: string,
  locale: SupportedLocale = 'he',
): { from: Date | undefined; to: Date | undefined; description: string } {
  const now = new Date();

  switch (option) {
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return {
        from: startOfDay(yesterday),
        to: endOfDay(yesterday),
        description: `(${formatDate(yesterday, 'dd/MM/yyyy')})`,
      };

    case 'lastWeek':
      const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
      const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
      return {
        from: lastWeekStart,
        to: lastWeekEnd,
        description: `(${formatDate(lastWeekStart, 'dd/MM')}-${formatDate(lastWeekEnd, 'dd/MM/yyyy')})`,
      };

    case 'lastMonth':
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
      return {
        from: lastMonthStart,
        to: lastMonthEnd,
        description: `(${formatDate(lastMonthStart, 'MM/yyyy')})`,
      };

    case 'last7Days':
      const last7DaysStart = startOfDay(subDays(now, 6));
      return {
        from: last7DaysStart,
        to: endOfDay(now),
        description: `(${formatDate(last7DaysStart, 'dd/MM')}-${formatDate(now, 'dd/MM/yyyy')})`,
      };

    case 'last30Days':
      const last30DaysStart = startOfDay(subDays(now, 29));
      return {
        from: last30DaysStart,
        to: endOfDay(now),
        description: `(${formatDate(last30DaysStart, 'dd/MM')}-${formatDate(now, 'dd/MM/yyyy')})`,
      };

    case 'lastYear': {
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1); // Jan 1 of last year
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999); // Dec 31 of last year
      return {
        from: lastYearStart,
        to: lastYearEnd,
        description: `(${formatDate(lastYearStart, 'yyyy')})`,
      };
    }

    case 'last2Years': {
      const twoYearsAgoStart = new Date(now.getFullYear() - 2, 0, 1); // Jan 1 of two years ago
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999); // Dec 31 of last year
      return {
        from: twoYearsAgoStart,
        to: lastYearEnd,
        description: `(${formatDate(twoYearsAgoStart, 'yyyy')}-${formatDate(lastYearEnd, 'yyyy')})`,
      };
    }

    case 'allPast': {
      const yesterday = subDays(now, 1);
      return {
        from: undefined,
        to: endOfDay(yesterday),
        description: `(${getLabel('allPast', locale)})`,
      };
    }

    case 'today':
      return {
        from: startOfDay(now),
        to: endOfDay(now),
        description: `(${formatDate(now, 'dd/MM/yyyy')})`,
      };

    case 'thisWeek':
      const thisWeekStart = startOfWeek(now, { weekStartsOn: 0 });
      const thisWeekEnd = endOfWeek(now, { weekStartsOn: 0 });
      return {
        from: thisWeekStart,
        to: thisWeekEnd,
        description: `(${formatDate(thisWeekStart, 'dd/MM')}-${formatDate(thisWeekEnd, 'dd/MM/yyyy')})`,
      };

    case 'thisMonth':
      const thisMonthStart = startOfMonth(now);
      const thisMonthEnd = endOfMonth(now);
      return {
        from: thisMonthStart,
        to: thisMonthEnd,
        description: `(${formatDate(thisMonthStart, 'MM/yyyy')})`,
      };

    case 'next7Days':
      const next7DaysEnd = endOfDay(addDays(now, 6));
      return {
        from: startOfDay(now),
        to: next7DaysEnd,
        description: `(${formatDate(now, 'dd/MM')}-${formatDate(next7DaysEnd, 'dd/MM/yyyy')})`,
      };

    case 'next30Days':
      const next30DaysEnd = endOfDay(addDays(now, 29));
      return {
        from: startOfDay(now),
        to: next30DaysEnd,
        description: `(${formatDate(now, 'dd/MM')}-${formatDate(next30DaysEnd, 'dd/MM/yyyy')})`,
      };

    case 'todayAndFuture':
      return {
        from: startOfDay(now),
        to: undefined,
        description: `(${getLabel('presentFuture', locale)})`,
      };

    case 'allFuture':
      return {
        from: startOfDay(now),
        to: undefined,
        description: `(${getLabel('allFuture', locale)})`,
      };

    default:
      return {
        from: startOfDay(now),
        to: endOfDay(now),
        description: '',
      };
  }
}
