/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type {
  CheckboxFilterState,
  DateFilterValue,
  FilterDetaild,
  SelectFilterValue,
} from '../filters/types/filters-type';
import { SupportedLocale } from '../labels';
import { futureOptionKeys, pastOptionKeys } from '../filters/constants/date-filter-options';
import { getDateRangeForOption } from '../filters/utils/date-helpers';
import type { Field, FieldAffectingData, SelectField, UIField } from 'payload';
import { formatAdminURL } from 'payload/shared';
import { stringify } from 'qs-esm';
import { EntityType } from '@payloadcms/ui/shared';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Translates URL query conditions to the quick filter's internal state
export const parseWhereClauseToFilterValues = (
  where: any,
  fields: FilterDetaild[],
  locale: SupportedLocale,
): Record<string, any> => {
  const values: Record<string, any> = {};

  // Collect all possible field names (including virtual ones)
  const fieldNames = new Set(
    fields.flatMap((f) => {
      if (typeof f.virtual === 'string') {
        return [f.virtual, f.name];
      }
      return [f.name];
    }),
  );

  // Temporary storage: fieldName → combined condition object
  // This allows us to merge multiple conditions on the same field (e.g. split dates)
  const collectedConditions: Record<string, any> = {};

  // Recursively walk through AND/OR clauses and collect conditions per field
  const collectConditions = (clause: any) => {
    if (!clause || typeof clause !== 'object') return;

    // Handle { and: [...] }
    if (clause.and) {
      clause.and.forEach(collectConditions);
      return;
    }

    // Handle { or: [...] } – we currently only support single-item OR
    if (clause.or) {
      if (clause.or.length > 1) return; // Complex OR not supported yet
      clause.or.forEach(collectConditions);
      return;
    }

    // Leaf level: { fieldName: { equals: ..., greater_than_equal: ..., etc } }
    for (const fieldName in clause) {
      if (!fieldNames.has(fieldName)) continue;

      const condition = clause[fieldName];
      if (!condition || typeof condition !== 'object') continue;

      // Initialize field entry if not exists
      if (!collectedConditions[fieldName]) {
        collectedConditions[fieldName] = {};
      }

      // Merge all operators into one object per field
      Object.assign(collectedConditions[fieldName], condition);
    }
  };

  // Start collection from root where clause
  collectConditions(where);

  // Now process each collected field condition
  for (const [fieldName, condition] of Object.entries(collectedConditions)) {
    const fieldDef = fields.find((f) => {
      const name = typeof f.virtual === 'string' ? f.virtual : f.name;
      return name === fieldName;
    });

    if (!fieldDef) continue;

    // Case 1: Direct string value like "today", "thisWeek", etc.
    if (typeof condition === 'string') {
      const predefinedValue = condition;
      if ([...pastOptionKeys, ...futureOptionKeys].includes(predefinedValue as any)) {
        values[fieldName] = { type: 'predefined', predefinedValue };
      }
      continue;
    }

    // Case 2: Checkbox or single-value select (equals)
    if ('equals' in condition) {
      if (fieldDef.type === 'checkbox') {
        values[fieldName] =
          condition.equals === true || condition.equals === 'true' ? 'checked' : 'unchecked';
      } else if (fieldDef.type === 'select') {
        values[fieldName] = { selectedValues: [condition.equals] };
      }
      continue;
    }

    // Case 3: Multi-select (in: [...])
    if ('in' in condition && Array.isArray(condition.in)) {
      if (fieldDef.type === 'select') {
        values[fieldName] = { selectedValues: condition.in };
      }
      continue;
    }

    // Case 4: Date field with greater_than_equal / less_than_equal (possibly split!)
    if (
      fieldDef.type === 'date' &&
      ('greater_than_equal' in condition || 'less_than_equal' in condition)
    ) {
      const fromDate = condition.greater_than_equal ? new Date(condition.greater_than_equal) : null;
      const toDate = condition.less_than_equal ? new Date(condition.less_than_equal) : null;

      // Try to match a predefined date option (today, thisWeek, etc.)
      let matchedOption: string | null = null;
      for (const option of [...pastOptionKeys, ...futureOptionKeys]) {
        const range = getDateRangeForOption(option, locale);

        const fromMatch =
          fromDate === null
            ? range.from === undefined
            : range.from && fromDate.toDateString() === range.from.toDateString();

        const toMatch =
          toDate === null
            ? range.to === undefined
            : range.to && toDate.toDateString() === range.to.toDateString();

        if (fromMatch && toMatch) {
          matchedOption = option;
          break;
        }
      }

      if (matchedOption) {
        values[fieldName] = {
          type: 'predefined',
          predefinedValue: matchedOption,
        };
      } else {
        values[fieldName] = {
          type: 'custom',
          customRange: {
            from: fromDate,
            to: toDate,
          },
        };
      }
    }
  }

  return values;
};

// Builds an array of condition objects from the quick filter values
export const buildQuickFilterConditions = (
  values: Record<string, any>,
  fieldDefs: FilterDetaild[],
  locale: SupportedLocale,
): Record<string, any>[] => {
  const conditions: Record<string, any>[] = [];

  Object.entries(values).forEach(([fieldName, value]) => {
    if (!value) return;
    const fieldDef = fieldDefs.find((f) => {
      let name = f.name;
      if (typeof f.virtual === 'string') {
        name = f.virtual;
      }
      return name === fieldName;
    });
    if (!fieldDef) return;

    let condition: Record<string, any> | null = null;

    switch (fieldDef.type) {
      case 'date': {
        const dateValue = value as DateFilterValue;
        let from: Date | undefined;
        let to: Date | undefined;

        if (dateValue.predefinedValue) {
          const range = getDateRangeForOption(dateValue.predefinedValue, locale);
          from = range.from;
          to = range.to;
        } else if (dateValue.customRange) {
          if (dateValue.customRange.from) from = new Date(dateValue.customRange.from);
          if (dateValue.customRange.to) to = new Date(dateValue.customRange.to);
        }

        if (from || to) {
          const dateQuery: any = {};
          if (from) dateQuery.greater_than_equal = from;
          if (to) dateQuery.less_than_equal = to;
          if (Object.keys(dateQuery).length > 0) {
            condition = { [fieldName]: dateQuery };
          }
        }
        break;
      }
      case 'select': {
        const selectValue = value as SelectFilterValue;
        if (selectValue.selectedValues && selectValue.selectedValues.length > 0) {
          if (selectValue.selectedValues.length === 1) {
            condition = { [fieldName]: { equals: selectValue.selectedValues[0] } };
          } else {
            condition = { [fieldName]: { in: selectValue.selectedValues } };
          }
        }
        break;
      }
      case 'checkbox': {
        const checkboxState = value as CheckboxFilterState;
        if (checkboxState === 'checked') {
          condition = { [fieldName]: { equals: 'true' } };
        } else if (checkboxState === 'unchecked') {
          condition = { [fieldName]: { equals: 'false' } };
        }
        break;
      }
    }
    if (condition) {
      conditions.push(condition);
    }
  });
  return conditions;
};

export function splitDualDateConditions(conditions: Record<string, any>[]): Record<string, any>[] {
  return conditions.flatMap((condition) => {
    const [[fieldName, query]] = Object.entries(condition);

    // Safety – if it's not an object with a query inside
    if (!query || typeof query !== 'object') return [condition];

    const hasGte = 'greater_than_equal' in query;
    const hasLte = 'less_than_equal' in query;

    // Only split when BOTH bounds exist
    if (hasGte && hasLte) {
      return [
        { [fieldName]: { greater_than_equal: query.greater_than_equal } },
        { [fieldName]: { less_than_equal: query.less_than_equal } },
      ];
    }

    // Otherwise – return as-is (including cases with only one bound)
    return [condition];
  });
}

// Recursive function to find a field by name
export function findFieldByName(fields: Field[], fieldName: string): Field {
  // First check at the current level
  const directMatch = fields.find((f) => (f as FieldAffectingData).name === fieldName);
  if (directMatch) return directMatch;

  // If not found, search recursively in nested structures
  for (const item of fields) {
    // Check in array, row, or collapsible fields
    if (
      (item.type === 'array' || item.type === 'row' || item.type === 'collapsible') &&
      'fields' in item &&
      Array.isArray(item.fields)
    ) {
      const nestedMatch = findFieldByName(item.fields, fieldName);
      if (nestedMatch) return nestedMatch;
    }
    // Check in tabs
    else if (item.type === 'tabs' && Array.isArray(item.tabs)) {
      for (const tab of item.tabs) {
        if ('fields' in tab && Array.isArray(tab.fields)) {
          const tabMatch = findFieldByName(tab.fields, fieldName);
          if (tabMatch) return tabMatch;
        }
      }
    }
    // Check in blocks
    else if (item.type === 'blocks' && Array.isArray(item.blocks)) {
      for (const block of item.blocks) {
        if ('fields' in block && Array.isArray(block.fields)) {
          const blockMatch = findFieldByName(block.fields, fieldName);
          if (blockMatch) return blockMatch;
        }
      }
    }
  }

  return null;
}

// Process nav groups to add href with defaultFilter query parameters
export function processNavGroups(
  groups: any[],
  collections: any[],
  payload: any,
  i18n: any,
): any[] {
  return groups.map((group) => {
    const processedEntities = group.entities.map((entity) => {
      if (entity.type === EntityType.collection) {
        const collection = collections.find((c) => c.slug === entity.slug);

        // Check if collection has defaultFilter in custom props
        if (collection?.custom?.defaultFilter) {
          // Base URL without query parameters
          const baseHref = formatAdminURL({
            adminRoute: payload.config.routes.admin,
            path: `/collections/${entity.slug}`,
          });

          // Get the fields from the collection for parsing the where clause
          const fields: FilterDetaild[] =
            Object.keys(collection.custom.defaultFilter)
              ?.flat()
              .map((fieldName: string) => {
                const fieldConfig = findFieldByName(collection.fields, fieldName);
                return {
                  name: fieldName,
                  type: fieldConfig?.type,
                  options: (fieldConfig as SelectField)?.options,
                  label: (fieldConfig as UIField)?.label || fieldName,
                  row: 0,
                  virtual: 'virtual' in fieldConfig && fieldConfig.virtual,
                } as FilterDetaild;
              })
              .filter(Boolean) || [];

          // If we have fields and a defaultFilter, calculate the URL with where clause
          if (fields.length > 0) {
            // Parse the defaultFilter to get filter values
            const filterValues = parseWhereClauseToFilterValues(
              collection.custom.defaultFilter,
              fields,
              i18n.language as SupportedLocale,
            );
            // If we have filter values, add them to the URL
            if (Object.keys(filterValues).length > 0) {
              const quickFilterConditions = buildQuickFilterConditions(
                filterValues,
                fields,
                i18n.language as SupportedLocale,
              );

              const whereCondition =
                quickFilterConditions.length === 1
                  ? quickFilterConditions[0]
                  : { and: quickFilterConditions };
              const query = {
                where: whereCondition,
              };
              const stringifiedQuery = stringify(query, { addQueryPrefix: true });
              return {
                ...entity,
                href: `${baseHref}${stringifiedQuery}`,
              };
            }
          }
        }
      }
      return entity;
    });

    return {
      ...group,
      entities: processedEntities,
    };
  });
}
