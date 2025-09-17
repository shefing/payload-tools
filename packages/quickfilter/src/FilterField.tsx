'use client';
import React, { useCallback } from 'react';
import { useTranslation } from '@payloadcms/ui';
import { getTranslation, rtlLanguages } from '@payloadcms/translations';
import { Locale } from './filters/types/filters-type';
import { DateFilter } from './filters/components/date-filter';
import { SmallSelectFilter } from './filters/components/small-select-filter';
import { SelectFilter } from './filters/components/select-filter';
import { CheckboxFilter } from './filters/components/checkbox-filter';

const FilterField = ({
  field,
  onFilterChange,
  value: controlledValue,
}: {
  field: any;
  onFilterChange: (fieldName: string, value: any) => void;
  value: any;
}) => {
  const { i18n } = useTranslation();
  const localeLang = i18n.language;
  const isRTL = (rtlLanguages as readonly string[]).includes(localeLang);
  const direction = isRTL ? 'rtl' : 'ltr';
  const locale = { code: localeLang, direction } as Locale;

  const handleDateFilterChange = useCallback(
    (value: any) => {
      let fieldName = field.name;
      if (typeof field.virtual === 'string') {
        fieldName = field.virtual;
      }
      onFilterChange(fieldName, value);
    },
    [onFilterChange, field.name, field.virtual],
  );

  const handleSelectFilterChange = useCallback(
    (value: any) => {
      let fieldName = field.name;
      if (typeof field.virtual === 'string') {
        fieldName = field.virtual;
      }
      onFilterChange(fieldName, value);
    },
    [onFilterChange, field.name, field.virtual],
  );

  const handleCheckboxFilterChange = useCallback(
    (state: any) => {
      let fieldName = field.name;
      if (typeof field.virtual === 'string') {
        fieldName = field.virtual;
      }
      onFilterChange(fieldName, state);
    },
    [onFilterChange, field.name, field.virtual],
  );

  switch (field.type) {
    case 'date':
      return (
        <DateFilter
          label={field.label}
          value={controlledValue}
          key={field.name}
          onChange={handleDateFilterChange}
          locale={locale}
          style={{ width: field.width || '230px' }}
        />
      );
    case 'select':
      if (field.options.length <= 3) {
        return (
          <SmallSelectFilter
            label={field.label}
            key={field.name}
            options={(field.options || []).map((option: any) => ({
              label: getTranslation(option.label, i18n),
              value: option.value,
            }))}
            onChange={handleSelectFilterChange}
            value={controlledValue}
            locale={locale}
            style={{ width: field.width || '230px' }}
          />
        );
      }
      return (
        <SelectFilter
          label={field.label}
          key={field.name}
          options={(field.options || []).map((option: any) => ({
            label: getTranslation(option.label, i18n),
            value: option.value,
          }))}
          onChange={handleSelectFilterChange}
          value={controlledValue}
          locale={locale}
          style={{ width: field.width || '230px' }}
        />
      );
    case 'checkbox':
      return (
        <CheckboxFilter
          label={field.label}
          key={field.name}
          onChange={handleCheckboxFilterChange}
          value={controlledValue}
          checkboxLabel={''}
          locale={locale}
          style={{ width: field.width || '230px' }}
        />
      );
    default:
      return null;
  }
};

export default FilterField;
