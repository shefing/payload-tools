import type { AttributeProvider } from './types.js'

export type PluginContext = {
  getProvider(key: string): AttributeProvider | undefined
  getAllProviders(): AttributeProvider[]
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
