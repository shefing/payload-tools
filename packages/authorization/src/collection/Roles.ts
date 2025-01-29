import type { CollectionConfig } from 'payload';
import { isAdmin, isAdminFieldLevel } from '../access/isAdmin';
import { isAdminOrSelf } from '../access/isAdminOrSelf';

export const Roles: CollectionConfig = {
  slug: 'roles',
  access: {
    // Only admins can create users
    create: isAdmin,
    // Admins can read all, but any other logged in user can only read themselves
    read: isAdminOrSelf,
    // Admins can update all, but any other logged in user can only update themselves
    update: isAdminOrSelf,
    // Only admins can delete
    delete: isAdmin,
  },
  admin: {
    group: 'Admin',
    useAsTitle: 'name',
    defaultColumns: ['name', 'updator', 'creator'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      unique: true,
    },
    {
      name: 'permissions',
      // Save this field to JWT so we can use from `req.user`
      saveToJWT: true,
      interfaceName: 'RolePermissions',
      type: 'array',
      access: {
        // Only admins can create or update a value for this field
        create: isAdminFieldLevel,
        update: isAdminFieldLevel,
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'entity',
              label: 'Collection or Global',
              type: 'select',
              hasMany: true,
              options: [],
              required: true,
              admin: {
                width: '70%',
              },
            },
            {
              name: 'type',
              label: 'Type',
              type: 'select',
              hasMany: true,
              options: [
                {
                  label: 'Write',
                  value: 'write',
                },
                {
                  label: 'Read',
                  value: 'read',
                },
                {
                  label: 'Publish',
                  value: 'publish',
                },
              ],
              required: true,
              admin: {
                width: '30%',
              },
            },
          ],
        },
      ],
    },
  ],
};
