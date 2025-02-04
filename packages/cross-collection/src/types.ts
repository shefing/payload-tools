export interface CrossCollectionPluginConfig {
  /** Array of collection slugs to exclude */
  excludedCollections?: string[];
  /** Array of global slugs to exclude */
  excludedGlobals?: string[];
  customOverrides?: Record<string, any>;
}
