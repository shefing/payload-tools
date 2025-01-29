## [Author Info plugin](./src/index.ts)

- This plugin provides an automated solution to track and store details about content creators, editors, and publishers across all collections and globals.
  It also introduces an "Author Data" tab in the authoring interface.
- Payload 3.0 is storing the creation and modification date of each document's collections but does not store publication date. So this package aslo stores the most recent publish date.

![img_1.png](./images/img_1.png)

### Setup

Install the plugin using your node package manager, e.g:

`npm add @shefing/authors-info`

In the payload.config.ts add the following:

```typescript
plugins: [
    ...plugins,
    addAuthorsFields({
      excludedCollections: [],//array of collections names to exclude
      excludedGlobals:[], // array of globals names to exclude
      usernameField: 'fullName', //name field to use from Users collection, 'user' by default
    }),
```

The dates are presented relatively using moment.js anywhere using CreatedAtCell type
![img_2.png](./images/img_2.png)
