## [Cross Collection config plugin](./src/index.ts)

We created a plugin which will utilize metadata collection to inject behavior.

### The plugin does the following:

The plugin overrides the default view of the component, injecting custom behavior based on metadata.

### Plugins Configuration

```javascript
 CrossCollectionConfig({
      customComponentPaths: {
        collectionEditComponent: '/rightPanel/RightPanelEditView',
      },
      excludedCollections: ['users'],
    }),
```
