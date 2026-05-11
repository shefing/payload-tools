## 🔗 [Cross-Collection Config Plugin](./src/index.ts)


This plugin allows you to **override** default Payload CMS component views and inject custom behavior.

## 📦 Installation

Install the plugin via your package manager:

```bash
pnpm add @shefing/cross-collection
```
## ⚙️ Setup

To override a component's view in Payload, add the following to your `payload.config.ts`:

```javascript
```javascript
import { CrossCollectionConfig } from '@shefing/cross-collection';

CrossCollectionConfig({
  customOverrides: {
    // Replace the default edit view
    'admin.components.views.edit.default': CustomCollectionEdit,

    // Replace the versions edit view
    'admin.components.views.edit.versions': CustomCollectionEdit,
    // enable to exclude some collections from permission control
    excludedCollections: ['posts', 'media'],
    // array of globals names to exclude
    excludedGlobals:[], 

  },
});
```



## 🔥 Features

- **Full Control**: Override any Payload component view.
- **Easy Customization**: Replace edit views, list views, and more with custom React components.
- **Flexible**: Override any default view across the CMS.

With this plugin, you have **full control** over how every component view in Payload CMS appears! ✨

## Roadmap

See the consolidated [`ROADMAP.md`](../../ROADMAP.md#cross-collection-config) at the repo root and the live [`RoadMap` issues for Cross-Collection](https://github.com/shefing/payload-tools/labels/plugin%3Across-collection).

### P0

- **Type-safe override keys** — TS union for the supported `admin.components.views.*` paths.
- **Conditional overrides** — apply only when `(collection, user, locale) => boolean` returns true.
- **Merge instead of replace** mode for nested admin components.

### P1

- Override `admin.components.beforeList` / `afterList` / `beforeFields` / `afterFields` across many collections.
- Per-collection allow-list (inverse of `excludedCollections`).
