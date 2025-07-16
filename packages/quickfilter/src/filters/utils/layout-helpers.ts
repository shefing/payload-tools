import { FilterDetaild, FilterRow } from '../types/filters-type'

export function groupFiltersByRow(filters: FilterDetaild[]): FilterRow[] {
  // Group filters by row number
  const groupedFilters = filters.reduce(
    (acc, filter) => {
      const rowNumber = filter.row ?? 0
      if (!acc[rowNumber]) {
        acc[rowNumber] = []
      }
      acc[rowNumber].push(filter)
      return acc
    },
    {} as Record<number, FilterDetaild[]>,
  )

  // Convert to array and sort filters within each row by order
  const rows: FilterRow[] = Object.entries(groupedFilters)
    .map(([rowNumber, filters]) => ({
      rowNumber: Number.parseInt(rowNumber),
      filters: filters,
    }))
    .sort((a, b) => a.rowNumber - b.rowNumber)

  return rows
}

export function getFilterWidthClass(width?: string): string {
  switch (width) {
    case 'sm':
      return 'w-full max-w-xs'
    case 'md':
      return 'w-full max-w-sm'
    case 'lg':
      return 'w-full max-w-md'
    case 'xl':
      return 'w-full max-w-lg'
    case 'full':
      return 'w-full'
    case 'auto':
    default:
      return 'w-auto min-w-fit'
  }
}

export function getGridColumnsClass(filtersCount: number): string {
  switch (filtersCount) {
    case 1:
      return 'grid-cols-1'
    case 2:
      return 'grid-cols-1 md:grid-cols-2'
    case 3:
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    case 4:
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
    case 5:
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
    case 6:
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
    default:
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }
}

export const parseColumns = (raw: unknown): string[] => {
  if (Array.isArray(raw)) {
    return raw
  }

  if (typeof raw === 'string') {
    try {
      const cleaned = raw
        .trim()
        .replace(/^"+/, '')
        .replace(/"+$/, '')
        .replace(/\\"/g, '"')
        .replace(/\\+"/g, '"')
        .replace(/\\\\/g, '\\')

      const parsed = JSON.parse(cleaned)

      if (Array.isArray(parsed)) {
        console.log('Parsed columns:', parsed)
        console.log('row:', raw)
        return parsed
      }
    } catch (err) {
      console.warn('Failed to parse columns string:', raw, err)
    }
  }

  return []
}
