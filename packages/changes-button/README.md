# @shefing/changes-button

A Payload CMS plugin that adds a **Changes** button to drafts-enabled documents. Clicking it opens a slide-in drawer that shows a field-by-field diff between the current document state (or the latest draft) and the currently published version — using the same diff UI as the built-in Versions view.

## Features

- Auto-injects into every drafts-enabled collection / global (no manual component wiring).
- Visibility is fully driven by document state: the button only shows when there are unpublished changes AND the user has publish permission.
- Toggle inside the drawer to switch between *Unsaved* (live form values) and *Latest draft* (saved draft) when both exist.
- Self-contained — the diff renderer is vendored from Payload's Versions view, so the plugin works against any `payload` / `@payloadcms/next` release without waiting for new exports to land upstream.
- All UI strings live in `src/labels.ts` (en/ar/es/fr/he/zh) and are picked up via `useTranslation().i18n.language`.

## Status

Two upstream Payload PRs would let the plugin install with a single line and zero layout edits, but they have not been merged yet:

| Feature | Issue | PR |
| --- | --- | --- |
| `@payloadcms/next/views/diff` subpath export | [#16496](https://github.com/payloadcms/payload/issues/16496) | [#16498](https://github.com/payloadcms/payload/pull/16498) |
| `config.admin.serverFunctions` registry | [#16497](https://github.com/payloadcms/payload/issues/16497) | [#16499](https://github.com/payloadcms/payload/pull/16499) |

Until they ship, this package vendors the diff pipeline from `@payloadcms/next/src/views/Version/RenderFieldsToDiff/` (see `src/vendor/diff/`) and requires a small `(payload)/layout.tsx` change to register the server function. Once both PRs land, the vendor copy can be deleted and the layout edit removed.

## Install

```sh
pnpm add @shefing/changes-button
```

## Usage

### 1. Register the plugin in `payload.config.ts`

```ts
import { buildConfig } from 'payload'
import { changesButtonPlugin } from '@shefing/changes-button'

export default buildConfig({
  // ...
  plugins: [
    changesButtonPlugin({
      // optional — exclude collections / globals from receiving the button
      excludedCollections: ['users'],
      excludedGlobals: [],
    }),
  ],
})
```

### 2. Wrap `handleServerFunctions` in `app/(payload)/layout.tsx`

The plugin needs a server function (`shefing/changes-button:render-diff`) registered alongside Payload's built-in ones. Until upstream PR #16499 lands, this is done by wrapping the `serverFunction` you pass to `<RootLayout />`:

```ts
// app/(payload)/layout.tsx
import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import { wrapServerFunctions } from '@shefing/changes-button/server'
import config from '@payload-config'
import { importMap } from './admin/importMap.js'

const baseServerFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

const serverFunction = wrapServerFunctions(baseServerFunction)

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}
```

`wrapServerFunctions` intercepts only the `shefing/changes-button:render-diff` key and forwards every other call to the base handler unchanged.

## Configuration

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `excludedCollections` | `string[]` | `[]` | Slugs of collections that should NOT receive the Changes button. |
| `excludedGlobals` | `string[]` | `[]` | Slugs of globals that should NOT receive the Changes button. |
| `disabled` | `boolean` | `false` | Disable the plugin entirely without removing it from `plugins`. |

## When the button appears

The button is rendered only when **all** of the following are true for the open document:

- The entity has drafts enabled (`versions.drafts` is configured).
- The current user has publish permission.
- The document is not in trash.
- There are unpublished changes — either the form is `modified` or `unpublishedVersionCount > 0`.

For brand-new entities (no published baseline) the diff renders against an empty baseline so every populated field shows as an addition.

## Localization

All user-facing strings are declared in [`src/labels.ts`](./src/labels.ts) and consumed via the `getLabel(key, locale)` helper. The active locale is read from `useTranslation().i18n.language` so the button automatically follows the admin UI language.

Built-in locales: `en`, `ar`, `es`, `fr`, `he`, `zh`. Missing keys/locales fall back to English.

## Manual server-function wiring (advanced)

If you don't want to use `wrapServerFunctions`, register the handler explicitly in your `serverFunctions` map:

```ts
import { renderChangesDiffHandler, SERVER_FUNCTION_KEY } from '@shefing/changes-button/server'

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
    serverFunctions: { [SERVER_FUNCTION_KEY]: renderChangesDiffHandler },
  })
}
```

## Local development

The vendored diff pipeline lives in `src/vendor/diff/` — a snapshot of `@payloadcms/next/src/views/Version/RenderFieldsToDiff/` (minus `*.spec.ts`). When upstream PR #16498 ships in a release:

1. Replace the vendor imports in `src/server/renderChangesDiff.tsx` with `import { countChangedFields, RenderDiff } from '@payloadcms/next/views/diff'`.
2. Delete `src/vendor/diff/` and the copied `SelectedLocalesContext.tsx`.
3. Bump the `@payloadcms/next` `peerDependency` to the release that exposes the subpath.

When PR #16499 ships, additionally:

1. Re-add `config.admin.serverFunctions` self-registration in `ChangesButtonPlugin.ts` (see git history).
2. Drop the `wrapServerFunctions` step from this README — the plugin will be a single-line install again.

## License

MIT — © shefing
