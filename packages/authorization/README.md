## [Authorization Plugin](./src/index.ts)
 
This plugin enables to define roles based on basic permissions per collection. The roles are assigned to users to control access.
### Install 

- Install the [plugin](https://www.npmjs.com/package/@shefing/authorization) using your node package manager, e.g:

`npm add @shefing/authorization`

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
  import { Roles } from '@shefing/authorization/roles'
  collections: [...collection, Roles],

```
### Fields Configuration




The `users` collection must be update to include the following fields:

```javascript
      import userFields from '@shefing/authorization/user-fields'

      fields:[
        ...fields,
        ...userFields,
      ]