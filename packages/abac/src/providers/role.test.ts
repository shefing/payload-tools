import { describe, expect, it } from 'vitest'

import { roleAttribute } from './role.js'

describe('roleAttribute', () => {
  it('short-circuits for admins', async () => {
    const provider = roleAttribute()
    const userValue = await provider.fromUser({ isAdmin: true, userRoles: [] }, {} as never)

    expect(provider.match(userValue, null)).toBe(true)
  })

  it('denies users without roles', async () => {
    const provider = roleAttribute()
    const userValue = await provider.fromUser({ isAdmin: false, userRoles: [] }, {} as never)

    expect(provider.match(userValue, null)).toBe(false)
  })

  it('mirrors role ids into the JWT payload', async () => {
    const provider = roleAttribute()

    await expect(
      provider.enrichJWT?.({ isAdmin: false, userRoles: [{ id: 'role-1' }] }),
    ).resolves.toEqual({
      isAdmin: false,
      userRoles: [{ id: 'role-1' }],
    })
  })
})