import { Access, User } from 'payload';
import { canUserAccessAction } from '../access/general.js';
import { config } from 'process';
import { AuthorizationPluginConfig } from '../types.js';

export const hasAccessToAction =
  (slugName: string, action: string,pluginConfig:any): Access =>
  ({ req: { user, payload } }) => {
    if (user && ('userRoles' in user || 'isAdmin' in user)) {
      const cmuser = user as unknown;
      return canUserAccessAction(
        cmuser as User,
        slugName,
        action,
        payload,
        pluginConfig
      );
    } else {
      return false;
    }
  };
