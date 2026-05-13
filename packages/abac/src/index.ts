import type { Access, AccessResult, CollectionConfig, Config, Endpoint, PayloadRequest, Where } from 'payload'

import { compileWhere, decideCreate } from './engine/compile.js'
import { enrichJWT } from './engine/enrichJWT.js'
import { createMePermissionsEndpoint } from './endpoints/mePermissions.js'
import { abacFilterOptions } from './helpers/filterOptions.js'
import { registerProviders } from './pluginContext.js'
import type { AbacPluginConfig } from './types.js'
export { tenantAttribute } from './providers/tenant.js'
export { roleAttribute } from './providers/role.js'
export { abacFilterOptions } from './helpers/filterOptions.js'

export type {
  AbacAction,
  AbacCollectionAttributeConfig,
  AbacCollectionConfig,
  AbacDocument,
  AbacPluginConfig,
  AbacPermissionsResponse,
  AbacUser,
  AttributeProvider,
  ResolvedAttributeConfig,
  ResolvedProvider,
} from './types.js'

const ACTIONS = ['read', 'create', 'update', 'delete'] as const

type AbacAction = (typeof ACTIONS)[number]

type AbacCollectionLike = CollectionConfig & {
  custom?: {
    abac?: Record<string, { actions?: AbacAction[]; docField: string; stampOnCreate?: boolean }>
  }
}

const hasValue = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.length > 0
  }

  return value !== null && value !== undefined
}

const normalizeRelationshipValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeRelationshipValue(entry))
  }

  if (value && typeof value === 'object' && 'id' in value) {
    return normalizeRelationshipValue((value as { id?: unknown }).id)
  }

  return value
}

const getPathValue = (value: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce<unknown>((currentValue, segment) => {
    if (currentValue && typeof currentValue === 'object' && segment in currentValue) {
      return (currentValue as Record<string, unknown>)[segment]
    }

    return undefined
  }, value)
}

const setPathValue = (value: Record<string, unknown>, path: string, nextValue: unknown): void => {
  const segments = path.split('.')
  let currentValue: Record<string, unknown> = value

  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      currentValue[segment] = nextValue
      return
    }

    const existingValue = currentValue[segment]

    if (!existingValue || typeof existingValue !== 'object' || Array.isArray(existingValue)) {
      currentValue[segment] = {}
    }

    currentValue = currentValue[segment] as Record<string, unknown>
  })
}

const isIncludedCollection = (slug: string, config: AbacPluginConfig): boolean => {
  if (config.includedCollections) {
    return config.includedCollections.includes(slug)
  }

  if (config.excludedCollections) {
    return !config.excludedCollections.includes(slug)
  }

  return true
}

const andAccessResults = (left: AccessResult, right: AccessResult): AccessResult => {
  if (left === false || right === false) {
    return false
  }

  if (left === true) {
    return right
  }

  if (right === true) {
    return left
  }

  return {
    and: [left as Where, right as Where],
  }
}

const composeAccess = (
  previousAccess: Access | undefined,
  computeAccess: (req: PayloadRequest, data?: Record<string, unknown>) => Promise<AccessResult>,
): Access => {
  return async ({ data, req }) => {
    const previousResult = previousAccess ? await previousAccess({ data, req }) : true
    const nextResult = await computeAccess(req, data as Record<string, unknown> | undefined)

    return andAccessResults(previousResult, nextResult)
  }
}

export const abacPlugin = (pluginConfig: AbacPluginConfig) => (incomingConfig: Config): Config => {
  registerProviders(pluginConfig.attributes)

  const providersByKey = new Map(pluginConfig.attributes.map((provider) => [provider.key, provider]))
  const collectionProviderMap = new Map<string, { collection: AbacCollectionLike; providers: import('./types.js').ResolvedProvider[] }>()

  const collections = (incomingConfig.collections ?? []).map((collection) => {
    const nextCollection = { ...collection } as AbacCollectionLike

    if (!isIncludedCollection(nextCollection.slug, pluginConfig)) {
      return nextCollection
    }

    const collectionAbacConfig = nextCollection.custom?.abac

    if (!collectionAbacConfig) {
      return nextCollection
    }

    const resolvedProviders = Object.entries(collectionAbacConfig).map(([key, value]) => {
      const provider = providersByKey.get(key)

      if (!provider) {
        throw new Error(`ABAC provider "${key}" referenced by collection "${nextCollection.slug}" is not registered`)
      }

      return {
        provider,
        config: {
          key,
          docField: value.docField,
          stampOnCreate: value.stampOnCreate,
          actions: value.actions ?? [...ACTIONS],
        },
      }
    })

    collectionProviderMap.set(nextCollection.slug, {
      collection: nextCollection,
      providers: resolvedProviders,
    })

    const previousAccess = nextCollection.access ?? {}

    nextCollection.access = {
      ...previousAccess,
      read: composeAccess(previousAccess.read, async (req) => compileWhere(resolvedProviders, req.user, 'read', req)),
      update: composeAccess(previousAccess.update, async (req) => compileWhere(resolvedProviders, req.user, 'update', req)),
      delete: composeAccess(previousAccess.delete, async (req) => compileWhere(resolvedProviders, req.user, 'delete', req)),
      create: composeAccess(previousAccess.create, async (req, data) => {
        return (await decideCreate(resolvedProviders, req.user, data ?? {}, req)) ? true : false
      }),
    }

    const beforeChange = async ({ data, operation, req }: { data: Record<string, unknown>; operation: string; req: PayloadRequest }) => {
      if (operation !== 'create' || !req.user) {
        return data
      }

      const nextData = { ...data }

      for (const resolvedProvider of resolvedProviders) {
        if (resolvedProvider.config.stampOnCreate === false) {
          continue
        }

        const existingValue = getPathValue(nextData, resolvedProvider.config.docField)

        if (hasValue(existingValue)) {
          continue
        }

        const userValue = normalizeRelationshipValue(await resolvedProvider.provider.fromUser(req.user, req))

        if (hasValue(userValue)) {
          setPathValue(nextData, resolvedProvider.config.docField, userValue)
        }
      }

      return nextData
    }

    nextCollection.hooks = {
      ...nextCollection.hooks,
      beforeChange: [beforeChange as never, ...(nextCollection.hooks?.beforeChange ?? [])],
    }

    if (nextCollection.auth) {
      const afterLogin = async ({ req, user }: { req: PayloadRequest; user: Record<string, unknown> }) => {
        req.user = {
          ...(req.user ?? {}),
          ...user,
          ...(await enrichJWT(pluginConfig.attributes, user)),
        } as PayloadRequest['user']
      }

      nextCollection.hooks = {
        ...nextCollection.hooks,
        afterLogin: [afterLogin as never, ...(nextCollection.hooks?.afterLogin ?? [])],
      }
    }

    return nextCollection
  })

  const endpoint: Endpoint = createMePermissionsEndpoint({
    getProvidersForCollection: (slug) => collectionProviderMap.get(slug)?.providers ?? [],
    isCollectionEnabled: (slug) => collectionProviderMap.has(slug),
  })

  return {
    ...incomingConfig,
    collections,
    endpoints: [...(incomingConfig.endpoints ?? []), endpoint],
  }
}

export default abacPlugin