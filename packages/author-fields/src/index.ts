import { CollectionConfig, Config, FieldAffectingData, GlobalConfig } from 'payload';
import { Field, UnnamedTab } from 'payload';
import { authorHook } from './authorHook.js';

export type IncomingCollectionVersions = {
  drafts?: boolean;
  maxPerDoc?: number;
};

export interface PluginConfig {
  /** Array of collection slugs to exclude */
  excludedCollections?: string[];
  /** Array of global slugs to exclude */
  excludedGlobals?: string[];
  /** Fileds names for creator, updator, publisher, publishDate*/
  creator?: string;
  updator?: string;
  publisher?: string;
  publishDate?: string;
}

const defaultConfig: Required<PluginConfig> = {
  excludedCollections: [],
  excludedGlobals: [],
  creator: 'creator',
  updator: 'updator',
  publisher: 'publisher',
  publishDate: 'publishDate',
};
export const addAuthorFields =
  (pluginConfig: PluginConfig = {}) =>
  (config: Config): Config => {
    const mergedConfig: Required<PluginConfig> = { ...defaultConfig, ...pluginConfig };
    const usersSlug = config.admin?.user;
    if (usersSlug === undefined) {
      throw new Error('[addAuthorFields] admin.user field is undefined');
    }
    if (config.collections !== undefined) {
      config.collections
        .filter((x) => !mergedConfig.excludedCollections.includes(x.slug))
        .forEach((currentCollection) => {
          const fields: Field[] = (currentCollection as CollectionConfig).fields;
          currentCollection.fields = processFields(
            fields,
            ((currentCollection as CollectionConfig)?.versions as IncomingCollectionVersions)
              ?.drafts as boolean,
          );
          currentCollection.hooks = {
            ...currentCollection.hooks,
            beforeChange: [
              ...((currentCollection.hooks && currentCollection.hooks.beforeChange) || []),
              authorHook(
                mergedConfig.updator,
                mergedConfig.creator,
                mergedConfig.publisher,
                mergedConfig.publishDate,
              ),
            ],
          };
        });
    }
    if (config.globals !== undefined) {
      config.globals
        .filter((globalConfig) => !mergedConfig.excludedGlobals.includes(globalConfig.slug))
        .forEach((globalConfig) => {
          globalConfig.hooks = {
            ...globalConfig.hooks,
            beforeChange: [
              ...((globalConfig.hooks && globalConfig.hooks.beforeChange) || []),
              authorHook(
                mergedConfig.updator,
                mergedConfig.creator,
                mergedConfig.publisher,
                mergedConfig.publishDate,
                true,
              ),
            ],
          };

          globalConfig.fields = processFields(
            globalConfig.fields,
            ((globalConfig as GlobalConfig)?.versions as IncomingCollectionVersions)
              ?.drafts as boolean,
          );
        });
    }
    return config;
  };
const processFields = (fields: Field[], hasDraft: boolean): Field[] => {
  if (fields.filter((field) => 'name' in field && field.name == 'createdAt').length == 0) {
    fields.push({
      name: 'createdAt',
      type: 'date',
      admin: {
        disableBulkEdit: true,
        hidden: true,
        components: {
          Cell: '@rikifrank/author-fields/client#CreatedAtCell',
        },
      },
      // The default sort for list view is createdAt. Thus, enabling indexing by default, is a major performance improvement, especially for large or a large amount of collections.
      index: true,
      label: ({ t }) => t('general:createdAt'),
    });
  }
  if (fields.filter((field) => 'name' in field && field?.name == 'updatedAt').length == 0) {
    fields.push({
      name: 'updatedAt',
      type: 'date',
      admin: {
        disableBulkEdit: true,
        hidden: true,
        components: {
          Cell: '@rikifrank/author-fields/client#CreatedAtCell',
        },
      },
      label: ({ t }) => t('general:updatedAt'),
    });
  }

  const authorFields: Field[] = [
    {
      name: 'creator',
      label: 'Created By',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'updator',
      label: 'Updated By',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
  ];
  if (hasDraft) {
    authorFields.push(
      {
        name: 'publishDate',
        type: 'date',
        admin: {
          date: {
            pickerAppearance: 'dayAndTime',
            displayFormat: 'd MMM yyy: ,h:mm:ss a',
          },
          components: { Cell: '@rikifrank/author-fields/client#CreatedAtCell' },
        },
      },
      {
        name: 'publisher',
        label: 'Published By',
        type: 'text',
        admin: {
          readOnly: true,
        },
      },
    );
  }

  const authorTab: UnnamedTab = {
    label: 'Author Data',
    fields: authorFields,
  };
  const hiddenFields = fields.filter(
    (field) => (field as FieldAffectingData).admin?.hidden === true,
  );
  if (fields[0].type == 'tabs') {
    fields[0].tabs.push(authorTab);
  } else {
    const contentTab: UnnamedTab = {
      label: 'Content',
      fields: [...fields.filter((field) => (field as FieldAffectingData).admin?.hidden !== true)],
    };
    fields = [
      {
        type: 'tabs',
        tabs: [contentTab, authorTab],
      },
      ...hiddenFields,
    ];
  }
  return fields;
};
