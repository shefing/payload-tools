## [Cross Collection config plugin](./src/index.ts)

We created a plugin which will override the default view of the component, injecting custom behavior based on metadata.

### Setup

In order to use this authorization cross collection plugin install it using your prefered node package manager, e.g:

`npm add @michalklor/cross-collection`

In the payload.config.ts add the following:

```javascript
 CrossCollectionConfig({
      customComponentPaths: {
        collectionEditComponent: '/rightPanel/RightPanelEditView',
      },
      excludedCollections: ['users'],
    }),
```

### Configuration

- `excludedCollections`: array of collections names to exclude

- `excludedGlobals`: array of globals names to exclude

- `customComponentPaths`: a set of paths to custom components that will be used for editing specific collections or globals.
 
