## 🔗 [Cross-Collection Config Plugin](./src/index.ts)

The **Cross-Collection Config Plugin** empowers you to modify the default view of components in Payload CMS, injecting **custom behaviors** and offering **global configuration capabilities** not natively supported.

**Key Feature:** Achieve **global configurations** across your project, even for settings not available in Payload’s core configuration.

### ⚙️ **Setup Instructions**

1️⃣ **Install the Plugin:**

```bash
pnpm add @shefing/cross-collection
```

2️⃣ **Integrate in `payload.config.ts`:**

```javascript
CrossCollectionConfig({
  customComponentPaths: { //  Paths to custom components for editing collections/globals
    collectionEditComponent: '/rightPanel/RightPanelEditView', //  Custom component path
  },
  excludedCollections: ['users'], //  Collections to exclude
  excludedGlobals: [],            //  Globals to exclude
});
```

---

💡 **Pro Tip:** Use this plugin to **standardize UI components** and **apply consistent behaviors** globally across collections—perfect for complex content management setups.

