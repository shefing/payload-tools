import { Access, User, Payload } from 'payload';
import { AuthorizationPluginConfig } from '../types.js';

const PERMISSION_HIERARCHY: Record<string, string[]> = {
  publish: ['write', 'read', 'publish'],
  write: ['read', 'write'],
  read: ['read'],
};

export const canUserAccessAction = async (
  user: User | null | undefined,
  slugName: string,
  action: string,
  payload: Payload,
  config: AuthorizationPluginConfig,
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

  for (const role of roles.docs) {
    const permissions = role[config.permissionsField];
    if (permissions) {
      for (const permission of permissions) {
        if (permission.entity.includes(slugName)) {
          userAllowedActions.add(permission.type);
          PERMISSION_HIERARCHY[permission.type]?.forEach((perm) => userAllowedActions.add(perm));
        }
      }
    }
  }
  return userAllowedActions.has(action);
};
