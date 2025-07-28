# Reset List View Plugin for Payload CMS

A plugin for [Payload CMS](https://payloadcms.com) that adds a "Reset Preferences" button to collection list views, allowing users to reset their list view preferences to the default state.

## Features

- Adds a "Reset Preferences" button to the list view menu of collections
- Allows users to quickly reset their list view preferences (columns, filters, pagination, etc.)
- Configurable to include or exclude specific collections

## Installation

```bash
npm install @shefing/reset-list-view
# or
yarn add @shefing/reset-list-view
# or
pnpm add @shefing/reset-list-view
```

## Usage

Add the plugin to your Payload config:

```typescript
import { buildConfig } from 'payload/config'
import { CollectionResetPreferencesPlugin } from '@shefing/reset-list-view'

export default buildConfig({
  plugins: [
    CollectionResetPreferencesPlugin({
      // Plugin options here
    }),
  ],
  // Rest of your Payload config
})
```

## Configuration Options

The plugin accepts the following configuration options:

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `disabled` | `boolean` | Disable the plugin | `false` |
| `includedCollections` | `string[]` | List of collection slugs to add the reset button to. If provided, only these collections will have the reset button. | `undefined` |
| `excludedCollections` | `string[]` | List of collection slugs to exclude from having the reset button. Only used if `includedCollections` is not provided. | `undefined` |

### Examples

Add the reset button to all collections:

```typescript
CollectionResetPreferencesPlugin()
```

Add the reset button to specific collections:

```typescript
CollectionResetPreferencesPlugin({
  includedCollections: ['posts', 'categories'],
})
```

Exclude specific collections from having the reset button:

```typescript
CollectionResetPreferencesPlugin({
  excludedCollections: ['users', 'media'],
})
```

Disable the plugin:

```typescript
CollectionResetPreferencesPlugin({
  disabled: true,
})
```

## How It Works

The plugin adds a "Reset Preferences" button to the list view menu of collections. When clicked, the button makes a DELETE request to the Payload API to delete the user's preferences for that collection's list view, and then reloads the page. This resets the list view to its default state, clearing any custom column configurations, filters, pagination settings, etc.

## License

MIT