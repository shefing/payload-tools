import type { Config } from 'payload';

export interface RightPanelPluginConfig {
  excludedCollections?: string[];
}

const defaultConfig: Required<RightPanelPluginConfig> = {
  excludedCollections: [],
};

// Segments that would walk out of `obj` and into `Object.prototype`, turning a
// nested-object helper into a prototype-pollution primitive (CWE-1321).
const UNSAFE_PATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

function ensurePath(obj: any, path: string[]): any {
  return path.reduce((acc, key) => {
    if (UNSAFE_PATH_SEGMENTS.has(key)) {
      throw new Error(`ensurePath: refusing unsafe path segment "${key}"`);
    }

    // Own properties only — an inherited value must not be traversed or mutated.
    if (!Object.prototype.hasOwnProperty.call(acc, key) || acc[key] == null) {
      acc[key] = {};
    }

    return acc[key];
  }, obj);
}
const RightPanelPlugin =
  (pluginConfig: RightPanelPluginConfig = {}) =>
  (config: Config): Config => {
    const mergedConfig: Required<RightPanelPluginConfig> = { ...defaultConfig, ...pluginConfig };
    const { collections } = config;

    if (collections !== undefined) {
      collections
        .filter((collection) => !mergedConfig.excludedCollections.includes(collection.slug))
        .forEach((currentCollection) => {
          const defaultEdit = ensurePath(currentCollection, [
            'admin',
            'components',
            'views',
            'edit',
            'default',
          ]);

          if (currentCollection?.admin?.custom?.rightPanel) {
            defaultEdit.Component = '@shefing/right-panel/components/RightPanelEditView';
          }
        });
      const adminConfig = config.admin || {};
      const components = adminConfig.components || {};

      adminConfig.components = {
        ...components,
        providers: [
          ...(components.providers || []),
          '@shefing/right-panel/providers/CustomContext#CustomContextProvider',
        ],
      };
    }

    return {
      ...config,
    };
  };

export default RightPanelPlugin;
