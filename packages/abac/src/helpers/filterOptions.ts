import type { PayloadRequest, Where } from 'payload'

import { getRegisteredProvider } from '../pluginContext.js'

export const abacFilterOptions = (key: string) => {
  return async ({ req }: { req: PayloadRequest }): Promise<Where | boolean> => {
    const provider = getRegisteredProvider(key)

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