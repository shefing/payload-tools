import type { Endpoint, PayloadHandler, Where } from 'payload'

import { compileWhere } from '../engine/compile.js'
import type { AbacAction, AbacPermissionsResponse, ResolvedProvider } from '../types.js'

const ACTIONS: AbacAction[] = ['read', 'create', 'update', 'delete']

type EndpointOptions = {
  getProvidersForCollection: (slug: string) => ResolvedProvider[]
  isCollectionEnabled: (slug: string) => boolean
}

const toJson = (body: unknown, status = 200): Response => {
  return Response.json(body, { status })
}

export const createMePermissionsHandler = ({
  getProvidersForCollection,
  isCollectionEnabled,
}: EndpointOptions): PayloadHandler => {
  return async (req) => {
    if (!req.user) {
      return toJson({ message: 'Unauthorized' }, 403)
    }

    const slug = req.searchParams.get('collection')

    if (!slug) {
      return toJson({ message: 'Missing collection query parameter' }, 400)
    }

    if (!isCollectionEnabled(slug)) {
      return toJson({ message: `Collection "${slug}" is not ABAC-enabled` }, 404)
    }

    const providers = getProvidersForCollection(slug)
    const whereByAction = await Promise.all(
      ACTIONS.map(async (action) => ({
        action,
        result: await compileWhere(providers, req.user, action, req),
      })),
    )

    const readWhere = whereByAction.find(({ action }) => action === 'read')?.result
    const actions = whereByAction
      .filter(({ result }) => result !== false)
      .map(({ action }) => action)

    const response: AbacPermissionsResponse = {
      collection: slug,
      where: readWhere === true || readWhere === false ? null : (readWhere as Where),
      actions,
    }

    return toJson(response)
  }
}

export const createMePermissionsEndpoint = (options: EndpointOptions): Endpoint => ({
  method: 'get',
  path: '/me/permissions',
  handler: createMePermissionsHandler(options),
})