# 🚀 QuickFilter Plugin for PayloadCMS

#!!! Payload 3.49 breaks the plugin - https://github.com/payloadcms/payload/pull/13200 We are working to fix that

⚡ **Lightning-fast and intuitive filtering that your users will love!**

Transform your PayloadCMS admin experience with instant, intuitive filters that appear right where you need them. Say goodbye to clunky filter forms and welcome to seamless data exploration!

## ✨ Features

| Feature                      | Description                                        | Icon                                                                 |
| ---------------------------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| **⚡ Instant Filtering**     | Apply filters immediately without page reloads     | ![Instant](https://img.shields.io/badge/Speed-Instant-brightgreen)   |
| **🎛️ Multiple Filter Types** | Date, select, checkbox, and small select filters   | ![Types](https://img.shields.io/badge/Types-4-blue)                  |
| **📱 Responsive Layout**     | Configurable row-based layout with custom widths   | ![Responsive](https://img.shields.io/badge/Layout-Responsive-orange) |
| **🌍 Internationalization**  | Full i18n support with RTL language compatibility  | ![i18n](https://img.shields.io/badge/Languages-6-purple)             |
| **💾 Persistent State**      | Filters persist in localStorage and URL parameters | ![Persistent](https://img.shields.io/badge/State-Persistent-yellow)  |
| **📅 Smart Date Filtering**  | Predefined ranges + custom date picker             | ![Dates](https://img.shields.io/badge/Dates-Smart-red)               |

### 🎥 See It In Action



https://github.com/user-attachments/assets/e609ca50-26fc-46c3-98fe-1651d2bacc7b



---

### 📋 Requirements

- ✅ PayloadCMS 3.0+
- ✅ React 18+
- ✅ TypeScript (recommended)
- ✅ Tailwind CSS (for styling)

> 🚨 **Important**: Make sure your project has Tailwind CSS configured, as the plugin uses Tailwind classes for styling.
> Add the following path to your tailwind.config.js under the content array:

```ts
// tailwind.config.js

module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}', // your app paths
    './node_modules/@shefing/quickfilter/**/*.{js,ts,jsx,tsx}', // ✅ required for QuickFilter
  ],
  // ...rest of your config
  // Here we scope the Tailwind not to intefere with the Admin UI  
    plugins: [
        scopedPreflightStyles({
            isolationStrategy: isolateInsideOfContainer(['.useTw']),
        }),
    ],
};
```

---

### ⚡ Quick Start (2 minutes!)

<details>
<summary>📦 Step 1: Install the Package</summary>

```bash
pnpm add @shefing/quickfilter
```

</details>

<details>
<summary>⚙️ Step 2: Configure PayloadCMS</summary>

```ts
// payload.config.ts

import { CollectionQuickFilterPlugin } from '@shefing/quickfilter';

export default buildConfig({
  plugins: [CollectionQuickFilterPlugin({})],
});
```

</details>

<details>
<summary>⚙️ Step 3: Configure Collections</summary>

```typescript
export const Users: CollectionConfig = {
  slug: 'users',
  custom: {
    filterList: [
      ['status', 'role'], // First row with two filters
      ['createdAt'], // Second row with one filter
      [
        { name: 'department', width: '300px' }, // Custom width
        'isActive',
      ],
    ],
  },
  // ... rest of your collection config
};
```

</details>

---



## ⚙️ Collections Configuration

Transform any collection into a filtering powerhouse! Just add a `filterList` to your collection's `custom` property:

```typescript
export const Users: CollectionConfig = {
  slug: 'users',
  custom: {
    filterList: [
      ['status', 'role'], // First row with two filters
      ['createdAt'], // Second row with one filter
      [
        { name: 'department', width: '300px' }, // Custom width
        'isActive',
      ],
    ],
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
        { label: 'Editor', value: 'editor' },
      ],
    },
    {
      name: 'createdAt',
      type: 'date',
    },
    {
      name: 'isActive',
      type: 'checkbox',
    },
  ],
};
```

### 🎨 Filter Configuration Options

#### 📐 Row Layout Magic

```typescript
filterList: [
  // 🔥 Mix and match however you want!
  ['status', 'role', 'department'], // 3 filters in one row
  ['createdAt'], // Single filter gets full width
  [{ name: 'tags', width: '400px' }], // Custom width for long lists
  ['isActive', 'isVerified'], // Two checkboxes side by side
];
```

| Format           | Example                                          | Result                       |
| ---------------- | ------------------------------------------------ | ---------------------------- |
| 📝 **String**    | `'fieldName'`                                    | Default width (230px)        |
| 🎛️ **Object**    | `{ name: 'field', width: '300px' }`              | Custom width                 |
| 📊 **Mixed Row** | `['field1', { name: 'field2', width: '400px' }]` | Different widths in same row |

#### 🎯 Supported Field Types

<details>
<summary>📅 <strong>Date Fields</strong> - Smart date filtering made easy</summary>

```typescript
{
  name: 'createdAt',
  type: 'date'
}
```

**✨ What you get:**

- 🕐 **Predefined time ranges**: Yesterday, Last Week, Last Month, All Past
- 🔮 **Future options**: Today, Next Week, Next Month, All Future
- 🎯 **Custom range**: Pick any from/to dates
- 🌍 **Localized**: Date formats adapt to user's language

![Date Filter Preview](./screenshots/date-filter-options.png)

</details>

<details>
<summary>📋 <strong>Select Fields</strong> - Powerful multi-select with intelligence</summary>

```typescript
{
  name: 'status',
  type: 'select',
  options: [
    { label: 'Published', value: 'published' },
    { label: 'Draft', value: 'draft' },
    { label: 'Archived', value: 'archived' }
  ]
}
```

**🧠 Smart behavior:**

- 🔘 **≤3 options**: Compact button-style selector
- 📝 **>3 options**: Full dropdown with search
- ✅ **Multi-select**: Choose multiple values
- 🔍 **Search**: Find options in large lists quickly

![Select Filter Types](./screenshots/select-filter-comparison.png)

</details>

<details>
<summary>☑️ <strong>Checkbox Fields</strong> - Three-state filtering</summary>

```typescript
{
  name: 'isActive',
  type: 'checkbox'
}
```

**🎛️ Three states:**

- ✅ **Checked**: Show only `true` values
- ❌ **Unchecked**: Show only `false` values
- ➖ **Undefined**: Show all (default)

Perfect for boolean fields like active/inactive, published/unpublished, etc.

</details>

## 🎮 Usage

### 🖥️ User Interface

The magic happens right above your collection table! Here's what your users will see:

<details>
<summary>🔽 <strong>Collapsed State</strong> - Clean and minimal</summary>

```
┌─────────────────────────────────────┐
│ 🔍 Quick Filters                   │  ← Clean button when no filters active
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🔍 2 Active filters: Status • Role │  ← Shows count and field names
└─────────────────────────────────────┘
```

![Collapsed States](./screenshots/collapsed-comparison.png)

</details>

<details>
<summary>🔽 <strong>Expanded State</strong> - All your filters beautifully laid out</summary>

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 2 Active filters: Status • Role                      ❌ │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Status ▼        Role ▼           Department ▼             │
│  [Published]     [Admin    ]      [Engineering    ]        │
│                                                             │
│  Created Date ▼                                            │
│  [Last Week ▼]                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**✨ What users love:**

- 👀 **Visual feedback**: See exactly which filters are active
- 🧹 **One-click clear**: Remove all filters instantly with the ❌ button
- 💾 **Persistent**: Filters stay active when you refresh or navigate back
- ⚡ **Instant results**: Table updates immediately as you change filters

</details>

### 🎯 Filter Types in Detail


<details>
<summary>📋 <strong>Select Filter</strong> - Intelligence that adapts</summary>

**🧠 Smart Behavior:**

```typescript
// 🔘 Small lists (≤3 options) = Button style
[Active] [Inactive] [Pending]

// 📝 Large lists (>3 options) = Dropdown with search
┌─────────────────────────┐
│ 🔍 Search options...    │
├─────────────────────────┤
│ ✅ Published            │
│ ✅ Draft                │
│ ⬜ Archived             │
│ ⬜ Under Review         │
└─────────────────────────┘
```


![Select Filter Types](./screenshots/select-intelligence.png)

</details>

<details>
<summary>☑️ <strong>Checkbox Filter</strong> - Three-state perfection</summary>

**🎛️ The Three States:**

| State                | Visual | Behavior                 | Use Case                   |
| -------------------- | ------ | ------------------------ | -------------------------- |
| ✅ **Checked**       | `[✓]`  | Show only `true` values  | "Show only active users"   |
| ❌ **Unchecked**     | `[ ]`  | Show only `false` values | "Show only inactive users" |
| ➖ **Undefined** | `[-]`  | Show all values          | "Show everyone" (default)  |

Perfect for boolean fields like:

- 🟢 Active/Inactive
- 📝 Published/Unpublished
- ✅ Verified/Unverified
- 🔒 Public/Private

</details>

## 🆚 Why Choose QuickFilter Over Regular PayloadCMS Filters?

### 🚀 **1. User Experience Revolution**

<details>
<summary>Click to see the UX improvements</summary>

| Aspect            | QuickFilter Experience                      | Regular Filter Experience                  |
| ----------------- | ------------------------------------------- | ------------------------------------------ |
| **🎯 Simplicity** | Click and filter                            | Navigate to filter page, fill form, submit |
| **⚡ Speed**      | Instant results as you click                | Wait for page reload every time            |
| **👀 Clarity**    | `🔍 3 Active filters: Status • Role • Date` | Guess what filters are active              |
| **💾 Persistent**     | Filters persist across sessions             | Start over every time                      |


</details>

### ⚡ **2. Performance That Scales**


**🎯 What we support:**

- ⌨️ **Full keyboard navigation**: Tab through all filters
- 🔊 **Screen reader friendly**: Proper ARIA labels and descriptions
- 🌍 **RTL languages**: Native Hebrew/Arabic support
- 🎨 **High contrast**: Works with accessibility themes
- 📱 **Touch friendly**: Perfect for mobile and tablet users

</details>



## 🌍 Internationalization

### 🗣️ Built-in Language Support

The plugin speaks your users' language! Full translations included for:

| Language       | Code | RTL Support | Status      |
| -------------- | ---- | ----------- | ----------- |
| 🇺🇸 **English** | `en` | -           | ✅ Complete |
| 🇮🇱 **Hebrew**  | `he` | ✅ Yes      | ✅ Complete |
| 🇸🇦 **Arabic**  | `ar` | ✅ Yes      | ✅ Complete |
| 🇫🇷 **French**  | `fr` | -           | ✅ Complete |
| 🇪🇸 **Spanish** | `es` | -           | ✅ Complete |
| 🇨🇳 **Chinese** | `zh` | -           | ✅ Complete |

### 🔧 Adding Custom Languages

<details>
<summary>🌐 <strong>Extend language support</strong></summary>
PRs are welcomed

```typescript
// In labels.ts, add your language
export const PLUGIN_LABELS = {
  // ... existing languages
  de: {
    quickFilters: 'Schnellfilter',
    clearFilters: 'Filter löschen',
    activeFilterSingular: 'Aktiver Filter auf Spalte',
    activeFilterPlural: 'Aktive Filter auf Spalten',
    custom: 'Benutzerdefiniert',
    all: 'Alle',
    yes: 'Ja',
    no: 'Nein',
    // ... add all other translations
  },
  ja: {
    quickFilters: 'クイックフィルター',
    clearFilters: 'フィルターをクリア',
    // ... Japanese translations
  },
};
```

</details>


## 🔧 Advanced Configuration

### 🎨 Custom Filter Widths

<details>
<summary>🎯 <strong>Perfect your layout</strong></summary>

```typescript
filterList: [
  [
    { name: 'longFieldName', width: '400px' }, // Wide for long option lists
    { name: 'shortField', width: '150px' }, // Narrow for simple fields
  ],
  [
    { name: 'description', width: '100%' }, // Full width for text fields
    'status', // Default width (230px)
  ],
];
```

**📏 Width Options:**

- `'150px'` - Compact for simple fields
- `'230px'` - Default width (when not specified)
- `'400px'` - Wide for complex selects
- `'100%'` - Full row width
- `'50%'` - Half row width

</details>

### 🎛️ Conditional Plugin Loading

<details>
<summary>⚙️ <strong>Environment-based configuration</strong></summary>

```typescript
// Disable in development
CollectionQuickFilterPlugin({
  disabled: process.env.NODE_ENV === 'development',
});

// Enable only for specific environments
CollectionQuickFilterPlugin({
  disabled: !['production', 'staging'].includes(process.env.NODE_ENV),
});

// Feature flag support
CollectionQuickFilterPlugin({
  disabled: !process.env.ENABLE_QUICK_FILTERS,
});
```

**🎯 Use Cases:**

- 🧪 **Testing**: Disable during development
- 🚀 **Gradual rollout**: Enable for specific environments
- 🎚️ **Feature flags**: Toggle via environment variables

</details>



## Contributing

The plugin is designed to be extensible. To add new filter types:

1. Create a new component in `filters/components/`
2. Add type definitions in `filters/types/filters-type.ts`
3. Update `FilterField.tsx` to handle the new type
4. Add translations in `labels.ts`

## License

This plugin is licensed under the Apache License, Version 2.0.
