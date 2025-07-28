import type { CollectionSlug, Config } from 'payload'

export type CollectionResetPreferencesPluginConfig = {
  disabled?: boolean
  excludedCollections?: CollectionSlug[]
  includedCollections?: CollectionSlug[]
}

export const CollectionResetPreferencesPlugin =
  (pluginOptions: CollectionResetPreferencesPluginConfig) =>
  (config: Config): Config => {
    /**
     * If the plugin is disabled, we still want to keep added collections/fields so the database schema is consistent which is important for migrations.
     * If your plugin heavily modifies the database schema, you may want to remove this property.
     */
    if (pluginOptions.disabled) {
      return config
    }
    if (!config.collections) {
      config.collections = []
    }

    // Process collections to add the reset button to each collection's list view
    config.collections = config.collections.map((collection) => {
      // Check if this collection should be processed based on includedCollections/excludedCollections
      // Check if this collection should have the reset button based on includedCollections/excludedCollections
      const shouldAddResetButton = pluginOptions.includedCollections
        ? pluginOptions.includedCollections.includes(collection.slug)
        : pluginOptions.excludedCollections
          ? !pluginOptions.excludedCollections.includes(collection.slug)
          : true

      if (shouldAddResetButton) {
        // Clone the collection to avoid mutating the original
        const newCollection = { ...collection }

        // Initialize admin components if not exists
        if (!newCollection.admin) {
          newCollection.admin = {}
        }

        if (!newCollection.admin.components) {
          newCollection.admin.components = {}
        }

        if (!newCollection.admin.components.listMenuItems) {
          newCollection.admin.components.listMenuItems = []
        } else if (!Array.isArray(newCollection.admin.components.listMenuItems)) {
          // If it's not an array, convert it to an array
          newCollection.admin.components.listMenuItems = [
            newCollection.admin.components.listMenuItems,
          ]
        }

        // Add the ResetListViewButton component
        newCollection.admin.components.listMenuItems.push({
          clientProps: {
            slug: collection.slug,
          },
          path: '@shefing/reset-list-view/client#ResetListViewButton',
        })

        return newCollection
      }

      return collection
    })

    return config
  }
