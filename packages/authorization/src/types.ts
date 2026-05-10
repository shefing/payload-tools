import { CollectionSlug } from 'payload';

export type FieldLevelPermission = {
  entity: string[];
  type: string[];
  fields?: string[]; // List of allowed fields for this permission (empty = all fields)
};

export type AuthorizationPluginConfig = {
  rolesCollection?: string;
  permissionsField?: string;
  excludedCollections?: CollectionSlug[];
  includedCollections?: CollectionSlug[];
};
