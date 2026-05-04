import { Access, User, Payload } from 'payload';
import { AuthorizationPluginConfig } from '../types.js';

const PERMISSION_HIERARCHY: Record<string, string[]> = {
  publish: ['write', 'read', 'publish'],
  write: ['read', 'write'],
  read: ['read'],
};

// Returns true if user has action access to the collection, and (if fieldName provided) to the field
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

  const userAllowedActions = new Set<string>();
  let hasFieldAccess = !fieldName; // If no fieldName provided, default to true

  for (const role of roles.docs) {
    const permissions = role[config.permissionsField];
    if (permissions) {
      for (const permission of permissions) {
        if (permission.entity.includes(slugName)) {
          // permission.type is string[] (hasMany select field)
          const types: string[] = permission.type;
          for (const type of types) {
            userAllowedActions.add(type);
            PERMISSION_HIERARCHY[type]?.forEach((perm) => userAllowedActions.add(perm));
          }

          // Field-level check: only relevant when fieldName is provided
          // and the permission grants the requested action (directly or via hierarchy)
          if (fieldName && types.some((type) => PERMISSION_HIERARCHY[type]?.includes(action))) {
            if (!permission.fields || permission.fields.length === 0) {
              hasFieldAccess = true; // No fields specified = all fields allowed
            } else if (permission.fields.includes(fieldName)) {
              hasFieldAccess = true;
            }
          }
        }
      }
    }
  }

  return userAllowedActions.has(action) && hasFieldAccess;
};
