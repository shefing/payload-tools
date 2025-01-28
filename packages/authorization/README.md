## [Authorization Plugin](./src/index.ts)

This plugin enables to define roles based on basic permissions per collection. The roles are assigned to users to control access.

### Usage

There is a built-in role named administrator and users assigned to it (aka administrators) can create a Roles collection to define roles that will control access to the content. Each role contains a set of permissions that are composed of operation: read/write/publish and the collection(s) / global(s) they apply to.

Note that:
- write permission on a collection / global includes read permission on this collection / global
- publish permission on a collection / global includes write and read permission on this collection / global

Example:

![img.png](./images/img.png)

Administrators can set as many permissions he/she wants within a role and as many as roles within a user

![img_1.png](./images/img_1.png)

 ### Setup

In order to use this authorization plugin install it using your prefered node package manager, e.g:

`npm add @michalklor/authorization`

In the payload.config.ts add the following:

```typescript
plugins: [
    ...plugins,
    addAccess({
      rolesCollection: 'roles',
      permissionsField: 'permissions',
      excludedCollections: ['posts', 'media']
    }),
```

### Configuration

-`rolesCollection` - the name of the collection where roles are stored.

-`permissionsField` - the name of the field in the roles collection that defines permissions.

-`excludedCollections` - an array of collection slugs to exclude from access management.

### Fields Configuration

The `roles` collection should have the following fields:

```javascript
fields: [
  {
    name: 'name',
    type: 'text'
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

The `users` collection should have the following fields:

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
