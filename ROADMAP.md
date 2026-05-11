# 🗺️ Payload Tools — Plugins Roadmap

This roadmap covers all in-scope plugins in this monorepo (everything except the 🎨 *Custom Fields* group: `color-picker`, `icon-select`). It is the canonical place for community contributors to discover work items and pick something up.

> 💬 **Want to help?** Every bullet in this roadmap is mirrored as a public GitHub issue with the **`RoadMap`** label. Filter them here: [`label:RoadMap`](https://github.com/shefing/payload-tools/labels/RoadMap). Come say hi on the [Payload Discord #plugins channel](https://discord.com/channels/967097582721572934).

## Legend

| Label | Meaning |
| --- | --- |
| **P0** | Must-have / explicitly requested. Targeted for the next release cycle. |
| **P1** | High-value enhancement. Scheduled but not blocking. |
| **P2** | Nice-to-have / long-tail polish. Community contributions especially welcome. |

## Table of Contents

- [Quick Filter](#quick-filter)
- [Right Panel](#right-panel)
- [Custom Version View](#custom-version-view)
- [Changes Button](#changes-button)
- [Comments](#comments)
- [Authorization](#authorization)
- [Authors Info](#authors-info)
- [Reset List View](#reset-list-view)
- [Cross-Collection Config](#cross-collection-config)
- [Field-type Component Override](#field-type-component-override)
- [Cover Image](#cover-image)
- [Cross-Cutting Themes](#cross-cutting-themes)
- [Delivery Waves](#delivery-waves)
- [How to contribute](#how-to-contribute)

---

## Quick Filter

See [`packages/quickfilter/README.md`](packages/quickfilter/README.md).

### Guiding principles

1. **Always align with Payload's built-in advanced filter.** Filter state must round-trip with Payload's `where` query so QuickFilter selections show up in Payload's advanced filter panel and vice-versa. Single source of truth = Payload's list controller.
2. **Match Payload's UI styling, drop the per-project Tailwind requirement.** Re-skin QuickFilter components with Payload's CSS variables / SCSS modules. If Payload 3.x style internals aren't exportable enough, ship a scoped CSS bundle as interim and target Payload 4.0 for the deep rewrite.

### P0

- **Alignment with Payload's built-in advanced filter** — read & write Payload's `where` query directly; reuse Payload's operator set and field→operator mapping; honor `admin.disableListFilter`, `access.read`, `filterOptions`; add a round-trip integration test in `test-app/`.
- **Tailwind removal / Payload-native styling** — replace Tailwind utilities under `src/filters/components/*` with Payload CSS variables + scoped class names; remove the `tailwind.config.js` setup step from the README; fall back to Payload 4.0 if Payload 3.x style exports are insufficient.
- **`defaultOpen` option** — plugin-level + per-collection override in `collection.custom.filterList.options` so the panel opens expanded on first paint.
- **Relationship filter** — dropdown backed by the related collection (REST/GraphQL), async search, `useAsTitle` rendering, `where`/`filterOptions` passthrough; emits Payload's `{ relationTo, value }` shape.
- **Nested / group / array / blocks fields** — extend the dotted-path resolver to walk `group.subField`, `array.0.subField`, and block-typed children using Payload's advanced-filter path notation.

### P1

- **Saved filter presets** — persist named combinations to user `preferences`; share-via-URL.
- **URL-as-source-of-truth** — hydrate filter state from query string (`where`) on mount; push changes back so deep-links survive refresh.
- **Number / range filter** (slider + min/max) and **text contains** filter for `text`/`textarea`/`email`, mapped to Payload's `greater_than_equal` / `less_than_equal` / `like`.
- **Conditional visibility** — `showWhen: (state) => boolean`.
- **Clear-all** + **per-row clear** buttons; visual badge with active filter count.

### P2

- **Mobile / narrow viewport layout** — auto-collapse rows to a sheet.
- Public **`useQuickFilter()` hook** for rendering filters outside the default toolbar slot.
- Post-Payload-4.0 visual refresh once the new admin design system is GA.

---

## Right Panel

See [`packages/right-panel/README.md`](packages/right-panel/README.md).

### P0

- **Bottom panel mode** — `position: 'right' | 'bottom' | 'left'` (collection-level override). Reuse the existing drawer container.
- **Enable on more views** — explicit support for `listView` and `versionsView`, not only edit view.

### P1

- **Pinned / resizable / collapsible** panel with size persisted to user preferences.
- **Multi-tab panel** — stack several related collections as tabs in one drawer.
- **Custom panel content slot** — `admin.custom.rightPanel.component` accepting a React component (useful for embedding `Changes`, `Comments`, or `Authors Info`).
- **Deep-link** — encode the open record id in the URL hash.

### P2

- Keyboard shortcuts (`⌘\` toggle, `Esc` close).
- Mobile fallback (full-screen sheet).

---

## Custom Version View

See [`packages/custom-version-view/README.md`](packages/custom-version-view/README.md).

### P0

- **Configurable list columns** — `listFields: string[]` (plugin-level default) + `collection.custom.versionListFields` (per-collection override). Resolve dotted paths the same way QuickFilter will.
- **Per-column renderers** — `{ name, label, width, Cell }` objects so users can drop in custom React cells (status pill, avatar, etc.).

### P1

- **Filtering & search** on the versions list (status, author, date range) — natural pairing with QuickFilter.
- **Compare any two versions** (currently only "vs published"); restore-with-diff confirmation.
- **Group by day / author** toggle.
- **Pagination + virtualization** for collections with thousands of versions.

### P2

- Export a single version as JSON.
- Color-coded change indicator (added / removed / changed counts) per row, reusing the `changes-button` diff pipeline.

---

## Changes Button

See [`packages/changes-button/README.md`](packages/changes-button/README.md).

### P0

- **AI-generated change summary** at the top of the drawer:
  - Pluggable `summarize` adapter (`openai`, `anthropic`, `custom`); plugin sends the structured diff + field metadata, receives a markdown summary + bullet list of risky changes.
  - Server-side via a new Payload endpoint registered by the plugin (API keys stay on the server).
  - Cached per `(docId, fromVersion, toVersion)`.
  - Toggle per collection via `admin.custom.changesButton.aiSummary`.

### P1

- **Inline approval workflow** — "Request review" button creating a `change-request` record (or hooking into `authorization` roles).
- **Comment-on-diff** — reuse the `comments` plugin's Lexical mark on changed fields.
- **Filter the diff** (only changed / added / removed; by tab/group).
- **Copy summary** / **export diff** as Markdown or PDF.

### P2

- Once upstream Payload PRs [#16498](https://github.com/payloadcms/payload/pull/16498) / [#16499](https://github.com/payloadcms/payload/pull/16499) land, drop `src/vendor/diff` and the `(payload)/layout.tsx` edit; update install docs to one-liner.
- Granular i18n for AI summaries (locale passed to adapter).

---

## Comments

See [`packages/comments/README.md`](packages/comments/README.md).

### P0

- **Mentions** (`@user`) resolving from the Users collection + Payload notification / email.
- **Resolve / reopen** state on threads (not just delete), with a "Show resolved" filter.
- **Document-level comments** (not tied to a Lexical mark) for `text` / `number` / `select` fields.

### P1

- **Reactions** (👍 ❤️ 👀) on a comment.
- **Email / webhook digest** of unresolved threads per document.
- **Permission integration** with the `authorization` plugin (`comment-read` / `comment-write`).
- **Markdown + attachments** in comment body.

### P2

- Real-time presence indicators ("Alice is viewing") via SSE/WebSocket.
- Export thread to PDF for audit.

---

## Authorization

See [`packages/authorization/README.md`](packages/authorization/README.md).

### P0

- **Deny-list mode** for field permissions (today only allow-list). Many teams want "all fields except `internalNotes`".
- **Row-level / `where`-based permissions** — permission entries carry a `where` clause merged into Payload's access functions.
- **Role inheritance** — `extends: ['editor']`.

### P1

- **Per-locale permissions** for localized collections.
- **Time-boxed permissions** (`validFrom` / `validUntil`).
- **Audit log** of role/permission changes — surfaces nicely alongside `authors-info`.
- **Admin UI matrix view** — collections × roles × permissions, batch-edit.

### P2

- Import/export roles as JSON for environment promotion.
- CLI helper: `pnpm shefing-auth check <user> <collection>`.

---

## Authors Info

See [`packages/authors-info/README.md`](packages/authors-info/README.md).

### P0

- **Activity timeline** tab reusing `custom-version-view` data (created → edited → published → reverted).
- **Configurable display fields** — choose which author attributes show in the tab and list columns.
- **Surface in list views** — opt-in column adapter for `Updated By` / `Published By` in any collection list.

### P1

- **Editor presence** ("currently being edited by …") with stale-lock cleanup.
- **Email author on publish** hook (configurable template).

### P2

- CSV / JSON export of activity for compliance.

---

## Reset List View

See [`packages/reset-list-view/README.md`](packages/reset-list-view/README.md).

### P0

- **Granular reset menu** — split into `Reset columns`, `Reset filters`, `Reset sort`, `Reset page size`, `Reset all`.
- **Per-user default preset** — admin can save a view and force it as the default for everyone.

### P1

- **Named saved views** per user with a quick switcher — pairs with QuickFilter saved presets.
- **Auto-reset on logout** option for shared workstations.

### P2

- Admin button to bulk-reset preferences for all users (e.g., after a schema change).

---

## Cross-Collection Config

See [`packages/cross-collection/README.md`](packages/cross-collection/README.md).

### P0

- **Type-safe override keys** — TS union for the supported `admin.components.views.*` paths.
- **Conditional overrides** — apply only when `(collection, user, locale) => boolean` returns true.
- **Merge instead of replace** mode for nested admin components.

### P1

- Override `admin.components.beforeList` / `afterList` / `beforeFields` / `afterFields` across many collections.
- Per-collection allow-list (inverse of `excludedCollections`).

---

## Field-type Component Override

See [`packages/field-type-components-override/README.md`](packages/field-type-components-override/README.md).

### P0

- **Predicate matcher** — `match: (field, ctx) => boolean` supporting name/regex/`admin.condition` matching.
- **Override ordering & merge** — deterministic precedence; deep-merge `admin.components` instead of replace.
- **Scope to collections / globals** — `includedCollections` / `excludedCollections`.

### P1

- Built-in override presets bundle (date pickers, slugify-on-blur, masked inputs) as opt-in helpers.
- Dev-time logger printing which override hit which field on boot.

### P2

- Storybook-style playground page (`/admin/_internal/field-overrides`) listing every override + live preview.

---

## Cover Image

See [`packages/cover-image/README.md`](packages/cover-image/README.md).

### P0

- **Cross-platform support** — detect ffmpeg from `process.env.FFMPEG_PATH` first, fall back to `ffmpeg-static`; document macOS/Windows/Docker setup.
- **Multiple frames / sprite sheet** — `frames: number | number[]` for hover previews & chapter thumbnails.
- **Async / background generation** via a Payload job/queue.

### P1

- Auto-poster + GIF preview outputs.
- Image processing options (target size, quality, blur, watermark overlay).
- **Regenerate** action available on each video document.

### P2

- Pluggable extractor (`extractor: 'ffmpeg' | 'cloudinary' | custom`).
- Deprecation guide once Payload's native video cover covers all use-cases.

---

## Cross-Cutting Themes

Shared improvements that benefit every plugin:

- **Unified options shape** — extend every plugin's `excludedCollections` / `excludedGlobals` with `includedCollections` and `predicate: (collection) => boolean` for parity.
- **Per-collection opt-in via `admin.custom.<pluginKey>`** documented in one place.
- **Centralized i18n** — lift per-plugin `labels.ts` (en/ar/es/fr/he/zh) into a shared `@shefing/i18n` package.
- **Shared design tokens** — extract Tailwind/CSS variables used across plugins into a shared `@shefing/ui` package; reduce style drift and remove the per-plugin Tailwind config requirement.
- **Telemetry / debug flag** — `process.env.SHEFING_DEBUG=1` toggles structured boot logs in every plugin.
- **Test harness** — only `changes-button` and `custom-version-view` ship tests today; reuse `test-app/` + `vitest.config.mts` to add smoke tests for every plugin.
- **Docs alignment** — every plugin's README exposes the same sections (Install / Setup / Options / Collection Configuration / Roadmap).

---

## Delivery Waves

### Wave 1 — User-requested P0

- QuickFilter: align with Payload's built-in advanced filter, Tailwind-removal / Payload-styles, `defaultOpen`, relationship filter, nested fields.
- Right Panel: bottom position, enable on list/versions views.
- Custom Version View: configurable list columns + custom cell renderers.
- Changes Button: AI summary adapter.

### Wave 2 — High-value P0

- Authorization: deny-list & row-level (`where`) permissions, role inheritance.
- Comments: mentions, resolve state, document-level comments.
- Reset List View: granular reset menu + admin-saved default view.
- Cross-Collection / Field Override: predicate matching + deterministic ordering.
- Cover Image: cross-platform ffmpeg + async generation.

### Wave 3 — P1 enhancements

- QuickFilter saved presets + URL sync; Right Panel multi-tab + custom content slot.
- Authors Info activity timeline; Custom Version View filtering & compare-any-two.
- Shared i18n / UI packages, debug flag, broader test coverage.

### Wave 4 — P2 / nice-to-have

- Mobile layouts, keyboard shortcuts, exports (CSV / PDF), Storybook-style playgrounds.
- Drop `changes-button` vendor diff once upstream Payload PRs [#16498](https://github.com/payloadcms/payload/pull/16498) + [#16499](https://github.com/payloadcms/payload/pull/16499) ship.

---

## How to contribute

We track every roadmap bullet as a public GitHub issue so anyone can pick one up.

1. Browse the open list: [`label:RoadMap`](https://github.com/shefing/payload-tools/labels/RoadMap). Filter further by `plugin:<name>` or `priority:P0|P1|P2`.
2. **Claim an item** by commenting on the issue (e.g. *"I'd like to work on this"*). A maintainer will assign it to you to avoid duplicate work.
3. **Open a PR** referencing the issue (`Closes #<n>`). Match the existing code style of the plugin and add/update tests under `test-app/` where applicable.
4. **Discuss design questions** on the issue or in the [Payload Discord #plugins channel](https://discord.com/channels/967097582721572934) before doing large rewrites.

Each `RoadMap` issue follows a short template:

> **Problem** — what's missing / painful today.
> **Proposed solution** — the shape of the API or UI change.
> **Acceptance criteria** — how we'll know it's done.
> **How to claim** — comment on the issue to be assigned.

Thanks for helping make Payload's plugin ecosystem better! 💜
