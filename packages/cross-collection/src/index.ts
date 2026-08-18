import type { Config } from 'payload';
import { CrossCollectionPluginConfig } from './types';

/* eslint-disable */

const defaultConfig: Required<CrossCollectionPluginConfig> = {
  excludedCollections: [],
  excludedGlobals: [],
  customOverrides: {},
};

// Segments that would walk out of `obj` and into `Object.prototype`, turning a
// nested-object helper into a prototype-pollution primitive (CWE-1321).
const UNSAFE_PATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

export function ensurePath(obj, path) {
  return path.reduce((acc, key) => {
    const segment = String(key);

    if (UNSAFE_PATH_SEGMENTS.has(segment)) {
      throw new Error(`ensurePath: refusing unsafe path segment "${segment}"`);
    }

    // Own properties only — an inherited value must not be traversed or mutated.
    if (!Object.prototype.hasOwnProperty.call(acc, segment) || acc[segment] == null) {
      acc[segment] = {};
    }

    return acc[segment];
  }, obj);
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
