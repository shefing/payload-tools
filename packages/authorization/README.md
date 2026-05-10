## [Authorization Plugin](./src/index.ts)

**This plugin enables you to define roles** based on **basic permissions per collection**.  
✨ **Roles are assigned to users** to **control access** and manage permissions efficiently. 🚀

https://github.com/user-attachments/assets/1326d41d-8747-4582-9288-5943ee8615be

### Usage

With this plugin, you're in full control of user roles and permissions in **Payload CMS**. While there is a built-in **Administrator** role, you can go beyond that and **create custom roles** tailored to your needs.

Define roles with **any combination of permissions**—**read, write, and publish**—and apply them to **any collection or global** within your project.

### How It Works

Each role you create consists of:  
✅ **Granular Permissions:** Assign **read, write, or publish** permissions to collections and globals.  
✅ **Hierarchical Access:**

- **Write access** automatically includes **read access**.
- **Publish access** includes both **write and read access**.

✅ **Field-Level Permissions:** Restrict a permission to **specific fields** within a collection. Leave the fields list empty to apply the permission to **all fields**.

With this powerful system, you have complete flexibility in managing access control—ensuring the right people have the right level of control.  

Administrators can set as many permissions he/she wants within a role and as many as roles within a user

### Field-Level Permissions

In addition to collection-level access control, you can now restrict permissions to **specific fields** within a collection.

When defining a permission in a role, you can optionally specify a list of **field names**. If provided, the permission applies **only to those fields**. If left empty, the permission applies to **all fields** (default behavior).

#### Example

A role with a `read` permission on `articles` restricted to the `title` and `summary` fields:

```javascript
{
  entity: ['articles'],
  type: ['read'],
  fields: ['title', 'summary'],
}
```

Users with this role will be able to read the `articles` collection, but only the `title` and `summary` fields will be accessible — all other fields will be hidden.

> **Note:** Field-level permissions are stored in the JWT so they are available at runtime without an extra database lookup.
### Install 

- Install the [plugin](https://www.npmjs.com/package/@shefing/authorization) using your node package manager, e.g:

`pnpm add @shefing/authorization`

### Setup

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

Install the roles collection (you don't have to use this collection, you can write your own roles).

```javascript
  import { Roles } from '@shefing/authorization'
  collections: [...collection, Roles],

```

### Fields Configuration

The `users` collection must be update to include the following fields:

```javascript
      import {userFields} from '@shefing/authorization'

      fields:[
        ...fields,
        ...userFields,
      ]
```

### `isAdmin` Role  

When `isAdmin` is **enabled**, the user has **full access** to the system, including:  

✅ **Read, write, and publish** across all collections and globals  
✅ **Manage all content without restrictions**  
✅ **Access admin-only features**  

This role ensures complete control over the CMS, allowing seamless content management. 
###  `isGenerator` Role  

When `isGenerator` is **enabled**, the user can only generate static content **without consuming dependencies in the API**.  
```typescript
{
  name: 'belong',
  label: 'Belongs To',
  type: 'relationship',
  hasMany: true,
  relationTo: 'movies',
  index: true,
  access: {
    // Only non API users can read the field
    read: isNotGeneratorUserFieldLevel,
  }
},
```

