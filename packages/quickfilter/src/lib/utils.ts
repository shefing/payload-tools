/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type {
  CheckboxFilterState,
  DateFilterValue,
  FilterDetaild,
  SelectFilterValue,
} from '../filters/types/filters-type'
import { SupportedLocale } from '../labels'
import {
  futureOptionKeys,
  pastOptionKeys,
} from '../filters/constants/date-filter-options'
import { getDateRangeForOption } from '../filters/utils/date-helpers'
import type {Field, FieldAffectingData, SelectField,  UIField} from 'payload'
import { formatAdminURL } from 'payload/shared'
import { stringify } from 'qs-esm'
import { EntityType } from '@payloadcms/ui/shared'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Translates URL query conditions to the quick filter's internal state
export const parseWhereClauseToFilterValues = (
  where: any,
  fields: FilterDetaild[],
  locale: SupportedLocale,
): Record<string, any> => {
  const values: Record<string, any> = {}
  const fieldNames = new Set(fields.map((f) => {
    let fieldName = f.name;
    if (typeof f.virtual === 'string') {
      fieldName = f.virtual;
    }
    return fieldName;
  }))
  
  const recursiveParse = (clause: any) => {
    if (!clause || typeof clause !== 'object') return

    if (clause.and) {
      clause.and.forEach(recursiveParse)
      return
    }
    if (clause.or) {
      if (clause.or.length > 1) {
        return
      }
      clause.or.forEach(recursiveParse)
      return
    }
    for (const fieldName in clause) {
      if (fieldNames.has(fieldName)) {
        const fieldDef = fields.find((f) => f.name === fieldName)
        const condition = clause[fieldName]

        // Handle string values for date fields (e.g., 'todayAndFuture')
        if (fieldDef && fieldDef.type === 'date' && typeof condition === 'string') {
          const predefinedValue = condition
          if ([...pastOptionKeys, ...futureOptionKeys].includes(predefinedValue as any)) {
            values[fieldName] = {
              type: 'predefined',
              predefinedValue,
            }
            continue
          }
        }

        if (fieldDef && condition && typeof condition === 'object') {
          if ('equals' in condition) {
            if (fieldDef.type === 'checkbox') {
              values[fieldName] = (condition.equals == 'true'  || condition.equals === true) ? 'checked' : 'unchecked'
            } else if (fieldDef.type === 'select') {
              values[fieldName] = { selectedValues: [condition.equals] }
            }
          } else if ('in' in condition && Array.isArray(condition.in)) {
            if (fieldDef.type === 'select') {
              values[fieldName] = { selectedValues: condition.in }
            }
          } else if ('greater_than_equal' in condition || 'less_than_equal' in condition) {
            if (fieldDef.type === 'date') {
              const fromDate = condition.greater_than_equal
                ? new Date(condition.greater_than_equal)
                : null
              const toDate = condition.less_than_equal ? new Date(condition.less_than_equal) : null
              const allDateOptions = [...pastOptionKeys, ...futureOptionKeys]
              let matchedOption = null

              for (const option of allDateOptions) {
                const range = getDateRangeForOption(option, locale)
                let isFromMatch : boolean
                if (fromDate) {
                  isFromMatch = range.from?.toDateString() === fromDate.toDateString()
                } else if (fromDate == null && range.to == undefined) {
                  // all future: fromDate == null & range.to == undefined
                  isFromMatch = true
                }
                let isToMatch: boolean
                if (toDate) {
                  isToMatch = range.to?.toDateString() === toDate.toDateString()
                } else if (toDate == null && range.to == undefined) {
                  // all future: fromDate == null & range.to == undefined
                  isToMatch = true
                }

                if (isFromMatch && isToMatch) {
                  matchedOption = option
                  break
                }
              }

              if (matchedOption) {
                values[fieldName] = {
                  type: 'predefined',
                  predefinedValue: matchedOption,
                }
              } else {
                values[fieldName] = {
                  type: 'custom',
                  customRange: {
                    from: fromDate,
                    to: toDate,
                  },
                }
              }
            }
          }
        }
      }
    }
  }

  recursiveParse(where)
  return values
}
// Builds an array of condition objects from the quick filter values
export const buildQuickFilterConditions = (
  values: Record<string, any>,
  fieldDefs: FilterDetaild[],
  locale: SupportedLocale,
): Record<string, any>[] => {
  const conditions: Record<string, any>[] = []

  Object.entries(values).forEach(([fieldName, value]) => {
    if (!value) return
    const fieldDef = fieldDefs.find((f) => f.name === fieldName)
    if (!fieldDef) return
    if (typeof fieldDef.virtual == 'string'){
      fieldName = fieldDef.virtual
    }

    let condition: Record<string, any> | null = null

    switch (fieldDef.type) {
      case 'date': {
        const dateValue = value as DateFilterValue
        let from: Date | undefined
        let to: Date | undefined

        if (dateValue.predefinedValue) {
          const range = getDateRangeForOption(dateValue.predefinedValue, locale)
          from = range.from
          to = range.to
        } else if (dateValue.customRange) {
          if (dateValue.customRange.from) from = new Date(dateValue.customRange.from)
          if (dateValue.customRange.to) to = new Date(dateValue.customRange.to)
        }

        if (from || to) {
          const dateQuery: any = {}
          if (from) dateQuery.greater_than_equal = from
          if (to) dateQuery.less_than_equal = to
          if (Object.keys(dateQuery).length > 0) {
            condition = { [fieldName]: dateQuery }
          }
        }
        break
      }
      case 'select': {
        const selectValue = value as SelectFilterValue
        if (selectValue.selectedValues && selectValue.selectedValues.length > 0) {
          if (selectValue.selectedValues.length === 1) {
            condition = { [fieldName]: { equals: selectValue.selectedValues[0] } }
          } else {
            condition = { [fieldName]: { in: selectValue.selectedValues } }
          }
        }
        break
      }
      case 'checkbox': {
        const checkboxState = value as CheckboxFilterState
        if (checkboxState === 'checked') {
          condition = { [fieldName]: { equals: 'true' } }
        } else if (checkboxState === 'unchecked') {
          condition = { [fieldName]: { equals: 'false' } }
        }
        break
      }
    }
    if (condition) {
      conditions.push(condition)
    }
  })
  return conditions
}

// Recursive function to find a field by name
export function findFieldByName(fields: Field[], fieldName: string): Field {
  // First check at the current level
  const directMatch = fields.find(
    (f) => (f as FieldAffectingData).name === fieldName,
  )
  if (directMatch) return directMatch

  // If not found, search recursively in nested structures
  for (const item of fields) {
    // Check in array, row, or collapsible fields
    if (
      (item.type === 'array' || item.type === 'row' || item.type === 'collapsible') &&
      'fields' in item &&
      Array.isArray(item.fields)
    ) {
      const nestedMatch = findFieldByName(item.fields, fieldName)
      if (nestedMatch) return nestedMatch
    } 
    // Check in tabs
    else if (item.type === 'tabs' && Array.isArray(item.tabs)) {
      for (const tab of item.tabs) {
        if ('fields' in tab && Array.isArray(tab.fields)) {
          const tabMatch = findFieldByName(tab.fields, fieldName)
          if (tabMatch) return tabMatch
        }
      }
    } 
    // Check in blocks
    else if (item.type === 'blocks' && Array.isArray(item.blocks)) {
      for (const block of item.blocks) {
        if ('fields' in block && Array.isArray(block.fields)) {
          const blockMatch = findFieldByName(block.fields, fieldName)
          if (blockMatch) return blockMatch
        }
      }
    }
  }

  return null
}

// Process nav groups to add href with defaultFilter query parameters
export function processNavGroups(
  groups: any[], 
  collections: any[], 
  payload: any, 
  i18n: any
): any[] {
  return groups.map(group => {
    const processedEntities = group.entities.map(entity => {
      if (entity.type === EntityType.collection) {
        const collection = collections.find(c => c.slug === entity.slug);

        // Check if collection has defaultFilter in custom props
        if (collection?.custom?.defaultFilter) {
          // Base URL without query parameters
          const baseHref = formatAdminURL({ 
            adminRoute: payload.config.routes.admin, 
            path: `/collections/${entity.slug}` 
          });

          // Get the fields from the collection for parsing the where clause
          const fields: FilterDetaild[] =
            Object.keys(collection.custom.defaultFilter)
              ?.flat()
              .map((fieldName: string) => {
                const fieldConfig = findFieldByName(collection.fields, fieldName)
                return {
                  name: fieldName,
                  type: fieldConfig?.type,
                  options: (fieldConfig as SelectField)?.options,
                  label: (fieldConfig as UIField)?.label || fieldName,
                  row: 0,
                  virtual: 'virtual' in fieldConfig && fieldConfig.virtual
                } as FilterDetaild
              })
              .filter(Boolean) || []

          // If we have fields and a defaultFilter, calculate the URL with where clause
          if (fields.length > 0) {
            // Parse the defaultFilter to get filter values
            const filterValues = parseWhereClauseToFilterValues(
              collection.custom.defaultFilter,
              fields,
              i18n.language as SupportedLocale
            );
            // If we have filter values, add them to the URL
            if (Object.keys(filterValues).length > 0) {
              const quickFilterConditions = buildQuickFilterConditions(filterValues, fields, i18n.language as SupportedLocale)

              const whereCondition = quickFilterConditions.length === 1 ? quickFilterConditions[0] : { and: quickFilterConditions };
              const query = {
                where: whereCondition,
              };
              const stringifiedQuery = stringify(query, { addQueryPrefix: true });
              return {
                ...entity,
                href: `${baseHref}${stringifiedQuery}`
              };
            }
          }
        }
      }
      return entity;
    });

    return {
      ...group,
      entities: processedEntities
    };
  });
}
