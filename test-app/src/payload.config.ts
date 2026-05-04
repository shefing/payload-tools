import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

// ── Plugin imports ────────────────────────────────────────────────────────────
import { addAccess, Roles, userFields } from '@shefing/authorization'
import { addAuthorsFields as addAuthorsInfo } from '@shefing/authors-info'
import { createColorField, createBackgroundColorField } from '@shefing/color-picker'
import CommentsPlugin from '@shefing/comments'
import { videoCoverPlugin as CoverImagePlugin } from '@shefing/cover-image'
import CrossCollectionConfig from '@shefing/cross-collection'
import versionsPlugin from '@shefing/custom-version-view'
import DynamicFieldOverrides from '@shefing/field-type-component-override'
import { createIconSelectField } from '@shefing/icon-select'
import CollectionQuickFilterPlugin from '@shefing/quickfilter'
import { CollectionResetPreferencesPlugin } from '@shefing/reset-list-view'
import RightPanelPlugin from '@shefing/right-panel'
import { seed } from './seed'

// Admin credentials (matches seed.ts)
const ADMIN_EMAIL = 'admin@payload-tools.dev'
const ADMIN_PASSWORD = 'Password1!'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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
    // ── Users (required by authorization plugin) ──────────────────────────
    {
      slug: 'users',
      admin: {
        useAsTitle: 'email',
      },
      auth: {
        useAPIKey: true,
      },
      fields: [...userFields],
    },

    // ── Roles (from authorization plugin) ───────────────────────────────────
    Roles,

    // ── Articles: exercises color-picker, icon-select, authors-info ───────
    {
      slug: 'articles',
      admin: {
        defaultColumns: ['title', 'bgColor', 'textColor', 'icon'],
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
        filterList: [['status']],
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
    // CommentsPlugin({}),
    // CoverImagePlugin({}),
    CrossCollectionConfig({}),
    versionsPlugin({}),
    DynamicFieldOverrides({ overrides: [] }),
    CollectionQuickFilterPlugin({ includedCollections: ['pages'] }),
    CollectionResetPreferencesPlugin({}),
    addAuthorsInfo({ usernameField: 'email' }),
    // RightPanelPlugin({}),
  ],

  onInit: async (payload) => {
    await seed(payload)
  },
  secret: process.env.PAYLOAD_SECRET || 'dev-secret-change-me',
  sharp,

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
