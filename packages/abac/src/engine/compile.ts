import type { Where } from 'payload'

import type {
  AbacAction,
  AbacDocument,
  AbacUser,
  ResolvedProvider,
} from '../types.js'

const EMPTY_RESULTS_WHERE: Where = {
  id: {
    exists: false,
  },
}

const hasValue = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.length > 0
  }

  return value !== null && value !== undefined
}

const normalizeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeValue(entry))
  }

  if (value && typeof value === 'object' && 'id' in value) {
    return normalizeValue((value as { id?: unknown }).id)
  }

  return value
}

const getValueAtPath = (doc: AbacDocument, path: string): unknown => {
  return path.split('.').reduce<unknown>((currentValue, segment) => {
    if (currentValue && typeof currentValue === 'object' && segment in currentValue) {
      return (currentValue as Record<string, unknown>)[segment]
    }

    return undefined
  }, doc)
}

const getFallbackDocValue = (doc: AbacDocument, provider: ResolvedProvider): unknown => {
  return getValueAtPath(doc, provider.config.docField)
}

const warnAndReturn = <T>(error: unknown, fallback: T): T => {
  console.warn('[abac] provider evaluation failed, denying access', error)
  return fallback
}

export const getEmptyResultsWhere = (): Where => EMPTY_RESULTS_WHERE

export const resolveUserValue = async (
  resolvedProvider: ResolvedProvider,
  user: AbacUser,
  req?: Parameters<typeof resolvedProvider.provider.fromUser>[1],
): Promise<unknown> => {
  return resolvedProvider.provider.fromUser(user, req as never)
}

export const compileWhere = async (
  providers: ResolvedProvider[],
  user: AbacUser | null | undefined,
  action: AbacAction,
  req?: Parameters<ResolvedProvider['provider']['fromUser']>[1],
): Promise<Where | true | false> => {
  if (!user) {
    return false
  }

  if (user.isAdmin === true) {
    return true
  }

  const whereConditions: Where[] = []

  for (const resolvedProvider of providers) {
    if (resolvedProvider.config.actions && !resolvedProvider.config.actions.includes(action)) {
      continue
    }

    try {
      const userValue = normalizeValue(await resolveUserValue(resolvedProvider, user, req))

      if (!hasValue(userValue)) {
        return getEmptyResultsWhere()
      }

      if (!resolvedProvider.provider.toWhere) {
        continue
      }

      whereConditions.push(resolvedProvider.provider.toWhere(userValue))
    } catch (error) {
      return warnAndReturn(error, false)
    }
  }

  if (whereConditions.length === 0) {
    return true
  }

  if (whereConditions.length === 1) {
    return whereConditions[0]
  }

  return {
    and: whereConditions,
  }
}

export const decideCreate = async (
  providers: ResolvedProvider[],
  user: AbacUser | null | undefined,
  data: AbacDocument,
  req?: Parameters<ResolvedProvider['provider']['fromUser']>[1],
): Promise<boolean> => {
  if (!user) {
    return false
  }

  if (user.isAdmin === true) {
    return true
  }

  for (const resolvedProvider of providers) {
    if (resolvedProvider.config.actions && !resolvedProvider.config.actions.includes('create')) {
      continue
    }

    try {
      const userValue = normalizeValue(await resolveUserValue(resolvedProvider, user, req))

      if (!hasValue(userValue)) {
        return false
      }

      const docValue = normalizeValue(getFallbackDocValue(data, resolvedProvider))

      // If the doc field is not yet set, allow creation — the beforeChange hook will stamp it.
      if (!hasValue(docValue)) {
        continue
      }

      const matches = await resolvedProvider.provider.match(userValue, docValue)

      if (!matches) {
        return false
      }
    } catch (error) {
      return warnAndReturn(error, false)
    }
  }

  return true
}