export type IncomingCollectionVersions = {
  drafts?: boolean;
  maxPerDoc?: number;
};

export interface AuthorsInfoPluginConfig {
  /** Array of collection slugs to exclude */
  excludedCollections?: string[];
  /** Array of global slugs to exclude */
  excludedGlobals?: string[];
  /** The name of user name field in Users collection */
  usernameField?: string;
}
