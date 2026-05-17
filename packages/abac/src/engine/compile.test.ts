import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { compileWhere, decideCreate, getEmptyResultsWhere } from './compile.js'
import { enrichJWT } from './enrichJWT.js'
import type { ResolvedProvider, AttributeProvider } from '../types.js'

const makeProvider = (overrides: Partial<ResolvedProvider> = {}): ResolvedProvider => {
  return {
    config: {
      key: 'tenant',
      docField: 'tenant',
      actions: ['read', 'create', 'update', 'delete'],
    },
    provider: {
      key: 'tenant',
      fromUser: async (user) => user.tenant,
      match: (userValue, docValue) => userValue === docValue,
      toWhere: (userValue) => ({ tenant: { equals: userValue } }),
    },
    ...overrides,
  }
}

describe('compileWhere', () => {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

  beforeEach(() => {
    warnSpy.mockClear()
  })

  afterEach(() => {
    warnSpy.mockClear()
  })

  it('returns false for unauthenticated users', async () => {
    await expect(compileWhere([], null, 'read')).resolves.toBe(false)
  })

  it('returns true when there are no applicable providers', async () => {
    await expect(compileWhere([], { id: '1' }, 'read')).resolves.toBe(true)
  })

  it('returns a single where clause when only one provider applies', async () => {
    const provider = makeProvider()

    await expect(compileWhere([provider], { id: '1', tenant: 'tenant-a' }, 'read')).resolves.toEqual({
      tenant: { equals: 'tenant-a' },
    })
  })

  it('intersects multiple where clauses with an and wrapper', async () => {
    const tenant = makeProvider()
    const region = makeProvider({
      config: {
        key: 'region',
        docField: 'region',
        actions: ['read'],
      },
      provider: {
        key: 'region',
        fromUser: async (user) => user.region,
        match: (userValue, docValue) => userValue === docValue,
        toWhere: (userValue) => ({ or: [{ region: { equals: userValue } }] }),
      },
    })

    await expect(
      compileWhere([tenant, region], { id: '1', tenant: 'tenant-a', region: 'emea' }, 'read'),
    ).resolves.toEqual({
      and: [{ tenant: { equals: 'tenant-a' } }, { or: [{ region: { equals: 'emea' } }] }],
    })
  })

  it('returns an empty-result where when the user misses a required attribute', async () => {
    await expect(compileWhere([makeProvider()], { id: '1', tenant: null }, 'read')).resolves.toEqual(
      getEmptyResultsWhere(),
    )
  })

  it('treats empty arrays as missing user attributes', async () => {
    const provider = makeProvider({
      provider: {
        key: 'tenant',
        fromUser: async (user) => user.tenants,
        match: (userValue, docValue) => Array.isArray(userValue) && userValue.includes(docValue),
        toWhere: (userValue) => ({ tenant: { in: userValue as string[] } }),
      },
    })

    await expect(compileWhere([provider], { id: '1', tenants: [] }, 'read')).resolves.toEqual(
      getEmptyResultsWhere(),
    )
  })

  it('ignores providers that do not expose toWhere', async () => {
    const provider = makeProvider({
      provider: {
        key: 'tenant',
        fromUser: async (user) => user.tenant,
        match: (userValue, docValue) => userValue === docValue,
      },
    })

    await expect(compileWhere([provider], { id: '1', tenant: 'tenant-a' }, 'read')).resolves.toBe(true)
  })

  it('skips providers that are not configured for the current action', async () => {
    const provider = makeProvider({
      config: {
        key: 'tenant',
        docField: 'tenant',
        actions: ['create'],
      },
    })

    await expect(compileWhere([provider], { id: '1', tenant: 'tenant-a' }, 'read')).resolves.toBe(true)
  })

  it('fails closed when fromUser throws', async () => {
    const provider = makeProvider({
      provider: {
        key: 'tenant',
        fromUser: async () => {
          throw new Error('boom')
        },
        match: () => true,
        toWhere: () => ({ tenant: { equals: 'tenant-a' } }),
      },
    })

    await expect(compileWhere([provider], { id: '1' }, 'read')).resolves.toBe(false)
    expect(warnSpy).toHaveBeenCalled()
  })

  it('fails closed when toWhere throws', async () => {
    const provider = makeProvider({
      provider: {
        key: 'tenant',
        fromUser: async (user) => user.tenant,
        match: () => true,
        toWhere: () => {
          throw new Error('boom')
        },
      },
    })

    await expect(compileWhere([provider], { id: '1', tenant: 'tenant-a' }, 'read')).resolves.toBe(false)
    expect(warnSpy).toHaveBeenCalled()
  })
})

describe('decideCreate', () => {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

  beforeEach(() => {
    warnSpy.mockClear()
  })

  it('returns false for unauthenticated users', async () => {
    await expect(decideCreate([], null, {})).resolves.toBe(false)
  })

  it('returns true when all providers match', async () => {
    await expect(
      decideCreate([makeProvider()], { id: '1', tenant: 'tenant-a' }, { tenant: 'tenant-a' }),
    ).resolves.toBe(true)
  })

  it('returns false when any provider does not match', async () => {
    await expect(
      decideCreate([makeProvider()], { id: '1', tenant: 'tenant-a' }, { tenant: 'tenant-b' }),
    ).resolves.toBe(false)
  })

  it('allows creation when the doc field is empty (will be stamped by beforeChange)', async () => {
    await expect(
      decideCreate([makeProvider()], { id: '1', tenant: 'tenant-a' }, {}),
    ).resolves.toBe(true)
  })

  it('denies creation when the doc field is empty and stampOnCreate is false', async () => {
    const provider = makeProvider({
      config: {
        key: 'tenant',
        docField: 'tenant',
        actions: ['create'],
        stampOnCreate: false,
      },
    })
    await expect(
      decideCreate([provider], { id: '1', tenant: 'tenant-a' }, {}),
    ).resolves.toBe(false)
  })

  it('returns false when a required user value is missing', async () => {
    await expect(decideCreate([makeProvider()], { id: '1', tenant: undefined }, { tenant: 'tenant-a' })).resolves.toBe(false)
  })

  it('reads nested values from the configured doc field', async () => {
    const provider = makeProvider({
      config: {
        key: 'tenant',
        docField: 'meta.tenant',
        actions: ['create'],
      },
    })

    await expect(
      decideCreate([provider], { id: '1', tenant: 'tenant-a' }, { meta: { tenant: 'tenant-a' } }),
    ).resolves.toBe(true)
  })

  it('skips providers that are not configured for create', async () => {
    const provider = makeProvider({
      config: {
        key: 'tenant',
        docField: 'tenant',
        actions: ['read'],
      },
    })

    await expect(decideCreate([provider], { id: '1', tenant: 'tenant-a' }, { tenant: 'tenant-b' })).resolves.toBe(true)
  })

  it('fails closed when match throws', async () => {
    const provider = makeProvider({
      provider: {
        key: 'tenant',
        fromUser: async (user) => user.tenant,
        match: () => {
          throw new Error('boom')
        },
        toWhere: (userValue) => ({ tenant: { equals: userValue } }),
      },
    })

    await expect(decideCreate([provider], { id: '1', tenant: 'tenant-a' }, { tenant: 'tenant-a' })).resolves.toBe(false)
    expect(warnSpy).toHaveBeenCalled()
  })
})

describe('enrichJWT', () => {
  it('merges enrichJWT payloads from all providers', async () => {
    const providers: AttributeProvider[] = [
      {
        key: 'tenant',
        fromUser: async () => null,
        match: () => true,
        enrichJWT: async () => ({ tenant: 'tenant-a' }),
      },
      {
        key: 'region',
        fromUser: async () => null,
        match: () => true,
        enrichJWT: async () => ({ region: 'emea' }),
      },
    ]

    await expect(enrichJWT(providers, { id: '1' })).resolves.toEqual({
      tenant: 'tenant-a',
      region: 'emea',
    })
  })

  it('warns and lets the last value win when keys collide', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const providers: AttributeProvider[] = [
      {
        key: 'a',
        fromUser: async () => null,
        match: () => true,
        enrichJWT: async () => ({ tenant: 'tenant-a' }),
      },
      {
        key: 'b',
        fromUser: async () => null,
        match: () => true,
        enrichJWT: async () => ({ tenant: 'tenant-b' }),
      },
    ]

    await expect(enrichJWT(providers, { id: '1' })).resolves.toEqual({ tenant: 'tenant-b' })
    expect(warnSpy).toHaveBeenCalled()
  })
})