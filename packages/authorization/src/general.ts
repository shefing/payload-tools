import { Access } from 'payload';
import { RolePermissions, User } from '@/payload-types'
import { Role } from '@/payload-types';

export const canUserAccessAction = (user: User | null | undefined, slugName: string, action: string) => {
  if (user) {
    if (user.isAdmin) return true;

    if (!user.userRoles || user.userRoles.length == 0) return false;

    const userRoles: Role[] = user.userRoles as Role[];
    // if (! userRoles[0].permissions) return false;
    const permissions: (RolePermissions | undefined) = userRoles[0].permissions
    if (!permissions) return false
    for (const permission of permissions)
      if (((permission.entity as string[]).includes(slugName)) && ((permission.type as string[]).includes(action))) return true;

  }
  return false
}

export const hasAccessToAction =
  (slugName: string, action: string): Access =>
    ({ req: { user } }) => {
      if (user && ('userRoles' in user || 'isAdmin' in user)) {
        const cmuser = user as unknown
        return canUserAccessAction(cmuser as User, slugName, action);
      }else{
        return false
      }
    }