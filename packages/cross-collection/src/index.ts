import type { Config } from 'payload';
import { CrossCollectionPluginConfig } from './types.js';
/* eslint-disable */

const defaultConfig: Required<CrossCollectionPluginConfig> = {
  excludedCollections: [],
  excludedGlobals: [],
  customComponentPaths: {
    collectionEditComponent: '',
    globalEditComponent: '',
  },
};

export function ensurePath(obj, path) {
  return path.reduce((acc, key) => (acc[key] ??= {}), obj);
}

const CrossCollectionConfig =
  (pluginConfig: CrossCollectionPluginConfig = {}) =>
  (config: Config): Config => {
    const mergedConfig: Required<CrossCollectionPluginConfig> = {
      ...defaultConfig,
      ...pluginConfig,
    };
    const { collections, globals } = config;

    if (collections !== undefined) {
      collections
        .filter((x) => !mergedConfig.excludedCollections.includes(x.slug))
        .forEach((currentCollection) => {
          if (mergedConfig.customComponentPaths.collectionEditComponent) {
            const defaultEdit = ensurePath(currentCollection, [
              'admin',
              'components',
              'views',
              'edit',
              'default',
            ]);
            defaultEdit.Component = mergedConfig.customComponentPaths.collectionEditComponent;
          }
        });
    }
    if (globals !== undefined) {
      globals
        .filter((x) => !mergedConfig.excludedGlobals.includes(x.slug))
        .forEach((currentGlobal) => {
          if (mergedConfig.customComponentPaths.globalEditComponent) {
            const defaultEdit = ensurePath(currentGlobal, [
              'admin',
              'components',
              'views',
              'edit',
              'default',
            ]);
            defaultEdit.Component = mergedConfig.customComponentPaths.globalEditComponent;
          }
        });
    }

    return {
      ...config,
    };
  };

export default CrossCollectionConfig;
/* eslint-enable */
