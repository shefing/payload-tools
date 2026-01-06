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
  fieldName?: string
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

  let hasCollectionAccess = false;
  let hasFieldAccess = !fieldName; // If no fieldName, default to true

  for (const role of roles.docs) {
    const permissions = role[config.permissionsField];
    if (permissions) {
      for (const permission of permissions) {
        if (permission.entity.includes(slugName)) {
          // Check action
          if (
            (Array.isArray(permission.type) && permission.type.includes(action)) ||
            permission.type === action
          ) {
            hasCollectionAccess = true;
            // Field-level check
            if (fieldName) {
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
  }
  return hasCollectionAccess && hasFieldAccess;
};
