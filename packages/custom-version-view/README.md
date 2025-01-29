## [Custom Version View plugin](./src/index.ts)

This plugin adds some fields to the version view :

Updated At -using relative date
Updated by

For example:

![img.png](./images/img.png)

### Setup

Install the plugin using your node package manager, e.g:

`npm add @shefing/custom-version-view`

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

