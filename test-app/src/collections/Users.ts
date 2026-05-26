import type { CollectionConfig } from 'payload'
import { userFields } from '@shefing/authorization'

export const Users: CollectionConfig = {
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
    {
      name: 'tenants',
      type: 'relationship',
      relationTo: 'tenants',
      hasMany: true,
      saveToJWT: true,
    },
  ],
}
