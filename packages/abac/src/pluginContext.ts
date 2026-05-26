import type { AttributeProvider } from './types.js'

export type PluginContext = {
  getProvider(key: string): AttributeProvider | undefined
  getAllProviders(): AttributeProvider[]
}

// Module augmentation: expose `abacContext` as a typed property on PayloadRequest
// so consumers (access fns, filterOptions helper) don't need `(req as any)` casts.
declare module 'payload' {
  interface PayloadRequest {
    abacContext?: PluginContext
  }
}

export const createPluginContext = (providers: AttributeProvider[]): PluginContext => {
  const registry = new Map<string, AttributeProvider>()
  for (const p of providers) {
    registry.set(p.key, p)
  }

  return {
    getProvider: (key) => registry.get(key),
    getAllProviders: () => [...registry.values()],
  }
}
