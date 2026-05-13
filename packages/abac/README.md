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

### Notes

- v1 keeps policy composition simple: matching providers are combined with implicit `AND`.
- Built-in `tenantAttribute()` and `roleAttribute()` are exported from the package entry.
- `roleAttribute()` is additive with `@shefing/authorization`: it preserves JWT role context and can short-circuit admins, but it does not replace RBAC collection permissions.
- See the integration coverage in `test-app/tests/e2e-plugins/abac.spec.ts` once the feature is fully wired.