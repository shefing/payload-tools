import { mongooseAdapter } from '@payloadcms/db-mongodb';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import path from 'path';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

// ── Plugin imports ────────────────────────────────────────────────────────────
import { abacPlugin, roleAttribute, tenantAttribute } from '@shefing/abac';
import { addAccess, Roles, userFields } from '@shefing/authorization';
import { addAuthorsFields as addAuthorsInfo } from '@shefing/authors-info';
import { createColorField, createBackgroundColorField } from '@shefing/color-picker';
import CommentsPlugin from '@shefing/comments';
import { videoCoverPlugin as CoverImagePlugin } from '@shefing/cover-image';
import CrossCollectionConfig from '@shefing/cross-collection';
import versionsPlugin from '@shefing/custom-version-view';
import DynamicFieldOverrides from '@shefing/field-type-component-override';
import { createIconSelectField } from '@shefing/icon-select';
import CollectionQuickFilterPlugin from '@shefing/quickfilter';
import { CollectionResetPreferencesPlugin } from '@shefing/reset-list-view';
import { changesButtonPlugin } from '@shefing/changes-button';
import RightPanelPlugin from '@shefing/right-panel';
import { seed } from './seed';

// Admin credentials (matches seed.ts)
const ADMIN_EMAIL = 'admin@payload-tools.dev';
const ADMIN_PASSWORD = 'Password1!';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: 'users',
    autoLogin:
      process.env.NODE_ENV === 'development'
        ? { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
        : false,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },

  collections: [
    {
      slug: 'tenants',
      admin: {
        useAsTitle: 'name',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
      ],
    },

    // ── Users (required by authorization plugin) ──────────────────────────
    {
      slug: 'users',
      admin: {
        useAsTitle: 'email',
      },
      auth: {
        useAPIKey: true,
      },
      fields: [
        ...userFields,
        {
          name: 'tenant',
          type: 'relationship',
          relationTo: 'tenants',
          saveToJWT: true,
        },
      ],
    },

    // ── Roles (from authorization plugin) ───────────────────────────────────
    Roles,

    // ── Articles: exercises color-picker, icon-select, authors-info ───────
    {
      slug: 'articles',
      admin: {
        defaultColumns: ['title', 'tenant', 'bgColor', 'textColor', 'icon'],
      },
      custom: {
        abac: {
          tenant: {
            docField: 'tenant',
          },
        },
      },
      versions: {
        drafts: true,
        maxPerDoc: 10,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        createColorField({ name: 'textColor', label: 'Text Color' }),
        createBackgroundColorField({ name: 'bgColor', label: 'Background Color' }),
        createIconSelectField({ name: 'icon', label: 'Icon' }),
        {
          name: 'tenant',
          type: 'relationship',
          relationTo: 'tenants',
        },
      ],
    },

    // ── Media: exercises cover-image plugin ───────────────────────────────
    {
      slug: 'media',
      access: {
        read: () => true,
      },
      fields: [
        {
          name: 'alt',
          type: 'text',
        },
      ],
      upload: {
        staticDir: path.resolve(dirname, 'media'),
      },
    },

    // ── Pages: exercises right-panel, quickfilter, reset-list-view ────────
    {
      slug: 'pages',
      admin: {
        useAsTitle: 'title',
      },
      custom: {
        filterList: [['status', 'meta.category', 'tags.label']],
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          options: ['draft', 'published', 'archived'],
        },
        {
          name: 'meta',
          type: 'group',
          fields: [
            {
              name: 'category',
              type: 'select',
              options: [
                { label: 'Blog', value: 'blog' },
                { label: 'Landing', value: 'landing' },
                { label: 'Documentation', value: 'docs' },
              ],
            },
            {
              name: 'publishedDate',
              type: 'date',
            },
          ],
        },
        {
          name: 'tags',
          type: 'array',
          fields: [
            {
              name: 'label',
              type: 'select',
              options: [
                { label: 'Featured', value: 'featured' },
                { label: 'New', value: 'new' },
                { label: 'Popular', value: 'popular' },
              ],
            },
          ],
        },
      ],
    },
  ],

  db: mongooseAdapter({
    url:
      process.env.DATABASE_URI ||
      process.env.DATABASE_URL ||
      'mongodb://127.0.0.1/payload-tools-dev',
  }),

  editor: lexicalEditor(),

  plugins: [
    addAccess({
      rolesCollection: 'roles',
      permissionsField: 'permissions',
      excludedCollections: ['media'],
    }),
    abacPlugin({
      attributes: [tenantAttribute(), roleAttribute()],
      excludedCollections: ['media'],
    }),
    // CommentsPlugin({}),
    // CoverImagePlugin({}),
    CrossCollectionConfig({}),
    versionsPlugin({}),
    DynamicFieldOverrides({ overrides: [] }),
    CollectionQuickFilterPlugin({ includedCollections: ['pages'] }),
    CollectionResetPreferencesPlugin({}),
    changesButtonPlugin(),
    addAuthorsInfo({ usernameField: 'email' }),
    // RightPanelPlugin({}),
  ],

  onInit: async (payload) => {
    await seed(payload);
  },
  secret: process.env.PAYLOAD_SECRET || 'dev-secret-change-me',
  sharp,

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
});
