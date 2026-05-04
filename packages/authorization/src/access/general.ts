import { Access, User, Payload } from 'payload';
import { AuthorizationPluginConfig, FieldLevelPermission } from '../types.js';

const PERMISSION_HIERARCHY: Record<string, string[]> = {
  publish: ['write', 'read', 'publish'],
  write: ['read', 'write'],
  read: ['read'],
};

// Returns true if user has action access to the collection, and (if fieldName provided) to the field.
// Both action and field access must come from the same permission entry to avoid cross-role leaks.
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

  const roles = await payload.find({
    collection: config.rolesCollection,
    where: {
      id: { in: user.userRoles.map((role: any) => role.id) },
    },
  });

  if (!roles.docs || roles.docs.length === 0) return false;

  for (const role of roles.docs) {
    const permissions: FieldLevelPermission[] | undefined = role[config.permissionsField];
    if (!permissions) continue;

    for (const permission of permissions) {
      if (!permission.entity.includes(slugName)) continue;

      // permission.type is string[] (hasMany select field)
      // Expand all types through the hierarchy to get the full set of granted actions
      const grantedActions = new Set<string>();
      for (const type of permission.type) {
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
