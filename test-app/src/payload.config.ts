import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

// ── Plugin imports ────────────────────────────────────────────────────────────
import { abacPlugin, roleAttribute, tenantAttribute } from '@shefing/abac'
import { addAccess, Roles } from '@shefing/authorization'
import { addAuthorsFields as addAuthorsInfo } from '@shefing/authors-info'
import CommentsPlugin from '@shefing/comments'
import { videoCoverPlugin as CoverImagePlugin } from '@shefing/cover-image'
import CrossCollectionConfig from '@shefing/cross-collection'
import versionsPlugin from '@shefing/custom-version-view'
import DynamicFieldOverrides from '@shefing/field-type-component-override'
import CollectionQuickFilterPlugin from '@shefing/quickfilter'
import { CollectionResetPreferencesPlugin } from '@shefing/reset-list-view'
import { changesButtonPlugin } from '@shefing/changes-button'
import RightPanelPlugin from '@shefing/right-panel'
import { seed } from './seed'
import { Tenants } from './collections/Tenants'
import { Users } from './collections/Users'
import { Articles } from './collections/Articles'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Geos } from './collections/Geos'
import { Posts } from './collections/Posts'

// Admin credentials (matches seed.ts)
const ADMIN_EMAIL = 'admin@payload-tools.dev'
const ADMIN_PASSWORD = 'Password1!'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: 'users',
/*
    autoLogin: false,
*/
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },

  collections: [
    Tenants,
    Geos,
    Users,
    // ── Roles (from authorization plugin) ───────────────────────────────────
    Roles,
    Articles,
    Posts,
    Media,
    Pages,
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
      excludedCollections: ['media', 'tenants', 'geos', 'users'],
    }),
    abacPlugin({
      attributes: [
        tenantAttribute(),
        tenantAttribute({ key: 'tenants', userField: 'tenants', multiValue: true }),
        // geos: multi-value attribute on the user, matched against `posts.geo`.
        tenantAttribute({ key: 'geo', userField: 'geos', docField: 'geo', multiValue: true }),
        roleAttribute(),
      ],
      excludedCollections: ['media', 'tenants', 'geos'],
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
    await seed(payload)
  },
  secret: process.env.PAYLOAD_SECRET || 'dev-secret-change-me',
  sharp,

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
