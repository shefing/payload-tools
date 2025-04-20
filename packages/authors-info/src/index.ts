import { CollectionConfig, Config, FieldAffectingData, GlobalConfig } from 'payload';
import { Field, UnnamedTab } from 'payload';
import { setAuthorsData } from './hooks/setAuthorsData.js';
import { AuthorsInfoPluginConfig, IncomingCollectionVersions } from './types.js';

const defaultConfig: Required<AuthorsInfoPluginConfig> = {
  excludedCollections: [],
  excludedGlobals: [],
  usernameField: 'name',
};
export const addAuthorsFields =
  (pluginConfig: AuthorsInfoPluginConfig = {}) =>
  (config: Config): Config => {
    const mergedConfig: Required<AuthorsInfoPluginConfig> = { ...defaultConfig, ...pluginConfig };
    const usersSlug = config.admin?.user;
    if (usersSlug === undefined) {
      throw new Error('[addAuthorsFields] admin.user field is undefined');
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
              setAuthorsData(
                'updator',
                'creator',
                'publisher',
                'publishDate',
                mergedConfig.usernameField,
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
              setAuthorsData(
                'updator',
                'creator',
                'publisher',
                'publishDate',
                mergedConfig.usernameField,
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
          Cell: '@shefing/authors-info/client#CreatedAtCell',
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
      localized: true,
      admin: {
        disableBulkEdit: true,
        hidden: true,
        components: {
          Cell: '@shefing/authors-info/client#UpdatedAtCell',
        },
      },
      label: {
        en: 'updateAt',
        he: 'עודכן ב',
      },
    });
  }

  const authorFields: Field[] = [
    {
      name: 'creator',
      label: {
        en: 'Created By',
        he: 'נוצר על ידי',
      },
      type: 'text',
      localized: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'updator',
      label: {
        en: 'Updated By',
        he: 'עודכן על ידי',
      },
      type: 'text',
      localized: true,
      admin: {
        readOnly: true,
      },
    },
  ];
  if (hasDraft) {
    authorFields.push(
      {
        name: 'publishDate',
        label: {
          en: 'Published Date',
          he: 'תאריך פרסום',
        },
        type: 'date',
        localized: true,
        admin: {
          date: {
            pickerAppearance: 'dayAndTime',
            displayFormat: 'd MMM yyy: ,h:mm:ss a',
          },
          components: { Cell: '@shefing/authors-info/client#CreatedAtCell' },
        },
      },
      {
        name: 'publisher',
        label: {
          en: 'Published By',
          he: 'פורסם על ידי',
        },
        localized: true,
        type: 'text',
        admin: {
          readOnly: true,
        },
      },
    );
  }

  const authorTab: UnnamedTab = {
    label: {
      en: 'Author Data',
      he: 'נתוני מחבר',
    },
    fields: authorFields,
  };
  const hiddenFields = fields.filter(
    (field) => (field as FieldAffectingData).admin?.hidden === true,
  );
  if (fields[0].type == 'tabs') {
    fields[0].tabs.push(authorTab);
  } else {
    const contentTab: UnnamedTab = {
      label: {
        en: 'Content',
        he: 'תוכן',
      },
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
