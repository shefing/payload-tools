import { hasAccessToAction } from '@/access/general';
import { Config, Plugin, SelectField } from 'payload';
import { Access, CollectionConfig, Field, GlobalConfig } from 'payload';
import { IncomingCollectionVersions } from '@/plugins/author-fields/authorFieldPlugin';
// import { ensurePath } from '@/plugins/CrossCollectionConfig';

export function ensurePath(obj: any, path: any[]) {
  return path.reduce((acc, key) => (acc[key] ??= {}), obj);
}
const addAccess: Plugin = (incomingConfig: Config): Config => {
  if (!incomingConfig || !incomingConfig.collections) {
    throw new Error('Invalid incoming configuration or collections are missing');
  }
  const entities: { label: string; value: string }[] = [];
  //For Globals and Collections
  const createAccess = (slugName: string, labelName?: string) => {
    const baseAccess: { read: Access; update: Access } = {
      read: hasAccessToAction(slugName, 'read'),
      update: hasAccessToAction(slugName, 'write'),
    };
    const label = labelName ? labelName : slugName.charAt(0).toUpperCase() + slugName.slice(1);
    entities.push({ label, value: slugName });
    return baseAccess;
  };
  //For Collections create and delete exists
  const createAccessCollection = (slugName: string, labelName?: string) => {
    const baseAccess: { read: Access; update: Access; create?: Access; delete?: Access } =
      createAccess(slugName, labelName);
    const access = {
      ...baseAccess,
      create: hasAccessToAction(slugName, 'write'),
      delete: hasAccessToAction(slugName, 'write'),
    };
    return access;
  };

  const config: Config = {
    ...incomingConfig,
    collections: incomingConfig.collections?.map(
      (collection: { slug: string; labels: { plural: any } }) => ({
        ...collection,
        ...(!['users', 'roles', 'legacyprofiles', 'media'].includes(collection.slug) && {
          access: collection.labels
            ? createAccessCollection(
                collection.slug,
                String(collection.labels.plural ? collection.labels.plural : collection.labels),
              )
            : createAccessCollection(collection.slug),
        }),
      }),
    ) as CollectionConfig[],
    globals: incomingConfig.globals?.map((global: { label: any; slug: string }) => ({
      ...global,
      access: global.label
        ? createAccess(global.slug, String(global.label))
        : createAccess(global.slug),
    })) as GlobalConfig[],
  };

  config.collections?.forEach(
    (collection: {
      versions: any;
      admin: { components: { edit: { PublishButton: any } } };
      slug: string;
      fields: Field[];
    }) => {
      if ((collection?.versions as IncomingCollectionVersions)?.drafts) {
        if (collection?.admin?.components?.edit?.PublishButton) {
          const defaultEdit = ensurePath(collection, ['admin', 'components', 'edit']);
          defaultEdit.PublishButton = '/components/buttons/CustomPublishButton';
        }
      }
      const populateOptions = (fields: Field[]) => {
        fields.forEach((field: Field) => {
          if ('fields' in field) {
            populateOptions(field.fields);
          }
          if ('name' in field) {
            if (field.name == 'entity') {
              (field as SelectField).options = entities;
            }
          } else {
            if (field.type == 'tabs') {
              field.tabs.forEach((tab: { fields: Field[] }) => populateOptions(tab.fields));
            }
          }
        });
      };

      if (collection.slug == 'roles') {
        populateOptions(collection.fields);
      }
    },
  );

  return config;
};
export default addAccess;
