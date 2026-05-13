# ABAC Plugin — Full Explanation for Junior Developers

> **What is ABAC?**
> ABAC stands for **Attribute-Based Access Control**. Instead of just asking "what *role* does this user have?", it asks "what *attributes* does this user have, and do they match the document they're trying to access?"
>
> A classic example: a user belongs to **Tenant A**. With ABAC, they can only see, edit, and create documents that also belong to **Tenant A** — automatically, across every opted-in collection, without you writing a single custom `access` function.

---

## Table of Contents

1. [The Big Picture — How It All Fits Together](#1-the-big-picture)
2. [The Contract — `types.ts`](#2-the-contract--typests)
3. [The Engine — `compile.ts` and `enrichJWT.ts`](#3-the-engine)
4. [Built-in Providers — `tenant.ts` and `role.ts`](#4-built-in-providers)
5. [Plugin Wiring — `index.ts`](#5-plugin-wiring--indexts)
6. [The Permissions Endpoint — `mePermissions.ts`](#6-the-permissions-endpoint)
7. [The Filter Helper — `filterOptions.ts`](#7-the-filter-helper)
8. [The Provider Registry — `pluginContext.ts`](#8-the-provider-registry)
9. [How to Use the Plugin (Developer Guide)](#9-how-to-use-the-plugin-developer-guide)
10. [What the End User Experiences](#10-what-the-end-user-experiences)
11. [Edge Cases and Safety Nets](#11-edge-cases-and-safety-nets)
12. [File Map at a Glance](#12-file-map-at-a-glance)

---

## 1. The Big Picture

Imagine your Payload CMS app has **articles** that belong to different tenants (companies). You want:

- Alice (Tenant A) → can only see/edit/create Tenant A articles
- Bob (Tenant B) → can only see/edit/create Tenant B articles
- Admin → can see everything

Without this plugin, you'd write a custom `access.read` function on the `articles` collection, then repeat it for `access.update`, `access.delete`, and `access.create`. Then do the same for every other collection. That's a lot of copy-paste.

**With `@shefing/abac`**, you:
1. Register a `tenantAttribute` provider once.
2. Opt each collection in with one line of config.
3. The plugin automatically enforces access everywhere.

Here's the flow when Alice requests `GET /api/articles`:

```
Alice's request
    │
    ▼
Payload calls access.read()
    │
    ▼
abacPlugin intercepts → asks: "what is Alice's tenant?" → "tenant-a"
    │
    ▼
Engine builds a WHERE clause: { tenant: { equals: "tenant-a" } }
    │
    ▼
Database query runs with that filter → only Tenant A articles come back
    │
    ▼
Alice sees only her articles ✓
```

---

## 2. The Contract — `types.ts`

This file defines the **shapes** (TypeScript types) that everything else in the plugin uses. Think of it as the rulebook.

### `AttributeProvider<UserValue, DocumentValue>`

This is the **most important type** in the whole package. It is the interface every provider must implement.

```ts
export type AttributeProvider<UserValue = unknown, DocumentValue = unknown> = {
  key: string
  fromUser(user, req): UserValue | Promise<UserValue>
  fromDoc?: { [collectionSlug]: (doc) => DocumentValue }
  match(userValue, docValue): boolean | Promise<boolean>
  toWhere?(userValue): Where
  enrichJWT?(user): Record<string, unknown> | Promise<Record<string, unknown>>
}
```

| Field | What it does | Required? |
|---|---|---|
| `key` | A unique name for this provider, e.g. `"tenant"` | ✅ Yes |
| `fromUser` | Reads the relevant attribute off the logged-in user, e.g. `user.tenant` | ✅ Yes |
| `fromDoc` | Reads the relevant attribute off a document (per collection). Falls back to `docField` path if omitted. | ❌ Optional |
| `match` | Returns `true` if the user's value matches the document's value. Used for `create` checks. | ✅ Yes |
| `toWhere` | Converts the user's value into a Payload `where` filter for DB-level filtering. Used for `read/update/delete`. | ❌ Optional (but recommended) |
| `enrichJWT` | Adds extra data to the user's JWT token at login time, so it's available on every request without a DB call. | ❌ Optional |

### `AbacCollectionConfig`

This is what you put in a collection's `custom.abac` field to opt it in:

```ts
// Example: opt the "articles" collection into tenant-based access
custom: {
  abac: {
    tenant: {           // ← must match a registered provider's key
      docField: 'tenant', // ← the field on the article document
      stampOnCreate: true, // ← auto-fill tenant on new docs (default: true)
      actions: ['read', 'update', 'delete', 'create'], // ← which actions to guard
    }
  }
}
```

### `AbacPluginConfig`

What you pass to `abacPlugin(...)`:

```ts
export type AbacPluginConfig = {
  attributes: AttributeProvider[]      // list of providers to register
  excludedCollections?: CollectionSlug[] // collections to skip entirely
  includedCollections?: CollectionSlug[] // if set, only these are considered
  policies?: unknown                   // reserved for future use, ignored in v1
}
```

### `AbacPermissionsResponse`

The shape returned by `GET /api/me/permissions?collection=articles`:

```ts
{
  collection: 'articles',
  where: { tenant: { equals: 'tenant-a' } }, // or null if no constraints
  actions: ['read', 'update', 'delete', 'create']
}
```

---

## 3. The Engine

The engine is the **brain** of the plugin. It is made of pure functions — no Payload imports, no side effects — which makes it easy to unit-test.

### `compile.ts` — Building WHERE clauses and create decisions

#### Helper: `hasValue(value)`

```ts
const hasValue = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.length > 0
  return value !== null && value !== undefined
}
```

Simple utility: returns `false` for `null`, `undefined`, and empty arrays. Used to detect "this user has no attribute value" → deny access.

#### Helper: `normalizeValue(value)`

Payload relationship fields can be either a raw ID (`"abc123"`) or a full object (`{ id: "abc123", name: "Tenant A" }`). This function always extracts just the ID so comparisons work correctly regardless of how Payload populated the field.

#### Helper: `getValueAtPath(doc, path)`

Reads a nested value from a document using a dot-notation path. For example, `getValueAtPath(doc, 'meta.tenant')` reads `doc.meta.tenant`.

#### `EMPTY_RESULTS_WHERE`

```ts
const EMPTY_RESULTS_WHERE: Where = { id: { exists: false } }
```

A special WHERE clause that matches **no documents**. Used when a user has no attribute value — instead of returning all docs (dangerous!), the engine returns this filter so the DB returns an empty list.

#### `compileWhere(providers, user, action, req)` → `Where | true | false`

This is the core function for **read, update, and delete** access. It:

1. Returns `false` immediately if there is no logged-in user.
2. Returns `true` immediately if the user is an admin (`user.isAdmin === true`) — admins bypass all ABAC.
3. Loops through every registered provider for this collection:
   - Skips providers that don't apply to this action.
   - Calls `provider.fromUser(user)` to get the user's attribute value.
   - If the user has **no value** → returns `EMPTY_RESULTS_WHERE` (empty list, not all docs).
   - If the provider has `toWhere` → collects the resulting WHERE clause.
4. Merges all WHERE clauses with `{ and: [...] }`.
5. Returns `true` if no providers produced a WHERE (no constraints needed).

**Example result for Alice with tenant-a:**
```ts
// Single provider → returns the where directly
{ tenant: { equals: 'tenant-a' } }

// Two providers (tenant + clearance) → AND-merged
{ and: [
  { tenant: { equals: 'tenant-a' } },
  { clearanceLevel: { less_than_equal: 3 } }
]}
```

#### `decideCreate(providers, user, data, req)` → `boolean`

Used for **create** access. Instead of building a WHERE clause (there's no existing document to filter), it checks whether the data the user is trying to save matches their attributes:

1. Returns `false` if no user.
2. Returns `true` if admin.
3. For each provider:
   - Gets the user's attribute value.
   - Gets the document's attribute value from the submitted `data`.
   - Calls `provider.match(userValue, docValue)`.
   - If `match` returns `false` → deny the create.
4. Returns `true` only if **all** providers approve.

**Example:** Alice (tenant-a) tries to create an article with `tenant: "tenant-b"` → `match("tenant-a", "tenant-b")` returns `false` → create is rejected.

#### Fail-closed safety

```ts
} catch (error) {
  return warnAndReturn(error, false)
}
```

If any provider throws an error, the engine **denies access** and logs a warning. It never accidentally grants access due to a bug.

---

### `enrichJWT.ts` — Caching attributes in the JWT

```ts
export const enrichJWT = async (providers, user) => {
  const enrichedPayload = {}
  for (const provider of providers) {
    if (!provider.enrichJWT) continue
    const nextPayload = await provider.enrichJWT(user)
    for (const [key, value] of Object.entries(nextPayload)) {
      if (key in enrichedPayload) {
        console.warn(`[abac] enrichJWT key collision for "${key}", last value wins`)
      }
      enrichedPayload[key] = value
    }
  }
  return enrichedPayload
}
```

**Why does this exist?** Every time a user makes a request, the plugin needs to know their attributes (e.g. their tenant). Without this, it would need a DB query on every single request. Instead, at **login time**, this function runs all providers' `enrichJWT` methods and merges the results into the JWT token. From then on, `req.user.tenant` is available instantly from the token — zero extra DB queries.

**Key collision warning:** If two providers try to write the same key (e.g. both write `tenant`), the last one wins and a warning is logged in development.

---

## 4. Built-in Providers

### `tenant.ts` — The Tenant Provider

```ts
export const tenantAttribute = ({
  userField = 'tenant',
  docField = 'tenant',
  jwtKey = userField,
} = {}): AttributeProvider => ({
  key: 'tenant',
  fromUser: async (user) => normalizeRelationshipValue(getValueAtPath(user, userField) ?? null),
  match: (userValue, docValue) => userValue != null && userValue === docValue,
  toWhere: (userValue) => ({ [docField]: { equals: userValue } }),
  enrichJWT: async (user) => ({ [jwtKey]: normalizeRelationshipValue(getValueAtPath(user, userField) ?? null) }),
})
```

This is the most commonly used built-in. It:

- **`fromUser`**: reads `user.tenant` (or whatever `userField` you configure) and normalizes it to a plain ID.
- **`match`**: checks if the user's tenant ID equals the document's tenant ID. Simple equality check.
- **`toWhere`**: produces `{ tenant: { equals: "tenant-a" } }` — a Payload WHERE clause that the DB uses to filter.
- **`enrichJWT`**: at login, copies the user's tenant ID into the JWT so it's available on every request.

**Configuration options:**
| Option | Default | Meaning |
|---|---|---|
| `userField` | `'tenant'` | Path on the user object to read the tenant from |
| `docField` | `'tenant'` | Field on the document to filter/compare against |
| `jwtKey` | same as `userField` | Key to use when writing to the JWT |

---

### `role.ts` — The Role Bridge Provider

```ts
export const roleAttribute = (): AttributeProvider<RoleValue, unknown> => ({
  key: 'role',
  fromUser: async (user) => ({
    isAdmin: Boolean(user.isAdmin),
    roleIds: getRoleIds(user),
  }),
  match: (userValue) => {
    if (userValue.isAdmin) return true
    return userValue.roleIds.length > 0
  },
  enrichJWT: async (user) => ({
    userRoles: Array.isArray(user.userRoles) ? user.userRoles : [],
    isAdmin: Boolean(user.isAdmin),
  }),
})
```

This provider bridges ABAC with the existing `@shefing/authorization` RBAC plugin. It:

- **`fromUser`**: reads `user.isAdmin` and `user.userRoles` (the role IDs from the RBAC plugin).
- **`match`**: allows access if the user is an admin OR has at least one role. It does **not** do row-level filtering (no `toWhere`) — RBAC is a yes/no gate, not a row filter.
- **`enrichJWT`**: ensures `userRoles` and `isAdmin` are always present in the JWT.

> **Note for developers:** `roleAttribute` has no `toWhere`. This means it only participates in `create` decisions (via `match`), not in WHERE-clause filtering. If you use only `roleAttribute`, all rows pass the WHERE filter — the role check is a boolean gate on top.

---

## 5. Plugin Wiring — `index.ts`

This is the **entry point** of the plugin. It's a function that takes your config and returns a function that transforms Payload's config. This is the standard Payload plugin pattern.

```ts
export const abacPlugin = (pluginConfig: AbacPluginConfig) => (incomingConfig: Config): Config => {
  // ...
}
```

### Step 1: Register providers

```ts
registerProviders(pluginConfig.attributes)
const providersByKey = new Map(pluginConfig.attributes.map((p) => [p.key, p]))
```

Stores all providers in a global registry (for use by `abacFilterOptions`) and in a local Map for fast lookup by key.

### Step 2: Process each collection

For each collection in Payload's config:

1. **Skip** if the collection is excluded or not included per `includedCollections`/`excludedCollections`.
2. **Skip** if the collection has no `custom.abac` config.
3. **Validate** that every key in `custom.abac` matches a registered provider — throws a clear error at startup if not.
4. **Build `resolvedProviders`**: pairs each provider with its per-collection config (docField, actions, stampOnCreate).

### Step 3: Compose access functions

```ts
nextCollection.access = {
  read:   composeAccess(previousAccess.read,   async (req) => compileWhere(resolvedProviders, req.user, 'read',   req)),
  update: composeAccess(previousAccess.update, async (req) => compileWhere(resolvedProviders, req.user, 'update', req)),
  delete: composeAccess(previousAccess.delete, async (req) => compileWhere(resolvedProviders, req.user, 'delete', req)),
  create: composeAccess(previousAccess.create, async (req, data) => (await decideCreate(...)) ? true : false),
}
```

`composeAccess` is the key function here. It **wraps** the existing access function (if any) rather than replacing it:

```ts
const composeAccess = (previousAccess, computeAccess) => async ({ data, req }) => {
  const previousResult = previousAccess ? await previousAccess({ data, req }) : true
  const nextResult = await computeAccess(req, data)
  return andAccessResults(previousResult, nextResult)
}
```

`andAccessResults` combines two access results with AND logic:
- If either is `false` → `false` (deny wins)
- If left is `true` → use right (no constraint from left)
- If right is `true` → use left
- If both are WHERE objects → `{ and: [left, right] }`

This means **ABAC never overrides existing access rules — it only narrows them further**.

### Step 4: Add `beforeChange` hook (auto-stamp)

```ts
const beforeChange = async ({ data, operation, req }) => {
  if (operation !== 'create' || !req.user) return data
  // For each provider, if the doc field is empty, fill it from the user's attribute
  for (const resolvedProvider of resolvedProviders) {
    if (resolvedProvider.config.stampOnCreate === false) continue
    const existingValue = getPathValue(nextData, resolvedProvider.config.docField)
    if (hasValue(existingValue)) continue
    const userValue = await resolvedProvider.provider.fromUser(req.user, req)
    if (hasValue(userValue)) setPathValue(nextData, resolvedProvider.config.docField, userValue)
  }
  return nextData
}
```

When Alice creates a new article and doesn't specify a tenant, this hook automatically sets `article.tenant = alice.tenant`. This prevents Alice from accidentally creating untagged documents.

### Step 5: Add `afterLogin` hook (JWT enrichment)

```ts
if (nextCollection.auth) {
  const afterLogin = async ({ req, user }) => {
    req.user = { ...req.user, ...user, ...(await enrichJWT(pluginConfig.attributes, user)) }
  }
  nextCollection.hooks.afterLogin = [afterLogin, ...]
}
```

Only runs on collections that have `auth: true` (i.e. the Users collection). After a successful login, it merges all providers' `enrichJWT` output into `req.user`, which Payload then encodes into the JWT token.

### Step 6: Register the `/api/me/permissions` endpoint

```ts
const endpoint = createMePermissionsEndpoint({
  getProvidersForCollection: (slug) => collectionProviderMap.get(slug)?.providers ?? [],
  isCollectionEnabled: (slug) => collectionProviderMap.has(slug),
})
```

Adds a single root-level endpoint that any client can call to discover what access the current user has.

---

## 6. The Permissions Endpoint

**File:** `src/endpoints/mePermissions.ts`

**URL:** `GET /api/me/permissions?collection=articles`

**What it does:** Returns the compiled WHERE clause and allowed actions for the current user on a given collection. Useful for frontend apps that need to mirror server-side access rules (e.g. pre-filtering a dropdown).

```ts
// Example response for Alice (tenant-a):
{
  "collection": "articles",
  "where": { "tenant": { "equals": "tenant-a" } },
  "actions": ["read", "update", "delete", "create"]
}

// Example response for an unauthenticated user:
// HTTP 403 { "message": "Unauthorized" }

// Example response for a collection not opted into ABAC:
// HTTP 404 { "message": "Collection \"users\" is not ABAC-enabled" }
```

**How it works internally:**
1. Checks the user is logged in (403 if not).
2. Reads the `?collection=` query parameter (400 if missing).
3. Checks the collection is ABAC-enabled (404 if not).
4. Runs `compileWhere` for all four actions (`read`, `create`, `update`, `delete`).
5. The `where` in the response is the result for `read` (converted to `null` if it's `true` or `false`).
6. The `actions` list contains every action that didn't return `false`.

---

## 7. The Filter Helper

**File:** `src/helpers/filterOptions.ts`

**What it does:** Pre-filters relationship dropdowns in the Payload admin UI so users only see options they're allowed to pick.

**Usage in a collection field:**
```ts
{
  name: 'tenant',
  type: 'relationship',
  relationTo: 'tenants',
  filterOptions: abacFilterOptions('tenant'), // ← one line!
}
```

**How it works:**
```ts
export const abacFilterOptions = (key: string) => {
  return async ({ req }) => {
    const provider = getRegisteredProvider(key)
    if (!provider || !provider.toWhere || !req.user) return true
    const userValue = await provider.fromUser(req.user, req)
    if (!hasValue(userValue)) return false
    return provider.toWhere(userValue)
  }
}
```

- Looks up the provider by key from the global registry.
- If the provider has no `toWhere` or the user has no value → returns `true` (no filter) or `false` (no options).
- Otherwise returns the WHERE clause so the dropdown only shows matching options.

**Result:** When Alice opens the "Tenant" dropdown while creating an article, she only sees "Tenant A" — not all tenants.

---

## 8. The Provider Registry

**File:** `src/pluginContext.ts`

```ts
const providerRegistry = new Map<string, AttributeProvider>()

export const registerProviders = (providers: AttributeProvider[]): void => {
  providerRegistry.clear()
  for (const provider of providers) {
    providerRegistry.set(provider.key, provider)
  }
}

export const getRegisteredProvider = (key: string): AttributeProvider | undefined => {
  return providerRegistry.get(key)
}
```

A simple module-level Map that acts as a global registry. It's populated once when `abacPlugin` runs (at Payload startup). The `abacFilterOptions` helper uses `getRegisteredProvider` to look up providers without needing them passed as arguments.

> **Why a global registry?** Payload's `filterOptions` function only receives `{ req }` — there's no way to pass extra context. The registry solves this by making providers accessible globally within the process.

---

## 9. How to Use the Plugin (Developer Guide)

### Installation

```bash
pnpm add @shefing/abac
```

### Step 1: Register the plugin in `payload.config.ts`

```ts
import { abacPlugin, tenantAttribute, roleAttribute } from '@shefing/abac'

export default buildConfig({
  plugins: [
    abacPlugin({
      attributes: [
        tenantAttribute(),  // built-in: tenant-based row filtering
        roleAttribute(),    // built-in: bridges with @shefing/authorization
      ],
      // Optional: skip these collections entirely
      excludedCollections: ['media'],
    }),
  ],
  // ...
})
```

### Step 2: Add a `tenant` field to your Users collection

```ts
{
  name: 'tenant',
  type: 'relationship',
  relationTo: 'tenants',
  saveToJWT: true, // ← IMPORTANT: makes it available on req.user without a DB call
}
```

### Step 3: Opt a collection into ABAC

```ts
{
  slug: 'articles',
  custom: {
    abac: {
      tenant: {              // ← must match a registered provider's key
        docField: 'tenant',  // ← the field on the article document
        stampOnCreate: true, // ← auto-fill tenant when creating (default: true)
      },
    },
  },
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      filterOptions: abacFilterOptions('tenant'), // ← pre-filter the dropdown
    },
    // ... other fields
  ],
}
```

### Step 4: That's it!

Now:
- `GET /api/articles` → automatically filtered to the user's tenant
- `POST /api/articles` → rejected if the tenant doesn't match (or auto-stamped if missing)
- `PATCH /api/articles/:id` → rejected if the article belongs to a different tenant
- `DELETE /api/articles/:id` → rejected if the article belongs to a different tenant
- `GET /api/me/permissions?collection=articles` → returns the user's WHERE + allowed actions

### Writing a Custom Provider

You can write your own provider for any attribute. Here's a clearance level example:

```ts
import type { AttributeProvider } from '@shefing/abac'

export const clearanceAttribute = (): AttributeProvider<number, number> => ({
  key: 'clearance',
  fromUser: async (user) => (user.clearanceLevel as number) ?? 0,
  match: (userValue, docValue) => userValue >= docValue,
  toWhere: (userValue) => ({ clearanceLevel: { less_than_equal: userValue } }),
  enrichJWT: async (user) => ({ clearanceLevel: user.clearanceLevel ?? 0 }),
})
```

Then register it:
```ts
abacPlugin({
  attributes: [tenantAttribute(), clearanceAttribute()],
})
```

And opt a collection in:
```ts
custom: {
  abac: {
    tenant: { docField: 'tenant' },
    clearance: { docField: 'clearanceLevel', stampOnCreate: false },
  }
}
```

Both providers are AND-ed together: the user must match **both** tenant AND clearance level.

### Combining with `@shefing/authorization` (RBAC)

Both plugins compose safely. Register `addAccess` first, then `abacPlugin`:

```ts
plugins: [
  addAccess({ ... }),   // RBAC: role-based yes/no gate
  abacPlugin({ ... }),  // ABAC: narrows further with attribute filters
]
```

`composeAccess` ensures ABAC wraps whatever access function RBAC already set. If RBAC denies → denied. If RBAC allows → ABAC applies its WHERE filter on top.

---

## 10. What the End User Experiences

### Logging in

When Alice logs in via `POST /api/users/login`:
1. Payload authenticates her credentials.
2. The `afterLogin` hook runs `enrichJWT` for all providers.
3. Her JWT now contains `{ tenant: "tenant-a-id", userRoles: [...], isAdmin: false }`.
4. Every subsequent request uses this JWT — no extra DB calls needed.

### Browsing the articles list

Alice navigates to `/admin/collections/articles`:
1. The admin UI calls `GET /api/articles`.
2. Payload calls `access.read()` on the articles collection.
3. The ABAC engine reads `req.user.tenant` → `"tenant-a-id"`.
4. Engine returns `{ tenant: { equals: "tenant-a-id" } }`.
5. Payload adds this to the DB query.
6. Alice sees only Tenant A articles.

### Creating a new article

Alice clicks "Create Article":
1. The tenant dropdown shows only "Tenant A" (thanks to `abacFilterOptions`).
2. Alice submits the form.
3. The `beforeChange` hook runs: if she didn't pick a tenant, it auto-fills `tenant-a-id`.
4. `access.create()` runs `decideCreate`: checks `match("tenant-a-id", "tenant-a-id")` → `true`.
5. Article is created successfully.

### Trying to access another tenant's article

Bob tries `GET /api/articles/alice-article-id`:
1. `access.read()` returns `{ tenant: { equals: "tenant-b-id" } }`.
2. Payload queries the DB with that filter.
3. Alice's article (tenant-a) doesn't match → not found / 404.

### Frontend app checking permissions

A React frontend calls `GET /api/me/permissions?collection=articles`:
```json
{
  "collection": "articles",
  "where": { "tenant": { "equals": "tenant-a-id" } },
  "actions": ["read", "create", "update", "delete"]
}
```
The frontend can use this `where` to pre-filter its own queries and show/hide UI elements based on `actions`.

---

## 11. Edge Cases and Safety Nets

| Situation | What happens |
|---|---|
| User is not logged in | Engine returns `false` → Payload returns 403 |
| User has no tenant value | Engine returns `{ id: { exists: false } }` → empty list (not all docs!) |
| User is an admin (`isAdmin: true`) | Engine returns `true` → no filtering, sees everything |
| Provider throws an error | Engine catches it, logs a warning, **denies access** (fail-closed) |
| Provider key in `custom.abac` not registered | Plugin throws at startup with a clear error message |
| Two providers write the same JWT key | Last one wins, a warning is logged |
| Collection has no `custom.abac` | Plugin is a complete no-op for that collection |
| `stampOnCreate: false` | Auto-stamping is skipped; user must provide the field value manually |
| `toWhere` returns an `or` clause | Still safely composed under the outer `and` |

---

## 12. File Map at a Glance

```
packages/abac/src/
│
├── types.ts                  ← All TypeScript types (AttributeProvider, AbacPluginConfig, etc.)
│
├── index.ts                  ← Main plugin entry: abacPlugin() function + all exports
│
├── pluginContext.ts           ← Global provider registry (Map<key, provider>)
│
├── engine/
│   ├── compile.ts            ← compileWhere() and decideCreate() — the core logic
│   └── enrichJWT.ts          ← Merges all providers' JWT enrichments at login
│
├── providers/
│   ├── tenant.ts             ← Built-in: tenant-based row filtering
│   └── role.ts               ← Built-in: bridges with @shefing/authorization RBAC
│
├── endpoints/
│   └── mePermissions.ts      ← GET /api/me/permissions handler
│
└── helpers/
    └── filterOptions.ts      ← abacFilterOptions() for relationship field dropdowns
```

### Data flow summary

```
Login
  └─► afterLogin hook ──► enrichJWT() ──► JWT token (tenant, roles, etc.)

Every request
  └─► access.read/update/delete ──► compileWhere() ──► WHERE clause ──► DB filter
  └─► access.create ──────────────► decideCreate() ──► boolean allow/deny
  └─► beforeChange hook ──────────► auto-stamp missing fields from user attrs

Admin UI relationship dropdown
  └─► filterOptions ──► abacFilterOptions() ──► WHERE clause ──► filtered options

Frontend permission check
  └─► GET /api/me/permissions ──► compileWhere() for all actions ──► { where, actions }
```
