## [Authorization Plugin](./src/index.ts)
 
This plugin enables to define roles based on basic permissions per collection. The roles are assigned to users to control access.
### Install 

- Install the [plugin](https://www.npmjs.com/package/@shefing/authorization) using your node package manager, e.g:

`pnpm add @shefing/authorization`

### Usage
With this plugin, you're in full control of user roles and permissions in **Payload CMS**. While there is a built-in **Administrator** role, you can go beyond that and **create custom roles** tailored to your needs.  

Define roles with **any combination of permissions**—**read, write, and publish**—and apply them to **any collection or global** within your project.  

### How It Works  
Each role you create consists of:  
✅ **Granular Permissions:** Assign **read, write, or publish** permissions to collections and globals.  
✅ **Hierarchical Access:**  
   - **Write access** automatically includes **read access**.  
   - **Publish access** includes both **write and read access**.  

With this powerful system, you have complete flexibility in managing access control—ensuring the right people have the right level of control.  
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
