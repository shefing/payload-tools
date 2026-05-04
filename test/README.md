# @shefing/dev-app — Shared Plugin Test App

A single Next.js + Payload CMS application that exercises **all 12 `@shefing` plugins** in one place.  
No publishing required — workspace path aliases point directly at each package's `src/`.

---

## Quick Start

```bash
# 1. Install all workspace dependencies from the repo root
pnpm install

# 2. Enter the test app
cd test

# 3. Copy env and fill in your MongoDB URI + secret
cp .env.example .env

# 4. Regenerate the Payload import map (required after any plugin change)
pnpm generate:importmap

# 5. Start the dev server
pnpm dev
```

Open **http://localhost:3000/admin** and log in with the seeded admin account:

| Field    | Value                      |
|----------|----------------------------|
| Email    | `admin@payload-tools.dev`  |
| Password | `Password1!`               |

---

## Seed Data

On first boot `onInit` runs `seed.ts` which creates:

- **Admin user** (`admin@payload-tools.dev` / `Password1!`)
- **2 Articles** — exercises `color-picker` and `icon-select` fields
- **4 Pages** (Home, About, Contact, Blog) — exercises `quickfilter`, `reset-list-view`, `right-panel`

---

## Collections & Plugins

| Collection | Plugins exercised |
|------------|-------------------|
| `articles` | `color-picker`, `icon-select`, `authors-info`, `custom-version-view`, `authorization` |
| `pages`    | `quickfilter`, `reset-list-view`, `right-panel`, `authorization` |
| `media`    | `cover-image` |
| `users`    | `authorization` |
| `roles`    | `authorization` |

Global plugins active on all collections: `comments`, `cross-collection`, `field-type-component-override`.

---

## E2E Tests (Playwright)

The `e2e/` directory contains Playwright specs that verify plugin functionality against the running dev server.

### Prerequisites

```bash
# Install Playwright browsers (one-time)
pnpm exec playwright install chromium
```

### Running tests

```bash
# Start the dev server first (in a separate terminal)
pnpm dev

# Run all E2E tests (headless)
pnpm test:e2e

# Run with browser visible
pnpm test:e2e:headed

# Interactive UI mode
pnpm test:e2e:ui
```

### Test coverage

| Spec file | What it tests |
|-----------|---------------|
| `e2e/auth.spec.ts` | Login flow, redirect for unauthenticated users, wrong-password error |
| `e2e/color-picker.spec.ts` | Color fields render, popover opens, color selection, i18n label regression (#36), create with color |
| `e2e/list-view-plugins.spec.ts` | Seeded data visible, quickfilter narrows list, reset-list-view restores state, article navigation |

---

## Developing a Plugin

1. Edit source files in `packages/<plugin>/src/` — Next.js HMR picks up changes instantly.
2. If you add a new component export, re-run `pnpm generate:importmap`.
3. Add or update the relevant `e2e/*.spec.ts` to cover the new behaviour.
