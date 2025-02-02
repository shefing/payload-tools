## [Right-panel plugin](./src/index.ts)
 

This plugin enhances the **relationship field** experience by allowing you to open it in a **right-side panel**, alongside the traditional pop-up.  

✅ **Edit both the original and related entities simultaneously**  
✅ **Seamlessly switch between records without losing context**  
✅ **Integrated directly into the edit view for a smooth workflow**  

This is achieved by extending the **default edit view** with a custom panel, making it easier than ever to manage related content efficiently.   

https://github.com/user-attachments/assets/cfc0b69d-94f7-424a-9514-17cf9e2fd7c7

### Setup

Install the plugin using your node package manager, e.g:

`pnpm add @shefing/right-panel`

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
