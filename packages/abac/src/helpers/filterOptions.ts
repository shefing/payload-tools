import type { PayloadRequest, Where } from 'payload'

import '../pluginContext.js'

export const abacFilterOptions = (key: string) => {
  return async ({ req }: { req: PayloadRequest }): Promise<Where | boolean> => {
    const ctx = req.abacContext

    // Fail-closed: if the plugin context is not attached to the request, we cannot
    // resolve providers. Returning `true` here would silently disable filtering and
    // expose all rows. Deny instead.
    if (!ctx) {
      return false
    }

    const provider = ctx.getProvider(key)

    if (!provider || !provider.toWhere || !req.user) {
      return true
    }

    const userValue = await provider.fromUser(req.user, req)

    if (userValue === null || userValue === undefined || (Array.isArray(userValue) && userValue.length === 0)) {
      return false
    }

    return provider.toWhere(userValue)
  }
}

export default abacFilterOptions