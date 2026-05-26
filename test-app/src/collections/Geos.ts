import type { CollectionConfig } from 'payload'

export const Geos: CollectionConfig = {
  slug: 'geos',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    // Any authenticated user can read geos (needed for relationship field display)
    read: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
}
