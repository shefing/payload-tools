import type { AttributeProvider } from '../types.js'

type RoleValue = {
  isAdmin: boolean
  roleIds: Array<number | string>
}

const getRoleIds = (user: Record<string, unknown>): Array<number | string> => {
  const userRoles = user.userRoles

  if (!Array.isArray(userRoles)) {
    return []
  }

  return userRoles
    .map((role) => {
      if (role && typeof role === 'object' && 'id' in role) {
        const roleId = (role as { id?: number | string }).id
        return roleId ?? null
      }

      return null
    })
    .filter((roleId): roleId is number | string => roleId !== null)
}

export const roleAttribute = (): AttributeProvider<RoleValue, unknown> => {
  return {
    key: 'role',
    fromUser: async (user) => ({
      isAdmin: Boolean(user.isAdmin),
      roleIds: getRoleIds(user),
    }),
    match: (userValue) => {
      if (userValue.isAdmin) {
        return true
      }

      return userValue.roleIds.length > 0
    },
    enrichJWT: async (user) => ({
      userRoles: Array.isArray(user.userRoles) ? user.userRoles : [],
      isAdmin: Boolean(user.isAdmin),
    }),
  }
}

export default roleAttribute