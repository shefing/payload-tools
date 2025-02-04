import type { Config } from 'payload';
import { CrossCollectionPluginConfig } from './types';

/* eslint-disable */

const defaultConfig: Required<CrossCollectionPluginConfig> = {
  excludedCollections: [],
  excludedGlobals: [],
  customOverrides: {},
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
          Object.entries(mergedConfig.customOverrides).forEach(([pathString, value]) => {
            const pathArray = pathString.split('.');
            const target = ensurePath(currentCollection, pathArray);
            target.Component = value;
          });
        });
    }

    if (globals !== undefined) {
      globals
        .filter((x) => !mergedConfig.excludedGlobals.includes(x.slug))
        .forEach((currentGlobal) => {
          Object.entries(mergedConfig.customOverrides).forEach(([pathString, value]) => {
            const pathArray = pathString.split('.');
            const target = ensurePath(currentGlobal, pathArray);
            target.Component = value;
          });
        });
    }

    return {
      ...config,
    };
  };

export default CrossCollectionConfig;
/* eslint-enable */
