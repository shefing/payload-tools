'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useConfig, useListQuery, useTranslation } from '@payloadcms/ui'
import type { ClientField, FieldAffectingData, ListQuery, OptionObject, SelectField } from 'payload'
import { getTranslation } from '@payloadcms/translations'
import FilterField from './FilterField'
import { getLabel, SupportedLocale } from './labels'
import type {
  DateFilterValue,
  FilterDetaild,
  FilterRow,
  SelectFilterValue,
} from './filters/types/filters-type'
import { groupFiltersByRow } from './filters/utils/layout-helpers'
import { ChevronDown, ChevronUp, Filter, RefreshCw, X } from 'lucide-react'
import { isEqual } from 'lodash'
import { getDateFilterOptions } from './filters/constants/date-filter-options'
import { Button } from './ui/button'
import {
  buildQuickFilterConditions,
  parseWhereClauseToFilterValues,
} from './lib/utils'

// Helper function to get localized label
const getLocalizedLabel = (label: any, locale: SupportedLocale): string => {
  if (typeof label === 'object' && label !== null) {
    return label[locale] || label['en'] || Object.values(label)[0] || ''
  }
  return label || ''
}

// Recursive function to find fields by name
function findFieldsByName(fields: ClientField[], fieldNames: string[]): ClientField[] {
  const results: ClientField[] = []
  function recursiveSearch(currentFields: ClientField[]) {
    const filteredFields = currentFields.filter(
      (field) =>
        ('name' in field && fieldNames.includes(field.name as string)) ||
        ('virtual' in field &&
          fieldNames.includes(field.virtual as string)),
    )
    results.push(...filteredFields)
    currentFields.forEach((item) => {
      if (
        (item.type === 'array' || item.type === 'row' || item.type === 'collapsible') &&
        'fields' in item &&
        Array.isArray(item.fields)
      ) {
        recursiveSearch(item.fields)
      } else if (item.type === 'tabs' && Array.isArray(item.tabs)) {
        item.tabs.forEach((tab) => {
          if ('fields' in tab && Array.isArray(tab.fields)) {
            recursiveSearch(tab.fields)
          }
        })
      } else if (item.type === 'blocks' && Array.isArray(item.blocks)) {
        item.blocks.forEach((block) => {
          if ('fields' in block && Array.isArray(block.fields)) {
            recursiveSearch(block.fields)
          }
        })
      }
    })
  }
  recursiveSearch(fields)
  return results
}

// Helper function to remove quick filter conditions from a 'where' clause
const cleanWhereClause = (clause: any, fieldsToClean: Set<string>): any => {
  if (!clause || typeof clause !== 'object' || Array.isArray(clause)) {
    return clause
  }

  const newClause: Record<string, any> = {}

  for (const key in clause) {
    if (key === 'and' || key === 'or') {
      const cleanedSubClauses = clause[key]
        .map((subClause: any) => cleanWhereClause(subClause, fieldsToClean))
        .filter(Boolean)

      if (cleanedSubClauses.length > 0) {
        newClause[key] = cleanedSubClauses
      }
    } else if (!fieldsToClean.has(key)) {
      newClause[key] = clause[key]
    }
  }

  if (Object.keys(newClause).length === 0) {
    return null
  }

  if (newClause.and?.length === 1 && Object.keys(newClause).length === 1) {
    return newClause.and[0]
  }
  if (newClause.or?.length === 1 && Object.keys(newClause).length === 1) {
    return newClause.or[0]
  }

  return newClause
}

const QuickFilter = ({
  slug,
  filterList,
}: {
  slug: string
  filterList: (string | { name: string; width: string; })[][]
}) => {
  const [fields, setFields] = useState<FilterDetaild[]>([])
  const [filterRows, setFilterRows] = useState<FilterRow[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const { refineListData, query } = useListQuery()
  const { getEntityConfig } = useConfig()
  const { i18n } = useTranslation()
  const locale = i18n.language as SupportedLocale

  const [filterValues, setFilterValues] = useState<Record<string, any>>({})

  // Build the list of filter fields from config
  useEffect(() => {
    const collection = getEntityConfig({ collectionSlug: slug })
    const flattenedFieldConfigs = filterList.flatMap((row, rowIndex) =>
      row.map((field, fieldIndex) => ({
        field,
        rowIndex,
        fieldIndex,
      })),
    )
    const fieldNames = flattenedFieldConfigs.map(({ field }) =>
      typeof field === 'string' ? field : field.name,
    )

    const matchedFields = findFieldsByName(collection?.fields || [], fieldNames)
    const simplifiedFields: FilterDetaild[] = matchedFields.map((field) => {
      const label = (field as FieldAffectingData).label
      const translatedLabel = getTranslation(label as string, i18n)
      const fieldName = (field as FieldAffectingData).name as string
      const fieldConfig = flattenedFieldConfigs.find(({ field: f }) =>
        typeof f === 'string' ? f === fieldName : f.name === fieldName,
      )
      return {
        name: fieldName,
        label: translatedLabel as string,
        type: field.type,
        options: (field as SelectField).options as OptionObject[],
        row: fieldConfig ? fieldConfig.rowIndex : 0,
        virtual: 'virtual' in field ? (field.virtual as string | boolean) : undefined,
        width:
          typeof fieldConfig?.field === 'object' && 'width' in fieldConfig.field
            ? fieldConfig.field.width
            : undefined,
      }
    })
    const sortedFields = flattenedFieldConfigs
      .map(({ field }) => {
        const fieldName = typeof field === 'string' ? field : field.name
        return simplifiedFields.find((f) => f.name === fieldName)
      })
      .filter((f): f is FilterDetaild => !!f)
    setFields(sortedFields)
    setFilterRows(groupFiltersByRow(sortedFields))
  }, [slug, filterList, getEntityConfig, i18n])
  // Sync from URL (query.where) into internal state
  useEffect(() => {
    if (fields.length === 0) return
    const valuesFromQuery: Record<string, any> = parseWhereClauseToFilterValues(
      query.where,
      fields,
      locale,
    )
    if (!isEqual(filterValues, valuesFromQuery)) {
      // Lock to prevent feedback loop when internal state changes
      setFilterValues(valuesFromQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.where, fields])

  // Sync internal state (filterValues) back into the URL
  useEffect(() => {
    if (fields.length === 0) return
    const valuesFromQuery: Record<string, any> = parseWhereClauseToFilterValues(
      query.where,
      fields,
      locale,
    )
    if (Object.keys(filterValues).length == 0 && !query.where) {
    }
    if (isEqual(filterValues, valuesFromQuery)) {
      return
    }
    const quickFilterConditions = buildQuickFilterConditions(filterValues, fields, locale)
    const quickFilterFieldNames = new Set(
      fields.map((f) => {
        let name = f.name
        if (typeof f.virtual === 'string') {
          name = f.virtual
        }
        return name
      }),
    )
    const otherFilters = cleanWhereClause(query.where, quickFilterFieldNames)

    const allConditions = [...quickFilterConditions]
    if (otherFilters) {
      if (otherFilters.and && Array.isArray(otherFilters.and)) {
        allConditions.push(...otherFilters.and)
      } else if (Object.keys(otherFilters).length > 0) {
        allConditions.push(otherFilters)
      }
    }

    let newWhere: Record<string, any> = {}
    if (allConditions.length > 1) {
      newWhere = { and: allConditions }
    } else if (allConditions.length === 1) {
      newWhere = allConditions[0]
    }

    // Only update if the query has actually changed to avoid unnecessary updates
    if (!(isEqual(newWhere, query.where) || (Object.keys(newWhere).length == 0 && !query.where))) {
      const refinedData = {
        where: newWhere,
        page: 1,
      } as ListQuery

      refineListData(refinedData).then((r) => {
        console.log('Query refreshed', refinedData)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterValues])

  // Updates only the internal state
  const handleFilterChange = useCallback((fieldName: string, value: any) => {
    setFilterValues((prev) => {
      const newValues = { ...prev }
      if (
        value === undefined ||
        value === null ||
        value === 'indeterminate' ||
        (value && value.type === 'none')
      ) {
        delete newValues[fieldName]
      } else {
        newValues[fieldName] = value
      }
      return newValues
    })
  }, [])

  // This function remains largely the same.
  const getActiveFiltersDetails = () => {
    const activeFilters: string[] = []
    const locale = i18n.language as SupportedLocale
    Object.entries(filterValues).forEach(([fieldName, value]) => {
      const field = fields.find((f) => {
        let name = f.name
        if (typeof f.virtual === 'string') {
          name = f.virtual
        }
        return name === fieldName
      })
      if (!field) return

      switch (field.type) {
        case 'date':
          if (value !== undefined) {
            const dateValue = value as DateFilterValue
            let dateDescription = ''

            if (dateValue.type === 'predefined' && dateValue.predefinedValue) {
              const { pastOptions, futureOptions } = getDateFilterOptions(locale)
              const allOptions = [...pastOptions, ...futureOptions]
              const option = allOptions.find((opt) => opt.value === dateValue.predefinedValue)
              dateDescription = option ? option.label : getLabel('custom', locale)
            } else if (dateValue.type === 'custom' || dateValue.customRange) {
              dateDescription = getLabel('custom', locale)
            }

            if (dateDescription) {
              activeFilters.push(`${field.label} (${dateDescription})`)
            }
          }
          break
        case 'select': {
          const selectValue = value as SelectFilterValue
          if (selectValue && selectValue.selectedValues && selectValue.selectedValues.length > 0) {
            const totalOptions = field.options?.length || 0

            if (selectValue.selectedValues.length === totalOptions) {
              activeFilters.push(`${field.label} (${getLabel('all', locale)})`)
            } else if (selectValue.selectedValues.length === 1) {
              // Show the actual option name when only one is selected
              const selectedOption = field.options?.find(
                (opt: any) => opt.value === selectValue.selectedValues[0],
              )
              const optionLabel = selectedOption
                ? getLocalizedLabel(selectedOption.label, locale)
                : selectValue.selectedValues[0]
              activeFilters.push(`${field.label} (${optionLabel})`)
            } else {
              // Show count for multiple selections
              activeFilters.push(`${field.label} (${selectValue.selectedValues.length})`)
            }
          }
          break
        }
        case 'checkbox':
          if (value !== 'indeterminate') {
            const checkboxValue =
              value === 'checked' ? getLabel('yes', locale) : getLabel('no', locale)
            activeFilters.push(`${field.label} (${checkboxValue})`)
          }
          break
      }
    })

    return activeFilters
  }

  const clearAllFilters = () => {
    setFilterValues({})
  }

  const refreshFilters = () => {
    refineListData(query)
  }

  const memoizedFilterRows = useMemo(() => {
    return filterRows.map((row) => (
      <div key={row.rowNumber}>
        <div className="flex flex-wrap gap-6 mb-4">
          {row.filters.map((field) => {
            let fieldName = field.name
            if (typeof field.virtual === 'string') {
              fieldName = field.virtual
            }
            return (
              <FilterField
                key={field.name}
                field={field}
                onFilterChange={handleFilterChange}
                value={filterValues[fieldName]}
              />
            )
          })}
        </div>
      </div>
    ))
  }, [filterRows, handleFilterChange, filterValues])

  const toggleFilters = () => {
    setShowFilters((prev) => !prev)
  }

  const activeFiltersDetails = getActiveFiltersDetails()
  const hasActiveFilters = activeFiltersDetails.length > 0

  if (!fields.length) return null

  return (
    <div className="filter-container useTw">
      <div style={{ position: 'relative', top: '-24px', height: '0px' }}>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFilters}
          className={`flex items-center gap-2 bg-background border-muted-muted hover:bg-muted ${
            hasActiveFilters ? 'w-auto min-w-fit' : ''
          }`}
        >
          <Filter className={`h-4 w-4 ${hasActiveFilters ? 'fill-current' : ''}`} />

          {hasActiveFilters ? (
            <>
              <span className="text-sm truncate">
                <strong>
                  {`${activeFiltersDetails.length === 1 ? getLabel('activeFilterSingular', locale) : getLabel('activeFilterPlural', locale)}: `}
                </strong>{' '}
                {activeFiltersDetails.join(' • ')}
              </span>

              <span
                onClick={(e) => {
                  e.stopPropagation()
                  clearAllFilters()
                }}
                className="ml-1 p-0.5 hover:bg-muted rounded-sm transition-colors flex-shrink-0"
              >
                <X className="h-3 w-3 text-gray-500" />
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  refreshFilters()
                }}
                className="ml-1 p-0.5 hover:bg-muted rounded-sm transition-colors flex-shrink-0"
              >
                <RefreshCw className="h-3 w-3 text-gray-500" />
              </span>
            </>
          ) : (
            <span className="text-sm truncate">{getLabel('quickFilters', locale)}</span>
          )}

          {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      {showFilters && <div className={'p-4 pb-2 bg-muted'}>{memoizedFilterRows}</div>}
    </div>
  )
}

export default QuickFilter
