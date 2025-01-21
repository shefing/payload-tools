## [Right-panel plugin](./src/index.ts)

We created a plugin which will enable the open of a relationship field in a right panel instead of in a pop-up.

This allows working on both of the entities ,original and relationship, at once.

This was done by adding a custom view to the edit view.

For example:

![img1.png](./images/img1.png)

### The plugin does the following:

The RightPanelPlugin adds a custom Right Panel to the Payload admin interface, enabling users to view and edit related documents alongside standard edit forms. The plugin allows configuration to include or exclude specific collections.

### collection configuration

In the collection where you want to add a Right Panel to a Relationship field, you need to include the following in the collection's admin configuration:

```javascript
  admin: {
    custom: {
      rightPanel: true,
    },

  },
```

### Fields Configuration

In the Relationship field where you want to enable the Right Panel, you need to add the following lines to the field configuration:

```javascript
    admin: {
      components: {
        Field: RelationInRightPanelField
      }
    },
```
