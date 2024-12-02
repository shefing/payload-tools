import { Access } from 'payload';

export const hasAccessToAction =
  (slugName: string, action: string): Access =>
  ({ req: { user } }) => {
    if (user && ('userRoles' in user || 'isAdmin' in user)) {
      const cmuser = user as unknown;
      return canUserAccessAction(cmuser as User, slugName, action);
    } else {
      return false;
    }
  };
