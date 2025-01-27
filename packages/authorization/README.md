## [Authorization plugin](./src/index.ts)

We have developed a plugin that offers flexibility in defining roles for your organization.

### Overview

Using this plugin, administrators can configure a Roles collection to define any roles required within the organization. Each role can include a set of permissions. These permissions allow administrators to specify access levels for various globals and collections, including:

-The entities (globals or collections) to which the role applies.

-The types of permissions granted, such as read, write, or publish.

For example:

![img.png](./images/img.png)

The Admin can set as many permissions it wants and as many as roles as well.

Then the Admin assigns each user its roles:
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
