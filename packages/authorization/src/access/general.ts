import { Access, User, Payload } from 'payload';
import { AuthorizationPluginConfig } from '../types.js';

export const canUserAccessAction = async (
  user: User | null | undefined,
  slugName: string,
  action: string,
  payload: Payload,
  config: AuthorizationPluginConfig,
): Promise<boolean> => {
  if (!user) return false;

  // Admin users always have access
  if (user.isAdmin) return true;

  // No roles assigned to the user
  if (!user.userRoles || user.userRoles.length === 0) return false;

  // Fetch roles from the defined collection
  const roles = await payload.find({
    collection: config.rolesCollection,
    where: {
      id: { in: user.userRoles.map((role: any) => role.id) }, // Filter by user roles
    },
  });

  if (!roles.docs || roles.docs.length === 0) return false;

  // Check permissions for each role
  for (const role of roles.docs) {
    const permissions = role[config.permissionsField];
    if (permissions) {
      for (const permission of permissions) {
        if (permission.entity.includes(slugName) && permission.type.includes(action)) {
          return true;
        }
      }
    }
  }

  return false;
};
