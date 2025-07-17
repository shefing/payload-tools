'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useConfig, useListQuery, useTranslation } from '@payloadcms/ui';
import type { ClientField, FieldAffectingData, OptionObject, SelectField } from 'payload';
import { getTranslation } from '@payloadcms/translations';
import FilterField from './FilterField';
import type {
  CheckboxFilterState,
  DateFilterValue,
  FilterDetaild,
  FilterRow,
  SelectFilterValue,
} from './filters/types/filters-type';
import { groupFiltersByRow, parseColumns } from './filters/utils/layout-helpers';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';

import {
  futureDateFilterOptions,
  pastDateFilterOptions,
} from './filters/constants/date-filter-options';
import { getDateRangeForOption } from './filters/utils/date-helpers';
import { Button } from './ui/button';

// Recursive function to find fields by name
function findFieldsByName(fields: ClientField[], fieldNames: string[]): ClientField[] {
  const results: ClientField[] = [];
  function recursiveSearch(currentFields: ClientField[]) {
    const filteredFields = currentFields.filter(
      (field) => 'name' in field && fieldNames.includes(field.name as string),
    );
    results.push(...filteredFields);
    currentFields.forEach((item) => {
      if (
        (item.type === 'array' || item.type === 'row' || item.type === 'collapsible') &&
        'fields' in item &&
        Array.isArray(item.fields)
      ) {
        recursiveSearch(item.fields);
      } else if (item.type === 'tabs' && Array.isArray(item.tabs)) {
        item.tabs.forEach((tab) => {
          if ('fields' in tab && Array.isArray(tab.fields)) {
            recursiveSearch(tab.fields);
          }
        });
      } else if (item.type === 'blocks' && Array.isArray(item.blocks)) {
        item.blocks.forEach((block) => {
          if ('fields' in block && Array.isArray(block.fields)) {
            recursiveSearch(block.fields);
          }
        });
      }
    });
  }
  recursiveSearch(fields);
  return results;
}

// Helper function to convert UI state to a where query
const buildWhereClause = (
  values: Record<string, any>,
  fieldDefs: FilterDetaild[],
  isHebrew: boolean,
): Record<string, any> => {
  const where: Record<string, any> = {};
  Object.entries(values).forEach(([fieldName, value]) => {
    if (!value) return;
    const fieldDef = fieldDefs.find((f) => f.name === fieldName);
    if (!fieldDef) return;
    switch (fieldDef.type) {
      case 'date': {
        const dateValue = value as DateFilterValue;
        let from: Date | undefined;
        let to: Date | undefined;

        if (dateValue.predefinedValue) {
          const locale = isHebrew ? 'he' : 'en';
          const range = getDateRangeForOption(dateValue.predefinedValue, locale);

          from = range.from;
          to = range.to;
        }
        // Fallback for custom date ranges
        else if (dateValue.customRange) {
          if (dateValue.customRange.from) {
            from = new Date(dateValue.customRange.from);
          }
          if (dateValue.customRange.to) {
            to = new Date(dateValue.customRange.to);
          }
        }

        // Construct the query
        if (from || to) {
          const dateQuery: any = {};
          if (from) dateQuery.greater_than_equal = from;
          if (to) dateQuery.less_than_equal = to;
          if (Object.keys(dateQuery).length > 0) {
            where[fieldName] = dateQuery;
          }
        }
        break;
      }
      case 'select': {
        const selectValue = value as SelectFilterValue;
        if (selectValue.selectedValues && selectValue.selectedValues.length > 0) {
          if (selectValue.selectedValues.length === 1) {
            where[fieldName] = { equals: selectValue.selectedValues[0] };
          } else {
            where[fieldName] = { in: selectValue.selectedValues };
          }
        }
        break;
      }
      case 'checkbox': {
        const checkboxState = value as CheckboxFilterState;
        if (checkboxState === 'checked') {
          where[fieldName] = { equals: true };
        } else if (checkboxState === 'unchecked') {
          where[fieldName] = { equals: false };
        }
        // 'indeterminate' will not filter
        break;
      }
    }
  });
  return where;
};

const QuickFilter = ({
  slug,
  filterList,
}: {
  slug: string;
  filterList: (string | { name: string; width: string })[][];
}) => {
  const localStorageKey = useMemo(() => `direct-filter-${slug}`, [slug]);

  const [fields, setFields] = useState<FilterDetaild[]>([]);
  const [filterRows, setFilterRows] = useState<FilterRow[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const { refineListData, query } = useListQuery();
  const { getEntityConfig } = useConfig();
  const { i18n } = useTranslation();

  const [filterValues, setFilterValues] = useState<Record<string, any>>(() => {
    if (typeof window == 'undefined') return {};
    try {
      const item = window.localStorage.getItem(localStorageKey);
      if (!item) {
        return {};
      }
      const dateTimeReviver = (key: string, value: any) => {
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
        if (typeof value === 'string' && isoDateRegex.test(value)) {
          return new Date(value);
        }
        return value;
      };
      return JSON.parse(item, dateTimeReviver);
    } catch (error) {
      console.error('Error reading and parsing filters from localStorage.', error);
      return {};
    }
  });

  useEffect(() => {
    const collection = getEntityConfig({ collectionSlug: slug });
    const flattenedFieldConfigs = filterList.flatMap((row, rowIndex) =>
      row.map((field, fieldIndex) => ({
        field,
        rowIndex,
        fieldIndex,
      })),
    );
    const fieldNames = flattenedFieldConfigs.map(({ field }) =>
      typeof field === 'string' ? field : field.name,
    );
    const matchedFields = findFieldsByName(collection?.fields || [], fieldNames);
    const simplifiedFields: FilterDetaild[] = matchedFields.map((field) => {
      const label = (field as FieldAffectingData).label;
      const translatedLabel = getTranslation(label as string, i18n);
      const fieldName = (field as FieldAffectingData).name as string;
      const fieldConfig = flattenedFieldConfigs.find(({ field: f }) =>
        typeof f === 'string' ? f === fieldName : f.name === fieldName,
      );
      return {
        name: fieldName,
        label: translatedLabel as string,
        type: field.type,
        options: (field as SelectField).options as OptionObject[],
        row: fieldConfig ? fieldConfig.rowIndex : 0,
        width:
          typeof fieldConfig?.field === 'object' && 'width' in fieldConfig.field
            ? fieldConfig.field.width
            : undefined,
      };
    });
    const sortedFields = flattenedFieldConfigs
      .map(({ field }) => {
        const fieldName = typeof field === 'string' ? field : field.name;
        return simplifiedFields.find((f) => f.name === fieldName);
      })
      .filter((f): f is FilterDetaild => !!f);
    setFields(sortedFields);
    setFilterRows(groupFiltersByRow(sortedFields));
  }, [slug, filterList, getEntityConfig, i18n]);

  useEffect(() => {
    if (fields.length === 0) {
      return;
    }
    const where = buildWhereClause(filterValues, fields, isHebrew);
    try {
      if (Object.keys(filterValues).length > 0) {
        localStorage.setItem(localStorageKey, JSON.stringify(filterValues));
      } else {
        localStorage.removeItem(localStorageKey);
        return;
      }
    } catch (error) {
      console.error('Failed to save filters to localStorage', error);
    }

    if (JSON.stringify(where) !== JSON.stringify(query.where)) {
      refineListData({
        columns: parseColumns(query.columns),
        where,
        page: '1',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterValues, fields, localStorageKey]);

  const handleFilterChange = useCallback((fieldName: string, value: any) => {
    setFilterValues((prev) => {
      const newValues = { ...prev };
      if (
        value === undefined ||
        value === null ||
        value === 'indeterminate' ||
        (value && value.type === 'none')
      ) {
        delete newValues[fieldName];
      } else {
        newValues[fieldName] = value;
      }
      return newValues;
    });
  }, []);

  // This function remains largely the same.
  const getActiveFiltersDetails = () => {
    const activeFilters: string[] = [];
    const isHebrew = i18n.language === 'he';

    Object.entries(filterValues).forEach(([fieldName, value]) => {
      const field = fields.find((f) => f.name === fieldName);
      if (!field) return;

      switch (field.type) {
        case 'date':
          if (value !== undefined) {
            const dateValue = value as DateFilterValue;
            let dateDescription = '';

            if (dateValue.type === 'predefined' && dateValue.predefinedValue) {
              const allOptions = [...pastDateFilterOptions, ...futureDateFilterOptions];
              const option = allOptions.find((opt) => opt.value === dateValue.predefinedValue);
              dateDescription = option ? option.label : isHebrew ? 'מותאם אישית' : 'Custom';
            } else if (dateValue.type === 'custom' || dateValue.customRange) {
              dateDescription = isHebrew ? 'מותאם אישית' : 'Custom';
            }

            if (dateDescription) {
              activeFilters.push(`${field.label} (${dateDescription})`);
            }
          }
          break;
        case 'select': {
          const selectValue = value as SelectFilterValue;
          if (selectValue && selectValue.selectedValues && selectValue.selectedValues.length > 0) {
            const count = selectValue.selectedValues.length;
            const totalOptions = field.options?.length || 0;
            if (selectValue.selectedValues.length === totalOptions) {
              activeFilters.push(`${field.label} (${isHebrew ? 'הכל' : 'All'})`);
            } else {
              activeFilters.push(`${field.label} (${count})`);
            }
          }
          break;
        }
        case 'checkbox':
          if (value !== 'indeterminate') {
            const checkboxValue =
              value === 'checked' ? (isHebrew ? 'כן' : 'Yes') : isHebrew ? 'לא' : 'No';
            activeFilters.push(`${field.label} (${checkboxValue})`);
          }
          break;
      }
    });

    return activeFilters;
  };

  const clearAllFilters = () => {
    refineListData({
      columns: parseColumns(query.columns),
      where: {},
      page: '1',
    });
    setFilterValues({});
  };

  const memoizedFilterRows = useMemo(() => {
    return filterRows.map((row) => (
      <div key={row.rowNumber}>
        <div className='flex flex-wrap gap-6 mb-4'>
          {row.filters.map((field) => (
            <FilterField
              key={field.name}
              field={field}
              onFilterChange={handleFilterChange}
              value={filterValues[field.name]}
            />
          ))}
        </div>
      </div>
    ));
  }, [filterRows, handleFilterChange, filterValues]);

  const toggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  const activeFiltersDetails = getActiveFiltersDetails();
  const hasActiveFilters = activeFiltersDetails.length > 0;
  const isHebrew = i18n.language === 'he';

  if (!fields.length) return null;

  return (
    <div className='filter-container useTw'>
      <div style={{ position: 'relative', top: '-24px', height: '0px' }}>
        <Button
          variant='outline'
          size='sm'
          onClick={toggleFilters}
          className={`flex items-center gap-2 bg-background border-muted-muted hover:bg-muted ${
            hasActiveFilters ? 'w-auto min-w-fit' : ''
          }`}
        >
          <Filter className={`h-4 w-4 ${hasActiveFilters ? 'fill-current' : ''}`} />

          {hasActiveFilters ? (
            <>
              <span className='text-sm truncate'>
                <strong>
                  {isHebrew
                    ? `${activeFiltersDetails.length === 1 ? 'סינון פעיל בעמודה' : 'סינון פעיל בעמודות'}: `
                    : `${activeFiltersDetails.length === 1 ? 'Active filter on column' : 'Active filters on columns'}: `}
                </strong>{' '}
                {activeFiltersDetails.join(' • ')}
              </span>

              <span
                onClick={(e) => {
                  e.stopPropagation();
                  clearAllFilters();
                }}
                className='ml-1 p-0.5 hover:bg-muted rounded-sm transition-colors flex-shrink-0'
              >
                <X className='h-3 w-3 text-gray-500' />
              </span>
            </>
          ) : (
            <span className='text-sm truncate'>{isHebrew ? 'סינון מהיר' : 'Quick Filters'}</span>
          )}

          {showFilters ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
        </Button>
      </div>
      {showFilters && <div className={'p-4 pb-2 bg-muted'}>{memoizedFilterRows}</div>}
    </div>
  );
};

export default QuickFilter;
