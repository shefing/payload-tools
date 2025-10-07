import { Access, CollectionConfig, Config, GlobalConfig } from 'payload';
import { hasAccessToAction } from './utilities/hasAccessToAction.js';
import { ensurePath } from './utilities/ensurePath.js';
import { populateOptions } from './fields/populateOptions.js';
import { AuthorizationPluginConfig } from './types.js';
export * from "./access/isAdmin.js";
export * from "./access/isAdminOrSelf.js";
export * from "./access/isLoggedIn.js";
export * from './collection/Roles.js';
export * from './fields/userFields.js';
export { default as userFields } from './fields/userFields.js';
export const addAccess =
  (pluginConfig: AuthorizationPluginConfig) =>
  (incomingConfig: Config): Config => {
    if (!incomingConfig || !incomingConfig.collections) {
      throw new Error('Invalid incoming configuration or collections are missing');
    }
    const entities: { label: string; value: string }[] = [];

    const createAccess = (slugName: string, labelName?: string) => {
      const baseAccess: { read: Access; update: Access } = {
        read: hasAccessToAction(slugName, 'read', pluginConfig),
        update: hasAccessToAction(slugName, 'write', pluginConfig),
      };
      const label = labelName ? labelName : slugName.charAt(0).toUpperCase() + slugName.slice(1);
      entities.push({ label, value: slugName });
      return baseAccess;
    };
    const createAccessCollection = (slugName: string, labelName?: string) => {
      const baseAccess: { read: Access; update: Access; create?: Access; delete?: Access } =
        createAccess(slugName, labelName);
      const access = {
        ...baseAccess,
        create: hasAccessToAction(slugName, 'write', pluginConfig),
        delete: hasAccessToAction(slugName, 'write', pluginConfig),
      };
      return access;
    };

    const config: Config = {
      ...incomingConfig,
      collections: incomingConfig.collections?.map((collection) => ({
        ...collection,
        ...((pluginConfig.includedCollections 
            ? pluginConfig.includedCollections.includes(collection.slug) 
            : pluginConfig.excludedCollections 
              ? !pluginConfig.excludedCollections.includes(collection.slug) 
              : true) && {
          access: collection.labels
            ? createAccessCollection(
                collection.slug,
                String(collection.labels.plural ? collection.labels.plural : collection.labels),
              )
            : createAccessCollection(collection.slug),
        }),
      })) as CollectionConfig[],
      globals: incomingConfig.globals?.map((global) => ({
        ...global,
        access: global.label
          ? createAccess(global.slug, String(global.label))
          : createAccess(global.slug),
      })) as GlobalConfig[],
    };

    /* eslint-disable @typescript-eslint/no-explicit-any */
    config.collections?.forEach((collection) => {
      if ((collection?.versions as any)?.drafts) {
        if (collection?.admin?.components?.edit?.PublishButton) {
          const defaultEdit = ensurePath(collection, ['admin', 'components', 'edit']);
          defaultEdit.PublishButton = '/components/buttons/CustomPublishButton';
        }
      }
      if (collection.slug == 'roles') {
        populateOptions(collection.fields, entities);
      }
    });

    return config;
  };

export default addAccess;
