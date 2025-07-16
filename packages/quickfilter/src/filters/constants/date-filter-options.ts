import { DateFilterOption } from '../types/filters-type';

export const pastDateFilterOptions: DateFilterOption[] = [
  { value: 'yesterday', label: 'אתמול' },
  { value: 'lastWeek', label: 'שבוע שעבר' },
  { value: 'lastMonth', label: 'חודש שעבר' },
  { value: 'allPast', label: 'בעבר' },
];

export const futureDateFilterOptions: DateFilterOption[] = [
  { value: 'today', label: 'היום' },
  { value: 'nextWeek', label: 'השבוע' },
  { value: 'nextMonth', label: 'החודש' },
  { value: 'allFuture', label: 'בעתיד' },
];

export const pastDateFilterOptionsEn: DateFilterOption[] = [
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'lastWeek', label: 'Last Week' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'allPast', label: 'All Past' },
];

export const futureDateFilterOptionsEn: DateFilterOption[] = [
  { value: 'today', label: 'Today' },
  { value: 'nextWeek', label: 'This Week' },
  { value: 'nextMonth', label: 'This Month' },
  { value: 'allFuture', label: 'All Future' },
];
