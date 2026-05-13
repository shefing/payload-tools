import { Access, User, Payload } from 'payload';
import { AuthorizationPluginConfig, FieldLevelPermission } from '../types.js';

const PERMISSION_HIERARCHY: Record<string, string[]> = {
  publish: ['write', 'read', 'publish'],
  write: ['read', 'write'],
  read: ['read'],
};

const getUserRoleIds = (user: User): Array<number | string> => {
  return user.userRoles
    .map((role: any) => {
      if (role && typeof role === 'object' && 'id' in role) {
        return role.id ?? null;
      }

      if (typeof role === 'string' || typeof role === 'number') {
        return role;
      }

      return null;
    })
    .filter((roleId): roleId is number | string => roleId !== null);
};

/**
 * Checks if a user has access to a specific action on a collection slug.
 * Optionally checks for field-level access if a fieldName is provided.
 *
 * @param user - The user requesting access
 * @param slugName - The collection slug name
 * @param action - The action type (e.g., 'read', 'write', 'publish')
 * @param payload - The Payload instance
 * @param config - The authorization plugin configuration
 * @param fieldName - Optional field name to check for field-level access
 * @returns Promise<boolean> - True if access is granted, false otherwise
 */
export const canUserAccessAction = async (
  user: User | null | undefined,
  slugName: string,
  action: string,
  payload: Payload,
  config: AuthorizationPluginConfig,
  fieldName?: string,
): Promise<boolean> => {
  if (!user) return false;

  if (user.isAdmin) return true;

  if (!user.userRoles || user.userRoles.length === 0) return false;

  const roleIds = getUserRoleIds(user);

  if (roleIds.length === 0) return false;

  const roles = await payload.find({
    collection: config.rolesCollection,
    where: {
      id: { in: roleIds },
    },
  });

  if (!roles.docs || roles.docs.length === 0) return false;

  for (const role of roles.docs) {
    const permissions: FieldLevelPermission[] | undefined = role[config.permissionsField];
    if (!permissions) continue;

    for (const permission of permissions) {
      if (!permission.entity.includes(slugName)) continue;

      // permission.type is string[] (hasMany select field), but normalize to array
      // in case legacy data or tests pass a plain string.
      const permissionTypes: string[] = Array.isArray(permission.type)
        ? permission.type
        : [permission.type];
      // Expand all types through the hierarchy to get the full set of granted actions
      const grantedActions = new Set<string>();
      for (const type of permissionTypes) {
        grantedActions.add(type);
        PERMISSION_HIERARCHY[type]?.forEach((perm) => grantedActions.add(perm));
      }

      if (!grantedActions.has(action)) continue;

      // Action is granted by this permission. If no fieldName requested, we're done.
      if (!fieldName) return true;

      // Field-level check: empty/missing fields means all fields are allowed
      if (!permission.fields || permission.fields.length === 0) return true;

      if (permission.fields.includes(fieldName)) return true;
    }
  }

  return false;
};
