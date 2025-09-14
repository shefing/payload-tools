import { CollectionSlug } from 'payload';


export type FieldLevelPermission = {
  entity: string[];
  type: string[];
  fields?: string[]; // List of allowed fields for this permission
};

export type AuthorizationPluginConfig = {
  rolesCollection?: string;
  permissionsField?: string;
  excludedCollections?: CollectionSlug[];
  includedCollections?: CollectionSlug[];
};
