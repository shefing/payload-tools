// Custom date utilities to replace date-fns
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function subDays(date: Date, days: number): Date {
  return addDays(date, -days)
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7)
}

export function subWeeks(date: Date, weeks: number): Date {
  return addWeeks(date, -weeks)
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export function subMonths(date: Date, months: number): Date {
  return addMonths(date, -months)
}

export function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

export function endOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(23, 59, 59, 999)
  return result
}

export function startOfWeek(date: Date, options: { weekStartsOn?: number } = {}): Date {
  const { weekStartsOn = 0 } = options
  const result = new Date(date)
  const day = result.getDay()
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn
  result.setDate(result.getDate() - diff)
  return startOfDay(result)
}

export function endOfWeek(date: Date, options: { weekStartsOn?: number } = {}): Date {
  const { weekStartsOn = 0 } = options
  const result = startOfWeek(date, { weekStartsOn })
  result.setDate(result.getDate() + 6)
  return endOfDay(result)
}

export function startOfMonth(date: Date): Date {
  const result = new Date(date)
  result.setDate(1)
  return startOfDay(result)
}

export function endOfMonth(date: Date): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + 1, 0)
  return endOfDay(result)
}

export function formatDate(date: Date, formatStr: string): string {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear().toString()

  switch (formatStr) {
    case 'dd/MM/yyyy':
      return `${day}/${month}/${year}`
    case 'dd/MM':
      return `${day}/${month}`
    case 'MM/yyyy':
      return `${month}/${year}`
    case 'PPP':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    default:
      return date.toLocaleDateString()
  }
}

export function getDateRangeForOption(
  option: string,
  locale: 'he' | 'en' = 'he',
): { from: Date; to: Date; description: string } {
  const now = new Date()
  const isHebrew = locale === 'he'

  switch (option) {
    case 'yesterday':
      const yesterday = subDays(now, 1)
      return {
        from: startOfDay(yesterday),
        to: endOfDay(yesterday),
        description: `(${formatDate(yesterday, 'dd/MM/yyyy')})`,
      }

    case 'lastWeek':
      const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 })
      const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 })
      return {
        from: lastWeekStart,
        to: lastWeekEnd,
        description: `(${formatDate(lastWeekStart, 'dd/MM')} - ${formatDate(lastWeekEnd, 'dd/MM/yyyy')})`,
      }

    case 'lastMonth':
      const lastMonthStart = startOfMonth(subMonths(now, 1))
      const lastMonthEnd = endOfMonth(subMonths(now, 1))
      return {
        from: lastMonthStart,
        to: lastMonthEnd,
        description: `(${formatDate(lastMonthStart, 'MM/yyyy')})`,
      }

    case 'allPast':
      return {
        from: new Date(1900, 0, 1),
        to: subDays(now, 1),
        description: isHebrew ? '(עד אתמול)' : '(until yesterday)',
      }

    case 'today':
      return {
        from: startOfDay(now),
        to: endOfDay(now),
        description: `(${formatDate(now, 'dd/MM/yyyy')})`,
      }

    case 'nextWeek':
      const thisWeekStart = startOfWeek(now, { weekStartsOn: 0 })
      const thisWeekEnd = endOfWeek(now, { weekStartsOn: 0 })
      return {
        from: thisWeekStart,
        to: thisWeekEnd,
        description: `(${formatDate(thisWeekStart, 'dd/MM')} - ${formatDate(thisWeekEnd, 'dd/MM/yyyy')})`,
      }

    case 'nextMonth':
      const thisMonthStart = startOfMonth(now)
      const thisMonthEnd = endOfMonth(now)
      return {
        from: thisMonthStart,
        to: thisMonthEnd,
        description: `(${formatDate(thisMonthStart, 'MM/yyyy')})`,
      }

    case 'allFuture':
      return {
        from: now,
        to: new Date(2100, 11, 31),
        description: isHebrew ? '(מהיום ואילך)' : '(from today onwards)',
      }

    default:
      return {
        from: now,
        to: now,
        description: '',
      }
  }
}
