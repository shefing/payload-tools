export interface DateFilterOption {
  value: string;
  label: string;
}

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface DateFilterValue {
  type: 'predefined' | 'custom';
  predefinedValue?: string;
  customRange?: DateRange;
}

export interface SelectFilterOption {
  value: string;
  label: string;
}

export interface SelectFilterValue {
  type: 'all' | 'some' | 'none';
  selectedValues: string[];
}

export interface SmallSelectOption {
  value: string;
  label: string;
}

export interface SmallSelectFilterValue {
  selectedValues: string[];
}

export type CheckboxFilterState = 'checked' | 'unchecked' | 'indeterminate';

export interface Locale {
  code: 'he' | 'en';
  direction: 'rtl' | 'ltr';
}

// New filter configuration types
export type FilterType = 'date' | 'select' | 'checkbox' | 'small-select';

export interface BaseFilterConfig {
  id: string;
  type: FilterType;
  label: {
    he: string;
    en: string;
  };
  title: {
    he: string;
    en: string;
  };
}

export interface DateFilterConfig extends BaseFilterConfig {
  type: 'date';
  placeholder?: {
    he: string;
    en: string;
  };
}

export interface SelectFilterConfig extends BaseFilterConfig {
  type: 'select';
  options: {
    he: SelectFilterOption[];
    en: SelectFilterOption[];
  };
  placeholder?: {
    he: string;
    en: string;
  };
  multiSelect?: boolean;
  showSearch?: boolean;
}

export interface CheckboxFilterConfig extends BaseFilterConfig {
  type: 'checkbox';
  checkboxLabel: {
    he: string;
    en: string;
  };
}

export interface SmallSelectFilterConfig extends BaseFilterConfig {
  type: 'small-select';
  options: {
    he: SmallSelectOption[];
    en: SmallSelectOption[];
  };
  multiSelect?: boolean;
  maxOptions?: number;
}

export type FilterConfig =
  | DateFilterConfig
  | SelectFilterConfig
  | CheckboxFilterConfig
  | SmallSelectFilterConfig;

export interface FilterState {
  [filterId: string]:
    | DateFilterValue
    | SelectFilterValue
    | CheckboxFilterState
    | SmallSelectFilterValue
    | undefined;
}

export type FilterDetaild = {
  name: string;
  label: string;
  type: any;
  options?: Array<any>; // Replace `any` with a more specific type if known
  row?: number | undefined;
  width?: string;
  virtual?: string | boolean;
};

export interface FilterRow {
  rowNumber: number;
  filters: FilterDetaild[];
}
