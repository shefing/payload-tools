## 🔗 [Field-type-component-override](./src/index.ts)

This plugin allows you to **dynamically override all fields of a specific type** in Payload CMS, replacing their default components with custom ones—seamlessly and automatically!

## 📦 Installation

Install the plugin via your package manager:

```bash
pnpm add @shefing/dynamic-field-overrides
```

## ⚙️ Setup

With this plugin, you can **define a field type once** and override all occurrences of that type across your collections with a custom React component.

Add the following to your `payload.config.ts`:

```javascript
import { DynamicFieldOverrides } from '@shefing/dynamic-field-overrides';

 DynamicFieldOverrides({
      fieldType: 'text',
      componentPath: './component/CustomText',
       excludedCollections: ['media'],
       excludedGlobals:[]
    }),
```

## 🔥 Features

- **Global Field Overrides**: Define a field type in the plugin, and every instance of that type is replaced with your custom component.
- **No Manual Configuration**: No need to modify each field individually—just set it once and it applies everywhere.
- **Seamless Integration**: Works with existing Payload CMS structures without disrupting data or functionality.

With this plugin, you gain **full control** over how Payload CMS fields behave and appear—without the need for repetitive manual overrides! ✨
