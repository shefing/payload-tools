import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
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

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function handleNavigation(
  href: string,
  e: React.MouseEvent,
  pathname: string,
  router: AppRouterInstance,
) {
  // Check if we're on holdings page and there's a navigation handler
  if (
    pathname === '/holdings' &&
    typeof window !== 'undefined' &&
    (window as unknown as Record<string, unknown>).holdingsNavigationHandler
  ) {
    const canNavigate = (
      (window as unknown as Record<string, unknown>).holdingsNavigationHandler as (
        href: string,
      ) => boolean
    )(href)
    if (!canNavigate) {
      e.preventDefault()
      return
    }
  }
  router.push(href)
}

// Translates URL query conditions to the quick filter's internal state
export const parseWhereClauseToFilterValues = (
  where: any,
  fields: FilterDetaild[],
  locale: SupportedLocale,
): Record<string, any> => {
  const values: Record<string, any> = {}
  const fieldNames = new Set(fields.map((f) => f.name))

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
              values[fieldName] = condition.equals == 'true' ? 'checked' : 'unchecked'
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
                let isFromMatch
                if (fromDate) {
                  isFromMatch = range.from?.toDateString() === fromDate.toDateString()
                } else if (fromDate == null && range.to == undefined) {
                  // all future: fromDate == null & range.to == undefined
                  isFromMatch = true
                }
                let isToMatch
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