import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

// ── Plugin imports ────────────────────────────────────────────────────────────
import addAccess from '@shefing/authorization'
import addAuthorsInfo from '@shefing/authors-info'
import { createColorField, createBackgroundColorField } from '@shefing/color-picker'
import CommentsPlugin from '@shefing/comments'
import CoverImagePlugin from '@shefing/cover-image'
import CrossCollectionConfig from '@shefing/cross-collection'
import versionsPlugin from '@shefing/custom-version-view'
import DynamicFieldOverrides from '@shefing/field-type-component-override'
import { createIconSelectField } from '@shefing/icon-select'
import CollectionQuickFilterPlugin from '@shefing/quickfilter'
import { CollectionResetPreferencesPlugin } from '@shefing/reset-list-view'
import RightPanelPlugin from '@shefing/right-panel'
import { seed } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig(
  addAccess(
    {
      admin: {
        importMap: {
          baseDir: path.resolve(dirname),
        },
      },

      collections: [
        // ── Users (required by authorization plugin) ──────────────────────────
        {
          slug: 'users',
          auth: true,
          fields: [],
        },

        // ── Roles (required by authorization plugin) ──────────────────────────
        {
          slug: 'roles',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
            },
          ],
        },

        // ── Articles: exercises color-picker, icon-select, authors-info ───────
        {
          slug: 'articles',
          versions: {
            drafts: true,
            maxPerDoc: 10,
          },
          fields: addAuthorsInfo([
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            createColorField({ name: 'textColor', label: 'Text Color' }),
            createBackgroundColorField({ name: 'bgColor', label: 'Background Color' }),
            createIconSelectField({ name: 'icon', label: 'Icon' }),
          ]),
        },

        // ── Media: exercises cover-image plugin ───────────────────────────────
        {
          slug: 'media',
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
        url: process.env.DATABASE_URI || 'mongodb://127.0.0.1/payload-tools-dev',
      }),

      editor: lexicalEditor(),

      plugins: [
        CommentsPlugin({}),
        CoverImagePlugin({}),
        CrossCollectionConfig({}),
        versionsPlugin({}),
        DynamicFieldOverrides({}),
        CollectionQuickFilterPlugin({}),
        CollectionResetPreferencesPlugin({}),
        RightPanelPlugin({}),
      ],

      onInit: async (payload) => { await seed(payload) },
      secret: process.env.PAYLOAD_SECRET || 'dev-secret-change-me',
      sharp,

      typescript: {
        outputFile: path.resolve(dirname, 'payload-types.ts'),
      },
    },
    // addAccess options: list of entity slugs that get role-based access
    { collections: ['articles', 'pages'], globals: [] },
  ),
)
