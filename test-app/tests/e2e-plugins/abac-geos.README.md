# ABAC – geos e2e tests onboarding

This document explains the geo-scoped ABAC test setup used by
`abac-geos.spec.ts`, what changed compared to the previous version, and how to
run / extend it.

## What the scenario covers

The `posts` collection demonstrates the ABAC + RBAC split for a multi-geo
deployment:

| Role     | Read           | Update                                  | `posts.geo` dropdown options       |
|----------|----------------|-----------------------------------------|------------------------------------|
| Admin    | all geos       | all geos (isAdmin bypass)               | all geos                           |
| Ranger-A | all geos       | only posts where `geo ∈ user.geos`      | only `user.geos` (filterOptions)   |
| Ranger-B | all geos       | only posts where `geo ∈ user.geos`      | only `user.geos` (filterOptions)   |
| Viewer   | all geos       | denied by RBAC (no ABAC reached)        | none (no write anyway)             |

Two layers cooperate:

1. **RBAC (`@shefing/authorization`)** decides *which actions* a role may
   perform on `posts` (`read`, `update`, ...).
2. **ABAC (`@shefing/abac`)** decides *which documents* those actions apply
   to, via `custom.abac.geo = { docField: 'geo', actions: ['update', 'create', 'delete'] }`
   on the `posts` collection. `read` is intentionally **not** geo-scoped.

## Why the geo field is filtered (not locked)

Previously the test expected the foreign-geo update to fail at *save time* with
a 403/404. While correct, the admin UX was confusing: rangers saw an editable
`geo` dropdown on every post (including foreign ones) and only found out the
operation was blocked when they tried to save.

The current behaviour keeps the field editable but **constrains its options**:

- The `geo` field on `posts` uses `filterOptions` to scope the relationship
  dropdown to the geos the current user belongs to:
  - Admins (`isAdmin === true`) see **all** geos.
  - Rangers see only the geos in `user.geos`.
  - Users without geos see no options at all.
- The field is **defaulted to the user's first geo** on create
  (`defaultValue: ({ user }) => user.geos[0]`), so rangers don't have to choose.
- Foreign-geo posts still appear in the list view (read is unrestricted), but
  document-level ABAC `where` excludes them from the writable set, so any
  attempt to PATCH them is rejected with 403/404.

Net result: rangers cannot pick a foreign geo from the dropdown in the admin
UI, and even if they craft a REST PATCH against a foreign-geo post, ABAC
denies it. `filterOptions` is a UX constraint; ABAC is the security boundary.

## Seed users (single source of truth)

All credentials and API keys are defined in `test-app/src/seed.ts` and
re-exported so tests can import them directly instead of duplicating string
literals.

```ts
// src/seed.ts
export const adminUser = { email: 'admin@payload-tools.dev', password: 'Password1!' }

export const geoUsers = {
  rangerA: { email: 'ranger-a@geo.dev', password: 'Password1!', apiKey: 'geo-ranger-a-api-key' },
  rangerB: { email: 'ranger-b@geo.dev', password: 'Password1!', apiKey: 'geo-ranger-b-api-key' },
  viewer:  { email: 'viewer@geos.dev',  password: 'Password1!', apiKey: 'geo-viewer-api-key'   },
}
```

The seed creates:

- Geos: `geo-a`, `geo-b`
- Posts: `Geo A Post` (in `geo-a`), `Geo B Post` (in `geo-b`)
- Roles: `admin`, `editor`, `viewer` (`posts: read`), `ranger` (`posts: read+write+publish`)
- Users:
  - Admin (`isAdmin: true`, `apiKey = AUTOMATION_SEED_API_KEY` env var)
  - Ranger-A (`userRoles: [ranger]`, `geos: [geo-a]`)
  - Ranger-B (`userRoles: [ranger]`, `geos: [geo-b]`)
  - Viewer  (`userRoles: [viewer]`, `geos: [geo-a, geo-b]`)

API keys are stable strings so the e2e spec can authenticate without first
exchanging a password for a JWT. This also makes it easy to reproduce
failures from the terminal:

```bash
curl -s "http://localhost:3000/api/posts" \
  -H "Authorization: users API-Key geo-ranger-a-api-key" | jq '.docs[].title'
```

## What `abac-geos.spec.ts` asserts

1. **Admin** – lists both posts and successfully updates both, regardless of
   geo. If `AUTOMATION_SEED_API_KEY` is set, the test uses the seeded API
   key; otherwise it falls back to a fresh JWT obtained via
   `/api/users/login`.
2. **Ranger-A / Ranger-B** (parameterised) – each:
   - lists both `Geo A Post` and `Geo B Post` (read is unrestricted),
   - updates the post in *their own* geo successfully (200),
   - is denied (`403`/`404`) when updating the post in the *foreign* geo.
   The `geo` field itself is no longer field-locked — it is constrained in the
   admin UI via `filterOptions`. The spec doesn't assert that REST PATCH
   rejects a foreign-geo value, because `filterOptions` is a UX-level
   constraint; row-level ABAC is the actual security boundary and is already
   covered by the foreign-post update assertion above.
3. **Permissions endpoint** – `/api/me/permissions?collection=posts` for
   Ranger-A includes `read` + `update` and, when a compiled `where` is
   returned, that `where` mentions `geo` and the user's geo ids.
4. **Viewer** – lists both posts but every update returns `403`/`404`
   because RBAC denies `posts.update` before ABAC is consulted.

## How to run

```bash
# from repo root
cd test-app
pnpm dev   # starts Payload + seeds the database
# in another shell:
pnpm test:e2e -- abac-geos.spec.ts
```

Setting `AUTOMATION_SEED_API_KEY` lets the admin-side of the test exercise
API-key auth too:

```bash
AUTOMATION_SEED_API_KEY=admin-automation-key pnpm dev
```

## Extending the matrix

To add another geo / ranger:

1. Add a new entry to `geoUsers` in `src/seed.ts` with a unique email + api
   key, and append it to `geoUserSpecs` with the desired `geos` array.
2. Add a row to the parameterised `for` loop in `abac-geos.spec.ts`
   (`name`, `user`, `ownTitle`, `foreignTitle`).
3. If the new role has different RBAC permissions, add it next to the
   `ranger` / `viewer` role definitions in `seed.ts`.

No changes to `@shefing/abac` are required — the provider (`geoAttribute`
backed by `tenantAttribute({ multiValue: true })`) already handles arbitrary
`user.geos` arrays.
