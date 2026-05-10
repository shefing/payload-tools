import { describe, it, expect, vi } from 'vitest'
import { canUserAccessAction } from './general.js'

const pluginConfig: any = {
  rolesCollection: 'roles',
  permissionsField: 'permissions',
}

function makePayload(docs: any[]) {
  return {
    find: vi.fn().mockResolvedValue({ docs }),
  } as any
}

describe('canUserAccessAction', () => {
  it('returns false when user is null', async () => {
    const result = await canUserAccessAction(null, 'articles', 'read', makePayload([]), pluginConfig)
    expect(result).toBe(false)
  })

  it('returns false when user is undefined', async () => {
    const result = await canUserAccessAction(undefined, 'articles', 'read', makePayload([]), pluginConfig)
    expect(result).toBe(false)
  })

  it('returns true when user isAdmin', async () => {
    const user: any = { isAdmin: true }
    const result = await canUserAccessAction(user, 'articles', 'read', makePayload([]), pluginConfig)
    expect(result).toBe(true)
  })

  it('returns false when user has no userRoles', async () => {
    const user: any = { isAdmin: false, userRoles: [] }
    const result = await canUserAccessAction(user, 'articles', 'read', makePayload([]), pluginConfig)
    expect(result).toBe(false)
  })

  it('returns false when roles collection returns no docs', async () => {
    const user: any = { isAdmin: false, userRoles: [{ id: '1' }] }
    const result = await canUserAccessAction(user, 'articles', 'read', makePayload([]), pluginConfig)
    expect(result).toBe(false)
  })

  it('returns true when role grants read permission on the slug', async () => {
    const user: any = { isAdmin: false, userRoles: [{ id: '1' }] }
    const roles = [
      {
        permissions: [{ entity: ['articles'], type: 'read' }],
      },
    ]
    const result = await canUserAccessAction(user, 'articles', 'read', makePayload(roles), pluginConfig)
    expect(result).toBe(true)
  })

  it('returns false when role grants permission on a different slug', async () => {
    const user: any = { isAdmin: false, userRoles: [{ id: '1' }] }
    const roles = [
      {
        permissions: [{ entity: ['pages'], type: 'read' }],
      },
    ]
    const result = await canUserAccessAction(user, 'articles', 'read', makePayload(roles), pluginConfig)
    expect(result).toBe(false)
  })

  it('grants read and write when role has write permission (hierarchy)', async () => {
    const user: any = { isAdmin: false, userRoles: [{ id: '1' }] }
    const roles = [
      {
        permissions: [{ entity: ['articles'], type: 'write' }],
      },
    ]
    const readResult = await canUserAccessAction(user, 'articles', 'read', makePayload(roles), pluginConfig)
    const writeResult = await canUserAccessAction(user, 'articles', 'write', makePayload(roles), pluginConfig)
    expect(readResult).toBe(true)
    expect(writeResult).toBe(true)
  })

  it('grants read, write and publish when role has publish permission (hierarchy)', async () => {
    const user: any = { isAdmin: false, userRoles: [{ id: '1' }] }
    const roles = [
      {
        permissions: [{ entity: ['articles'], type: 'publish' }],
      },
    ]
    const readResult = await canUserAccessAction(user, 'articles', 'read', makePayload(roles), pluginConfig)
    const writeResult = await canUserAccessAction(user, 'articles', 'write', makePayload(roles), pluginConfig)
    const publishResult = await canUserAccessAction(user, 'articles', 'publish', makePayload(roles), pluginConfig)
    expect(readResult).toBe(true)
    expect(writeResult).toBe(true)
    expect(publishResult).toBe(true)
  })

  it('propagates errors thrown by payload.find', async () => {
    const user: any = { isAdmin: false, userRoles: [{ id: '1' }] }
    const payload: any = { find: vi.fn().mockRejectedValue(new Error('DB error')) }
    await expect(
      canUserAccessAction(user, 'articles', 'read', payload, pluginConfig),
    ).rejects.toThrow('DB error')
  })

  describe('field-level permissions', () => {
    it('returns true for any field when no fields are specified in permission', async () => {
      const user: any = { isAdmin: false, userRoles: [{ id: '1' }] }
      const roles = [
        {
          permissions: [{ entity: ['articles'], type: ['read'], fields: [] }],
        },
      ]
      const result = await canUserAccessAction(user, 'articles', 'read', makePayload(roles), pluginConfig, 'title')
      expect(result).toBe(true)
    })

    it('returns true when field is explicitly allowed', async () => {
      const user: any = { isAdmin: false, userRoles: [{ id: '1' }] }
      const roles = [
        {
          permissions: [{ entity: ['articles'], type: ['read'], fields: ['title'] }],
        },
      ]
      const result = await canUserAccessAction(user, 'articles', 'read', makePayload(roles), pluginConfig, 'title')
      expect(result).toBe(true)
    })

    it('returns false when field is not in the allowed list', async () => {
      const user: any = { isAdmin: false, userRoles: [{ id: '1' }] }
      const roles = [
        {
          permissions: [{ entity: ['articles'], type: ['read'], fields: ['title'] }],
        },
      ]
      const result = await canUserAccessAction(user, 'articles', 'read', makePayload(roles), pluginConfig, 'content')
      expect(result).toBe(false)
    })

    it('grants access if at least one role/permission grants it (OR logic)', async () => {
      const user: any = { isAdmin: false, userRoles: [{ id: '1' }] }
      const roles = [
        {
          permissions: [
            { entity: ['articles'], type: ['read'], fields: ['title'] },
            { entity: ['articles'], type: ['read'], fields: ['content'] },
          ],
        },
      ]
      const titleResult = await canUserAccessAction(user, 'articles', 'read', makePayload(roles), pluginConfig, 'title')
      const contentResult = await canUserAccessAction(user, 'articles', 'read', makePayload(roles), pluginConfig, 'content')
      expect(titleResult).toBe(true)
      expect(contentResult).toBe(true)
    })

    it('avoids cross-role leaks (action and field must match in the same permission)', async () => {
      const user: any = { isAdmin: false, userRoles: [{ id: '1' }, { id: '2' }] }
      const roles = [
        {
          id: '1',
          permissions: [{ entity: ['articles'], type: ['write'], fields: ['title'] }],
        },
        {
          id: '2',
          permissions: [{ entity: ['articles'], type: ['read'], fields: ['content'] }],
        },
      ]
      // Role 1 has WRITE on 'title', Role 2 has READ on 'content'.
      // User should NOT have WRITE on 'content'.
      const result = await canUserAccessAction(user, 'articles', 'write', makePayload(roles), pluginConfig, 'content')
      expect(result).toBe(false)
    })

    it('handles multiple types in a single permission', async () => {
      const user: any = { isAdmin: false, userRoles: [{ id: '1' }] }
      const roles = [
        {
          permissions: [{ entity: ['articles'], type: ['read', 'write'], fields: ['title'] }],
        },
      ]
      const readResult = await canUserAccessAction(user, 'articles', 'read', makePayload(roles), pluginConfig, 'title')
      const writeResult = await canUserAccessAction(user, 'articles', 'write', makePayload(roles), pluginConfig, 'title')
      expect(readResult).toBe(true)
      expect(writeResult).toBe(true)
    })
  })
})
