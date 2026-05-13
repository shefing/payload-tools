## [ABAC Plugin](./src/index.ts)

`@shefing/abac` adds a pluggable, Payload-native attribute-based access control layer.

### Goals

- Keep the implementation simple and Payload-first.
- Compile attributes into Payload `where` clauses whenever possible.
- Reuse JWT-enriched user data instead of introducing a parallel permission store.

### Install

`pnpm add @shefing/abac`

### Core contract

```ts
import type { AttributeProvider } from '@shefing/abac'

const tenantAttribute: AttributeProvider<string | null> = {
  key: 'tenant',
  fromUser: (user) => (typeof user.tenant === 'string' ? user.tenant : null),
  match: (userValue, docValue) => userValue != null && userValue === docValue,
  toWhere: (userValue) => ({ tenant: { equals: userValue } }),
  enrichJWT: (user) => ({ tenant: user.tenant ?? null }),
}
```

### Tenant example

```ts
import { abacPlugin } from '@shefing/abac'

plugins: [
  abacPlugin({
    attributes: [
      {
        key: 'tenant',
        fromUser: (user) => user.tenant,
        match: (userValue, docValue) => userValue === docValue,
        toWhere: (userValue) => ({ tenant: { equals: userValue } }),
        enrichJWT: (user) => ({ tenant: user.tenant }),
      },
    ],
  }),
]
```

Then opt collections in with `custom.abac`:

```ts
custom: {
  abac: {
    tenant: {
      docField: 'tenant',
    },
  },
}
```

### Geo example

`geo` is intentionally documented as an example for v1 rather than shipped as a built-in:

```ts
const geoAttribute = {
  key: 'geo',
  fromUser: (user) => user.region,
  match: (userRegion, docRegion) => userRegion === docRegion,
  toWhere: (userRegion) => ({ region: { equals: userRegion } }),
}
```

### Multi-value attributes (v0.2 — coming next)

> **Current limitation (v1):** each attribute provider resolves to a **single value** per user (e.g. `user.tenant = 'tenant-a'`). If a user belongs to multiple tenants the engine only sees the first one.

The v0.2 milestone will extend the engine and `tenantAttribute` to handle **array-valued** attributes natively:

```ts
// user.tenants = ['tenant-a', 'tenant-b']  ← multiple memberships

const multiTenantAttribute = {
  key: 'tenant',
  fromUser: (user) => Array.isArray(user.tenants) ? user.tenants : [],
  match: (userTenants, docTenant) =>
    Array.isArray(userTenants) && userTenants.includes(docTenant as string),
  // toWhere will emit { tenant: { in: ['tenant-a', 'tenant-b'] } }
  toWhere: (userTenants) => ({ tenant: { in: userTenants as string[] } }),
  enrichJWT: (user) => ({ tenants: Array.isArray(user.tenants) ? user.tenants : [] }),
}
```

This closes the main gap vs. Payload's official `plugin-multi-tenant`, which stores a `tenants[]` array per user. The same pattern applies to any set-valued attribute (multi-region, multi-clearance, etc.).

---

### Notes

- v1 keeps policy composition simple: matching providers are combined with implicit `AND`.
- Built-in `tenantAttribute()` and `roleAttribute()` are exported from the package entry.
- `roleAttribute()` is additive with `@shefing/authorization`: it preserves JWT role context and can short-circuit admins, but it does not replace RBAC collection permissions.
- See the integration coverage in `test-app/tests/e2e-plugins/abac.spec.ts` once the feature is fully wired.

---

### Roadmap

| Version | Item | Status |
|---------|------|--------|
| v1 | Single-value attribute providers (`tenant`, `role`, custom) | ✅ Shipped |
| v1 | JWT enrichment — zero extra DB queries per request | ✅ Shipped |
| v1 | `GET /api/me/permissions` endpoint | ✅ Shipped |
| v1 | `abacFilterOptions` relationship field helper | ✅ Shipped |
| v1 | Fail-closed safety + startup config validation | ✅ Shipped |
| **v0.2** | **Multi-value attribute support** (`tenants[]`, `{ in: [...] }` WHERE, array `match`) | 🔜 Next |
| v0.2 | `readVersions` / `unlock` action guards | 🔜 Next |
| v0.2 | `pluginContext` singleton → closure (test isolation) | 🔜 Next |
| v0.3 | Optional admin UI: tenant switcher component | 💡 Planned |
| v0.3 | `isGlobal` collection mode (per-tenant globals) | 💡 Planned |
| v0.3 | Per-tenant roles (`tenantRoleAttribute`) | 💡 Planned |
| v0.3 | i18n support | 💡 Planned |