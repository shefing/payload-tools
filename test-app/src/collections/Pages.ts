import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
  },
  custom: {
    filterList: [['status']],
    abac: {
      tenants: {
        docField: 'tenant',
      },
    },
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
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
    },
  ],
}
