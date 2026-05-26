import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'geo', 'updatedAt'],
  },
  custom: {
    abac: {
      // Geo scoping applies only to update (and create/delete).
      // Read remains unrestricted so Rangers and Users can view all geos.
      geo: {
        docField: 'geo',
        actions: ['update', 'create', 'delete'],
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
      name: 'geo',
      type: 'relationship',
      relationTo: 'geos',
      required: true,
      // Default to the user's first geo on create so rangers don't have to choose.
      defaultValue: ({ user }) => {
        const geos = (user as { geos?: Array<string | { id?: string | number }> } | null)?.geos
        if (!Array.isArray(geos) || geos.length === 0) return undefined
        const first = geos[0]
        return typeof first === 'string' || typeof first === 'number' ? first : first?.id
      },
      // Constrain the dropdown to the geos the current user belongs to.
      // Admins (isAdmin) see all geos; rangers see only their assigned geos;
      // users with no geos see none. ABAC still enforces row-level update access
      // server-side as a defence-in-depth check.
      filterOptions: ({ user }) => {
        if (!user) return false
        if ((user as { isAdmin?: boolean }).isAdmin === true) return true
        const geos = (user as { geos?: Array<string | { id?: string | number }> } | null)?.geos
        if (!Array.isArray(geos) || geos.length === 0) return false
        const ids = geos
          .map((g) => (typeof g === 'string' || typeof g === 'number' ? g : g?.id))
          .filter((id): id is string | number => id != null)
        return { id: { in: ids } }
      },
    },
    {
      name: 'content',
      type: 'textarea',
    },
  ],
}
