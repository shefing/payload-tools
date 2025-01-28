import type { Config } from 'payload';
import { CommentsPluginConfig } from './exports/types';
/* eslint-disable */

const defaultConfig: Required<CommentsPluginConfig> = {
  excludedCollections: [],
  excludedGlobals: [],
};
function ensurePath(obj, path) {
  return path.reduce((acc, key) => (acc[key] ??= {}), obj);
}

const CommentsPlugin =
  (pluginConfig: CommentsPluginConfig = {}) =>
  (config: Config): Config => {
    const mergedConfig: Required<CommentsPluginConfig> = { ...defaultConfig, ...pluginConfig };
    const { collections, globals } = config;

    if (collections !== undefined) {
      collections
        .filter((collectionConfig) => {
          return collectionConfig?.admin?.custom?.comments;
        })
        .forEach((currentCollection) => {
          //Custom Versions View
          currentCollection.fields.push({
            name: 'comments',
            type: 'text',
            admin: {
              hidden: true,
              disableListColumn: true,
              disableBulkEdit: true,
              disableListFilter: true,
            },
          });
        });
    }
    const adminConfig = config.admin || {};
    const components = adminConfig.components || {};

    adminConfig.components = {
      ...components,
      providers: [
        ...(components.providers || []), // Include existing providers
        '@shefing/comments/providers/CustomContext#CustomContextProvider',
      ],
    };
    return {
      ...config,
    };
  };

export default CommentsPlugin;
/* eslint-enable */
