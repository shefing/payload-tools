import type { CollectionConfig } from 'payload';
import { isAdmin, isAdminFieldLevel } from '../access/isAdmin.js';
import { isAdminOrSelf } from '../access/isAdminOrSelf.js';

export const Roles: CollectionConfig = {
  slug: 'roles',
  labels: {
    singular: {
      en: 'Role',
      he: 'תפקיד',
    },
    plural: {
      en: 'Roles',
      he: 'תפקידים',
    },
  },
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
    group: {
      en: 'Admin',
      he: 'ניהול',
    },
    useAsTitle: 'name',
    defaultColumns: ['name', 'updator', 'creator'],
  },
  fields: [
    {
      name: 'name',
      label: {
        en: 'Role Name',
        he: 'שם התפקיד',
      },
      type: 'text',
      unique: true,
      localized: true,
    },
    {
      name: 'permissions',
      labels: {
        singular: {
          en: 'Permission',
          he: 'הרשאה',
        },
        plural: {
          en: 'Permissions',
          he: 'הרשאות',
        },
      },
      label: {
        en: 'Permissions',
        he: 'הרשאות',
      },
      // Save this field to JWT so we can use from `req.user`
      saveToJWT: true,
      interfaceName: 'RolePermissions',
      type: 'array',
      access: {
        // Only admins can create or update a value for this field
        create: isAdminFieldLevel,
        update: isAdminFieldLevel,
      },
      localized: true,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'entity',
              label: {
                en: 'Collection or Global',
                he: 'אוסף או גלובלי',
              },
              type: 'select',
              hasMany: true,
              options: [],
              required: true,
              admin: {
                width: '40%',
              },
              localized: true,
            },
            {
              name: 'type',
              label: {
                en: 'Type',
                he: 'סוג',
              },
              type: 'select',
              hasMany: true,
              options: [
                {
                  label: {
                    en: 'Write',
                    he: 'כתיבה',
                  },
                  value: 'write',
                },
                {
                  label: {
                    en: 'Read',
                    he: 'קריאה',
                  },
                  value: 'read',
                },
                {
                  label: {
                    en: 'Publish',
                    he: 'פרסום',
                  },
                  value: 'publish',
                },
              ],
              required: true,
              admin: {
                width: '30%',
              },
              localized: true,
            },
            {
              name: 'fields',
              label: {
                en: 'Fields (optional)',
                he: 'שדות (אופציונלי)',
              },
              type: 'text',
              hasMany: true,
              admin: {
                width: '30%',
                description: 'Restrict this permission to specific fields (leave empty for all fields)',
              },
              localized: true,
            },
          ],
        },
      ],
    },
  ],
};






