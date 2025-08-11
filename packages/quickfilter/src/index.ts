import type { CollectionSlug, Config } from 'payload';

export * from './nav/index';

export type CollectionFilterPluginConfig = {
  /**
   * List of collections to add filters to
   */
  disabled?: boolean;
  excludedCollections?: CollectionSlug[];
  includedCollections?: CollectionSlug[];
};

export const CollectionQuickFilterPlugin =
  (pluginOptions: CollectionFilterPluginConfig = {}) =>
  (config: Config): Config => {
    if (!config.collections) {
      config.collections = [];
    }

    // Process each collection to add the QuickFilter component
    config.collections = config.collections.map((collection) => {
      // Check if this collection should be processed based on includedCollections/excludedCollections
      const shouldProcessCollection = pluginOptions.includedCollections 
        ? pluginOptions.includedCollections.includes(collection.slug as CollectionSlug)
        : pluginOptions.excludedCollections 
          ? !pluginOptions.excludedCollections.includes(collection.slug as CollectionSlug)
          : true;

      // Check if the collection has a filterList configuration
      // or if it's specified in the plugin options
      if (shouldProcessCollection && collection.custom?.filterList && Array.isArray(collection.custom.filterList)) {
        // Clone the collection to avoid mutating the original
        const newCollection = { ...collection };

        // Initialize components if not exists
        if (!newCollection.admin) {
          newCollection.admin = {};
        }

        if (!newCollection.admin.components) {
          newCollection.admin.components = {};
        }

        if (!newCollection.admin.components.beforeListTable) {
          newCollection.admin.components.beforeListTable = [];
        } else if (!Array.isArray(newCollection.admin.components.beforeListTable)) {
          // If it's not an array, convert it to an array
          newCollection.admin.components.beforeListTable = [
            newCollection.admin.components.beforeListTable,
          ];
        }

        // Add the QuickFilter component
        newCollection.admin.components.beforeListTable.push({
          path: '@shefing/quickfilter/QuickFilter',
          clientProps: {
            filterList: collection.custom.filterList,
            slug: collection.slug,
          },
        });

        return newCollection;
      }

      return collection;
    });

    /**
     * If the plugin is disabled, we still want to keep added collections/fields so the database schema is consistent which is important for migrations.
     * If your plugin heavily modifies the database schema, you may want to remove this property.
     */
    if (pluginOptions.disabled) {
      return config;
    }

    return config;
  };

export default CollectionQuickFilterPlugin;
