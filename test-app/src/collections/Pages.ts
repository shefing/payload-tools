import type { CollectionConfig } from 'payload';

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
  },
  custom: {
    filterList: [['status', 'meta.category', 'tags.label']],
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
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
    },
  ],
};
