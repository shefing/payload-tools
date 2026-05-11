## 🔗 [Field-type-component-override](./src/index.ts)

This plugin allows you to dynamically **override all fields of specific types** in Payload CMS — including their default components, admin options, or any other field properties — seamlessly and automatically.



## 📦 Installation

Install the plugin via your package manager:

```bash
pnpm add @shefing/field-type-component-override
```

## ⚙️ Setup

With this plugin, you can globally **define overrides for any field type** — whether replacing their admin component, setting default options like filterOptions, or forcing custom configurations.
All overrides are applied automatically across your collections and globals.



Add the following to your `payload.config.ts`:

```javascript
import DynamicFieldOverrides from '@shefing/field-type-component-override';

DynamicFieldOverrides({
  overrides: [
    {
      fieldTypes: ['text'],
      overrides: {
        admin: {
          components: {
            Field: './components/CustomTextField',
          },
        },
        label: 'Custom Label',
      },
    },
    {
      fieldTypes: ['relationship'],
      relationTo: ['someCollection'],
      overrides: {
        filterOptions: {
          where: {
            active: {
              equals: true,
            },
          },
        },
      },
    },
  ],
  excludedCollections: ['media'],
  excludedGlobals: [],
}),
```
👉 **If a field already has a value defined for a property you're trying to override — the plugin will respect the existing value and won't override it.**
This ensures that local field definitions always take precedence over global overrides.


## 🔥 Features

- **Global Field Overrides**: Define a field type in the plugin, and every instance of that type is replaced with your your settings automatically.
- **No Manual Configuration**: No need to modify each field individually—just set it once and it applies everywhere.
- **Seamless Integration**: Works with existing Payload CMS structures without disrupting data or functionality.

With this plugin, you gain **full control** over how Payload CMS fields behave and appear—without the need for repetitive manual overrides! ✨

## Roadmap

See the consolidated [`ROADMAP.md`](../../ROADMAP.md#field-type-component-override) at the repo root and the live [`RoadMap` issues for Field-type Override](https://github.com/shefing/payload-tools/labels/plugin%3Afield-type-components-override).

### P0

- **Predicate matcher** — `match: (field, ctx) => boolean` supporting name/regex/`admin.condition` matching.
- **Override ordering & merge** — deterministic precedence; deep-merge `admin.components` instead of replace.
- **Scope to collections / globals** — `includedCollections` / `excludedCollections`.

### P1

- Built-in override presets bundle (date pickers, slugify-on-blur, masked inputs) as opt-in helpers.
- Dev-time logger printing which override hit which field on boot.

### P2

- Storybook-style playground page (`/admin/_internal/field-overrides`) listing every override + live preview.

