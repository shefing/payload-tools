## [Right-panel plugin](./src/index.ts)

This plugin enables opening a relationship field in a right panel, in addition to a pop-up.

This allows working on both of the entities ,original and relationship, at once.

This was done by adding a custom view to the edit view.

For example:

![img1.png](./images/img1.png)

### Setup

Install the plugin using your node package manager, e.g:

`npm add @shefing/right-panel`

In the payload.config.ts add the following:

```javascript
plugins: [
...plugins
RightPanelPlugin({
  excludedCollections: [] //array of collections names to exclude
});
]
```

### Collection Configuration

To add a Right Panel to a Relationship field, include the following in the collection's admin configuration:

```javascript
  admin: {
    custom: {
      rightPanel: true,
    },

  },
```

### Fields Configuration

To enable the Right Panel in the Relationship field, add the following lines to the field configuration:

```javascript
    admin: {
      components: {
        Field:
        components: {
            Field: '@shefing/right-panel/components/RelationInRightPanelField'
        }
      }
    },
```
