## 🔗 [Dynamic Field Overrides Plugin](./src/index.ts)

This plugin allows you to **dynamically override field types and components** in Payload CMS, giving you greater flexibility in managing your collections.

## 📦 Installation

Install the plugin via your package manager:

```bash
pnpm add @shefing/dynamic-field-overrides
```

## ⚙️ Setup

To override specific field admin components, add the following to your `payload.config.ts`:

```javascript
import { DynamicFieldOverrides } from '@shefing/dynamic-field-overrides';

DynamicFieldOverrides({
    {
      type: 'upload', // Override all 'upload' fields
      component: CustomMediaComponent, // Custom React component
    },
    {
      type: 'relationship', // Override all 'relationship' fields
      component: CustomRelationshipComponent,
    },
});
```

## 🔥 Features

- **Dynamic Overrides**: Easily replace default field types with custom React components.
- **Seamless Integration**: Works with existing Payload CMS structures without additional setup.

With this plugin, you have **full control** over how Payload CMS fields behave and appear! ✨
