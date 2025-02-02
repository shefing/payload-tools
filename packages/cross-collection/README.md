## [Cross-collection config plugin](./src/index.ts)

This plugin modifies the default view of the component, injecting custom behavior.

### Setup

Install the plugin using your node package manager, e.g:

`pnpm add @shefing/cross-collection`

In the payload.config.ts add the following:

```javascript
 CrossCollectionConfig({
      customComponentPaths: {// a set of paths to custom components that will be used for editing specific collections or globals
        collectionEditComponent: '/rightPanel/RightPanelEditView', // path to the custom component.
      },
      excludedCollections: ['users'],// array of collections names to exclude
      excludedGlobals:[], // array of globals names to exclude
    }),
```

