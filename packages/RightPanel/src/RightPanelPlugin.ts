import type { Config } from 'payload';

export interface RightPanelPluginConfig {
  excludedCollections?: string[];
}

const defaultConfig: Required<RightPanelPluginConfig> = {
  excludedCollections: [],
};

function ensurePath(obj: any, path: string[]): any {
  return path.reduce((acc, key) => (acc[key] ??= {}), obj);
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
            defaultEdit.Component = '@michalklor/right-panel/components/RightPanelEditView';
          }
        });
      const adminConfig = config.admin || {};
      const components = adminConfig.components || {};

      adminConfig.components = {
        ...components,
        providers: [
          ...(components.providers || []),
          '@michalklor/right-panel/providers/CustomContext#CustomContextProvider',
        ],
      };
    }

    return {
      ...config,
    };
  };

export default RightPanelPlugin;
