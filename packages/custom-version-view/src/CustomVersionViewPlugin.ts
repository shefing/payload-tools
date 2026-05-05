import type { Config } from 'payload';

export interface versionsPluginPConfig {
  excludedCollections?: string[];
  excludedGlobals?: string[];
  updatedByField?: string;
  createdByField?: string;
  processField?: string;
}

const defaultConfig: Required<versionsPluginPConfig> = {
  excludedCollections: [],
  excludedGlobals: [],
  updatedByField: 'updator',
  createdByField: 'creator',
  processField: 'process',
};

function ensurePath(obj: any, path: string[]): any {
  return path.reduce((acc, key) => (acc[key] ??= {}), obj);
}
const versionsPlugin =
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
            versions.Component = { path: '@shefing/custom-version-view/index' } as any;
          }
          currentCollection.custom = {
            ...currentCollection.custom,
            customVersionView: {
              updatedByField: mergedConfig.updatedByField,
              createdByField: mergedConfig.createdByField,
              processField: mergedConfig.processField,
            },
          };
        });
    }
    if (globals !== undefined) {
      globals
        .filter((x) => !mergedConfig.excludedGlobals.includes(x.slug))
        .forEach((currentGlobal) => {
          //Custom Versions View
          if (!currentGlobal.admin?.components?.views?.edit?.versions?.Component) {
            const versions = ensurePath(currentGlobal, [
              'admin',
              'components',
              'views',
              'edit',
              'versions',
            ]);
            versions.Component = { path: '@shefing/custom-version-view/index' } as any;
          }
          currentGlobal.custom = {
            ...currentGlobal.custom,
            customVersionView: {
              updatedByField: mergedConfig.updatedByField,
              createdByField: mergedConfig.createdByField,
              processField: mergedConfig.processField,
            },
          };
        });
    }

    return {
      ...config,
    };
  };

export default versionsPlugin;
