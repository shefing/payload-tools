import { Access, CollectionConfig, Config, Field, GlobalConfig } from 'payload';
import { hasAccessToAction } from './utilities/hasAccessToAction.js';
import { ensurePath } from './utilities/ensurePath.js';
import { populateOptions } from './fields/populateOptions.js';
import { AuthorizationPluginConfig } from './types.js';

// Field types that carry a `name` and represent actual data (vs. presentational/layout fields).
const DATA_FIELD_TYPES = new Set([
  'array',
  'blocks',
  'checkbox',
  'code',
  'date',
  'email',
  'group',
  'json',
  'number',
  'point',
  'radio',
  'relationship',
  'richText',
  'select',
  'text',
  'textarea',
  'upload',
]);

// Recursively walk fields, applying `access` only to data fields and recursing
// into presentational/container fields (row, collapsible, tabs, group, array, blocks).
const applyFieldAccess = (
  fields: Field[] | undefined,
  collectionSlug: string,
  pluginConfig: AuthorizationPluginConfig,
): Field[] | undefined => {
  if (!fields) return fields;
  return fields.map((field): Field => {
    // Container fields without a name: recurse into nested fields.
    if (field.type === 'row' || field.type === 'collapsible') {
      return {
        ...field,
        fields: applyFieldAccess(field.fields, collectionSlug, pluginConfig) ?? field.fields,
      } as Field;
    }
    if (field.type === 'tabs') {
      return {
        ...field,
        tabs: field.tabs.map((tab) => ({
          ...tab,
          fields: applyFieldAccess(tab.fields, collectionSlug, pluginConfig) ?? tab.fields,
        })),
      } as Field;
    }
    // Presentational, no nested fields, no access.
    if (field.type === 'ui') {
      return field;
    }

    // Data fields with a name.
    if (
      'name' in field &&
      typeof field.name === 'string' &&
      DATA_FIELD_TYPES.has(field.type) &&
      !field.name.startsWith('_')
    ) {
      // Recurse into nested fields for group/array.
      let nested: Partial<Field> = {};
      if (field.type === 'group' || field.type === 'array') {
        nested = {
          fields: applyFieldAccess(field.fields, collectionSlug, pluginConfig) ?? field.fields,
        } as Partial<Field>;
      } else if (field.type === 'blocks') {
        nested = {
          blocks: field.blocks.map((block) => ({
            ...block,
            fields: applyFieldAccess(block.fields, collectionSlug, pluginConfig) ?? block.fields,
          })),
        } as Partial<Field>;
      }

      return {
        ...field,
        ...nested,
        access: {
          read: hasAccessToAction(collectionSlug, 'read', pluginConfig, field.name),
          update: hasAccessToAction(collectionSlug, 'write', pluginConfig, field.name),
          create: hasAccessToAction(collectionSlug, 'write', pluginConfig, field.name),
        },
      } as Field;
    }

    return field;
  });
};
export * from "./access/isAdmin.js";
export * from "./access/isAdminOrSelf.js";
export * from "./access/isLoggedIn.js";
export * from './collection/Roles.js';
export * from './fields/userFields.js';
export { default as userFields } from './fields/userFields.js';
export const addAccess =
  (incomingPluginConfig: AuthorizationPluginConfig) =>
  (incomingConfig: Config): Config => {
    if (!incomingConfig || !incomingConfig.collections) {
      throw new Error('Invalid incoming configuration or collections are missing');
    }
    // Single source of truth for plugin config defaults.
    const pluginConfig: Required<Pick<AuthorizationPluginConfig, 'rolesCollection' | 'permissionsField'>> &
      AuthorizationPluginConfig = {
      ...incomingPluginConfig,
      rolesCollection: incomingPluginConfig.rolesCollection || 'roles',
      permissionsField: incomingPluginConfig.permissionsField || 'permissions',
    };
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
      collections: incomingConfig.collections?.map((collection) => {
        const isIncluded =
          pluginConfig.includedCollections
            ? pluginConfig.includedCollections.includes(collection.slug)
            : pluginConfig.excludedCollections
              ? !pluginConfig.excludedCollections.includes(collection.slug)
              : true;

        if (!isIncluded) return collection;

        const access = collection.labels
          ? createAccessCollection(
              collection.slug,
              String(collection.labels.plural ? collection.labels.plural : collection.labels),
            )
          : createAccessCollection(collection.slug);

        return {
          ...collection,
          access,
          fields:
            applyFieldAccess(collection.fields, collection.slug, pluginConfig) ??
            collection.fields,
        };
      }) as CollectionConfig[],
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
