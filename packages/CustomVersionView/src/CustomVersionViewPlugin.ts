import type { Config } from 'payload';

export interface versionsPluginPConfig {
  excludedCollections?: string[];
  excludedGlobals?: string[];
}

const defaultConfig: Required<versionsPluginPConfig> = {
  excludedCollections: [],
  excludedGlobals: [],
};

function ensurePath(obj: any, path: string[]): any {
  return path.reduce((acc, key) => (acc[key] ??= {}), obj);
}
const versionsRightPanelPlugin =
  (pluginConfig: versionsPluginPConfig = {}) =>
  (config: Config): Config => {
    const mergedConfig: Required<versionsPluginPConfig> = { ...defaultConfig, ...pluginConfig };
    const { collections, globals } = config;

    if (collections !== undefined) {
      collections
        .filter((collection) => !mergedConfig.excludedCollections.includes(collection.slug))
        .forEach((currentCollection) => {
          const versions = ensurePath(currentCollection, [
            'admin',
            'components',
            'views',
            'edit',
            'versions',
          ]);
          //@ts-ignore
          if (!currentCollection.admin?.components?.views?.edit?.versions?.Component) {
            versions.Component = '@michalklor/custom-version-view/index';
          }
        });
    }
    if (globals !== undefined) {
      globals
        .filter((x) => !mergedConfig.excludedGlobals.includes(x.slug))
        .forEach((currentGlobal) => {
          //Custom Versions View
          //@ts-expect-error payload
          if (!currentGlobal.admin?.components?.views?.edit?.versions?.Component) {
            const versions = ensurePath(currentGlobal, [
              'admin',
              'components',
              'views',
              'edit',
              'versions',
            ]);
            versions.Component = '@michalklor/custom-version-view/index';
          }
        });
    }

    return {
      ...config,
    };
  };

export default versionsRightPanelPlugin;
