'use client';
import React, { useCallback } from 'react';
import { useTranslation } from '@payloadcms/ui';
import { getTranslation, rtlLanguages } from '@payloadcms/translations';
import { DateFilter } from './filters/components/date-filter';
import { Locale } from './filters/types/filters-type';
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
  const userLocale = { code: localeLang, direction };

  const handleDateFilterChange = useCallback(
    (value: any) => {
      onFilterChange(field.name, value);
    },
    [onFilterChange, field.name],
  );

  const handleSelectFilterChange = useCallback(
    (value: any) => {
      onFilterChange(field.name, value);
    },
    [onFilterChange, field.name],
  );

  const handleCheckboxFilterChange = useCallback(
    (state: any) => {
      onFilterChange(field.name, state);
    },
    [onFilterChange, field.name],
  );

  switch (field.type) {
    case 'date':
      return (
        <DateFilter
          label={field.label}
          value={controlledValue}
          key={field.name}
          onChange={handleDateFilterChange}
          locale={userLocale as Locale}
          className={` w-[${field.width || '250px'}]`}
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
            locale={userLocale as Locale}
            className={` w-[${field.width || '250px'}]`}
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
          locale={userLocale as Locale}
          className={` w-[${field.width || '250px'}]`}
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
          locale={userLocale as Locale}
          className={` w-[${field.width || '250px'}]`}
        />
      );
    default:
      return null;
  }
};

export default FilterField;
