## [Custom Version View plugin](./src/index.ts)

This plugin adds some fields to the version view :

Updated At -using relative date
Updated by

https://github.com/user-attachments/assets/f3e79c7d-277c-4ec6-b5b9-c91b0e104286

### Setup

Install the plugin using your node package manager, e.g:

`pnpm add @shefing/custom-version-view`

In the payload.config.ts add the following:

```typescript
plugins: [
    ...plugins,
    versionsPlugin({
      excludedCollections: [] //array of collections names to exclude
      excludeGlobals:[] //array of globals names to exclude
    })
```
The updated by field in versions relies on the authors-info package.

### Collection Configuration

Add the following configuration to enable versions for a collection:

```javascript
versions: {
    drafts: true,
  }
```

