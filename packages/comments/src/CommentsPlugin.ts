import type { Config } from 'payload';
import { CommentsPluginConfig } from './exports/types';
/* eslint-disable */

const defaultConfig: Required<CommentsPluginConfig> = {
  excludedCollections: [],
  excludedGlobals: [],
};
// Segments that would walk out of `obj` and into `Object.prototype`, turning a
// nested-object helper into a prototype-pollution primitive (CWE-1321).
const UNSAFE_PATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

function ensurePath(obj, path) {
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
