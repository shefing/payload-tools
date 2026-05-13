import type { AbacUser, AttributeProvider } from '../types.js'

export const enrichJWT = async (
  providers: AttributeProvider[],
  user: AbacUser,
): Promise<Record<string, unknown>> => {
  const enrichedPayload: Record<string, unknown> = {}

  for (const provider of providers) {
    if (!provider.enrichJWT) {
      continue
    }

    const nextPayload = await provider.enrichJWT(user)

    for (const [key, value] of Object.entries(nextPayload)) {
      if (key in enrichedPayload) {
        console.warn(`[abac] enrichJWT key collision for "${key}", last value wins`)
      }

      enrichedPayload[key] = value
    }
  }

  return enrichedPayload
}