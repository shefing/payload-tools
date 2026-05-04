# payload-tools — Shared Dev App

A single Next.js + Payload CMS application that exercises **all** `@shefing` plugins in one place, so you can test any plugin locally without publishing it first.

## Plugins exercised

| Plugin | Where used |
|---|---|
| `@shefing/authorization` | Wraps the entire config via `addAccess()` |
| `@shefing/authors-info` | `articles` collection fields |
| `@shefing/color-picker` | `articles` — `textColor` + `bgColor` fields |
| `@shefing/comments` | Plugin registered globally |
| `@shefing/cover-image` | Plugin registered globally |
| `@shefing/cross-collection` | Plugin registered globally |
| `@shefing/custom-version-view` | Plugin registered globally |
| `@shefing/field-type-component-override` | Plugin registered globally |
| `@shefing/icon-select` | `articles` — `icon` field |
| `@shefing/quickfilter` | Plugin registered globally |
| `@shefing/reset-list-view` | Plugin registered globally |
| `@shefing/right-panel` | Plugin registered globally |

## Getting started

### 1. Prerequisites

- Node ≥ 18 / pnpm ≥ 9
- A running MongoDB instance **or** use the default local URL (`mongodb://127.0.0.1/payload-tools-dev`)

### 2. Install dependencies (from the repo root)

```bash
pnpm install
```

### 3. Configure environment

```bash
cp test/.env.example test/.env
# Edit test/.env if you need a different DATABASE_URI or PAYLOAD_SECRET
```

### 4. Generate the Payload import map

```bash
cd test
pnpm generate:importmap
```

> This regenerates `app/(payload)/admin/importMap.js` with all plugin client components.

### 5. Start the dev server

```bash
# from repo root
pnpm --filter @shefing/dev-app dev

# or from the test/ directory
cd test
pnpm dev
```

Open [http://localhost:3000/admin](http://localhost:3000/admin).

## Workflow: testing a plugin change without publishing

1. Edit source files in `packages/<plugin>/src/`.
2. The `tsconfig.json` path aliases in `test/` point directly at each package's `src/`, so **no build step is needed** — Next.js picks up changes instantly via HMR.
3. Verify the change in the running admin UI.

## Regenerating types

```bash
cd test
pnpm generate:types
```
