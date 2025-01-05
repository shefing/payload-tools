import { CollectionSlug } from 'payload';

export type AuthorizationPluginConfig = {
  rolesCollection?: string;
  permissionsField?: string;
  excludedCollections?: CollectionSlug[];
};
