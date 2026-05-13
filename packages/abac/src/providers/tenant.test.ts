import { describe, expect, it } from 'vitest'

import { tenantAttribute } from './tenant.js'

describe('tenantAttribute', () => {
  it('reads the tenant from the configured user field', async () => {
    const provider = tenantAttribute()

    await expect(provider.fromUser({ tenant: 'tenant-a' }, {} as never)).resolves.toBe('tenant-a')
  })

  it('supports nested user fields', async () => {
    const provider = tenantAttribute({ userField: 'profile.tenantId' })

    await expect(
      provider.fromUser({ profile: { tenantId: 'tenant-a' } }, {} as never),
    ).resolves.toBe('tenant-a')
  })

  it('matches when user and doc tenant are equal', () => {
    const provider = tenantAttribute()

    expect(provider.match('tenant-a', 'tenant-a')).toBe(true)
    expect(provider.match('tenant-a', 'tenant-b')).toBe(false)
  })

  it('denies when the user tenant is empty', () => {
    const provider = tenantAttribute()

    expect(provider.match(null, 'tenant-a')).toBe(false)
  })

  it('builds a where clause using the configured doc field', () => {
    const provider = tenantAttribute({ docField: 'organization.tenant' })

    expect(provider.toWhere?.('tenant-a')).toEqual({
      'organization.tenant': {
        equals: 'tenant-a',
      },
    })
  })

  it('enriches the JWT with the resolved tenant value', async () => {
    const provider = tenantAttribute()

    await expect(provider.enrichJWT?.({ tenant: 'tenant-a' })).resolves.toEqual({
      tenant: 'tenant-a',
    })
  })
})