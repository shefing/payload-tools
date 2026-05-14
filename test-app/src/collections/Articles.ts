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
