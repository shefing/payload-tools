import type { AttributeProvider } from './types.js'

const providerRegistry = new Map<string, AttributeProvider>()

export const registerProviders = (providers: AttributeProvider[]): void => {
  providerRegistry.clear()

  for (const provider of providers) {
    providerRegistry.set(provider.key, provider)
  }
}

export const getRegisteredProvider = (key: string): AttributeProvider | undefined => {
  return providerRegistry.get(key)
}