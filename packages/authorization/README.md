## [Authorization Plugin](./src/index.ts)

This plugin enables to define roles based on basic permissions per collection. The roles are assigned to users to control access.

### Usage

There is a built-in role named administrator and users assigned to it (aka administrators) can create a Roles collection to define roles that will control access to the content. Each role contains a set of permissions that are composed of operation: read/write/publish and the collection(s) / global(s) they apply to.

Note that:

- write permission on a collection / global includes read permission on this collection / global
- publish permission on a collection / global includes write either read permission on this collection / global

Example:

![img.png](./images/img.png)

Administrators can set as many permissions he/she wants within a role and as many as roles within a user

![img_1.png](./images/img_1.png)

### Setup

- Install the [plugin](https://www.npmjs.com/package/@shefing/authorization) using your node package manager, e.g:

`npm add @shefing/authorization`

In the payload.config.ts add the following:

```typescript
plugins: [
    ...plugins,
    addAccess({
      rolesCollection: 'roles', // name of the collection defining the roles
      permissionsField: 'permissions', // name of the field within the role collection
      excludedCollections: ['posts', 'media'] // enable to exclude some collections from permission control
    }),
```

### Fields Configuration

You need to create the `roles` collection and it must have the following fields:

```javascript
fields: [
  {
    name: 'name',
    type: 'text',
  },
  {
    name: 'permissions',
    saveToJWT: true,
    interfaceName: 'RolePermissions',
    type: 'array',
    access: {
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
          },
        ],
      },
    ],
  },
];
```

The `users` collection must be update to include the following fields:

```javascript
        {
          name: 'isAdmin',
          type: 'checkbox',
          defaultValue: false,
          saveToJWT: true,
          access: {
            // Only admins can create or update a value for this field
            create: isAdminFieldLevel,
            update: isAdminFieldLevel,
          },
        },
        {
          name: 'isGeneratorUser',
          type: 'checkbox',
          defaultValue: false,
          saveToJWT: true,
          access: {
            // Only admins can create or update a value for this field
            create: isAdminFieldLevel,
            update: isAdminFieldLevel,
          },
        },
        {
        name: 'userRoles',
        type: 'relationship',
        saveToJWT: true,
        relationTo: 'roles', // Reference the 'roles' collection
        hasMany: true, // Allow multiple roles per user
        access: {
            // Only admins can create or update a value for this field
            create: isAdminFieldLevel,
            update: isAdminFieldLevel,
        },
        },
```
