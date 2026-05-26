import type { CollectionConfig } from 'payload'
import { createColorField, createBackgroundColorField } from '@shefing/color-picker'
import { createIconSelectField } from '@shefing/icon-select'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    defaultColumns: ['title', 'tenant', 'bgColor', 'textColor', 'icon'],
  },
  custom: {
    abac: {
      tenant: {
        docField: 'tenant',
        // Limit to document-level actions; `readVersions` would compile to
        // `{ tenant: { equals: ... } }` against the versions collection where
        // the actual path is `version.tenant`, causing 500s for non-admins.
        actions: ['read', 'update', 'delete', 'create'],
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
}
