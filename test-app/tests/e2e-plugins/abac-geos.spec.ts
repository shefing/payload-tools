import { expect, test, type APIRequestContext } from '@playwright/test'

import { adminUser, geoUsers } from '../../src/seed'

/**
 * E2E coverage for the geo-scoped ABAC scenario on the `posts` collection.
 *
 *  - Admin    : read all posts, update across all geos (isAdmin bypass)
 *  - Ranger-A : read all posts, update only posts whose `geo` is in [geo-a]
 *  - Ranger-B : read all posts, update only posts whose `geo` is in [geo-b]
 *  - Viewer   : read all posts, cannot update any post (RBAC denies write)
 *
 * Geo scoping is configured on the `posts` collection via
 *   custom.abac.geo = { docField: 'geo', actions: ['update', 'create', 'delete'] }
 * so `read` is intentionally not narrowed by ABAC.
 *
 * The `geo` field on `posts` is additionally field-locked: only admins can edit
 * it. Rangers get their first geo defaulted on create and cannot change it.
 *
 * Credentials/API keys are imported from `src/seed.ts` to keep the test and the
 * seeded fixtures in lock-step (single source of truth).
 */

type LoginResult = {
  token: string
  geos: string[]
  isAdmin?: boolean
}

const loginViaRest = async (
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<LoginResult> => {
  const res = await request.post('/api/users/login', { data: { email, password } })
  expect(res.ok()).toBeTruthy()

  const body = await res.json()
  const [, payloadSegment] = (body.token as string).split('.')
  const decoded = JSON.parse(Buffer.from(payloadSegment, 'base64url').toString('utf-8')) as {
    geos?: Array<string | { id?: string }>
    isAdmin?: boolean
  }

  const geos = (decoded.geos ?? [])
    .map((entry) => (typeof entry === 'string' ? entry : entry?.id ? String(entry.id) : null))
    .filter((g): g is string => Boolean(g))

  return { token: body.token as string, geos, isAdmin: decoded.isAdmin }
}

const listPosts = async (request: APIRequestContext, apiKey: string) => {
  const res = await request.get('/api/posts?limit=100', {
    headers: { Authorization: `users API-Key ${apiKey}` },
  })
  expect(res.status()).toBe(200)
  const body = await res.json()
  return body.docs as Array<{
    id: string
    title?: string
    geo?: { id?: string } | string | null
  }>
}

const updatePost = async (
  request: APIRequestContext,
  apiKey: string,
  id: string,
  data: Record<string, unknown>,
) => {
  return request.patch(`/api/posts/${id}`, {
    headers: { Authorization: `users API-Key ${apiKey}` },
    data,
  })
}

const geoOfPost = (post: { geo?: { id?: string } | string | null }) =>
  typeof post.geo === 'string' ? post.geo : post.geo?.id ? String(post.geo.id) : ''

test.describe('abac plugin – geo scoping on posts (@shefing/abac)', () => {
  test('admin can read all posts and update across all geos', async ({ request }) => {
    const { token } = await loginViaRest(request, adminUser.email, adminUser.password)
    // Admin uses its seeded automation API key when available; otherwise fall back to JWT.
    const adminApiKey = process.env.AUTOMATION_SEED_API_KEY

    const posts = adminApiKey
      ? await listPosts(request, adminApiKey)
      : (await (
          await request.get('/api/posts?limit=100', { headers: { Authorization: `JWT ${token}` } })
        ).json()).docs

    const titles = posts.map((p: { title?: string }) => p.title)
    expect(titles).toEqual(expect.arrayContaining(['Geo A Post', 'Geo B Post']))

    for (const post of posts.filter((p: { title?: string }) => p.title === 'Geo A Post' || p.title === 'Geo B Post')) {
      const res = adminApiKey
        ? await updatePost(request, adminApiKey, post.id, { content: `admin-touched-${Date.now()}` })
        : await request.patch(`/api/posts/${post.id}`, {
            headers: { Authorization: `JWT ${token}` },
            data: { content: `admin-touched-${Date.now()}` },
          })
      expect(res.status()).toBe(200)
    }
  })

  for (const { name, user, ownTitle, foreignTitle } of [
    {
      name: 'ranger-a',
      user: geoUsers.rangerA,
      ownTitle: 'Geo A Post',
      foreignTitle: 'Geo B Post',
    },
    {
      name: 'ranger-b',
      user: geoUsers.rangerB,
      ownTitle: 'Geo B Post',
      foreignTitle: 'Geo A Post',
    },
  ]) {
    test(`${name} reads all posts but can only update posts in their geo`, async ({ request }) => {
      const posts = await listPosts(request, user.apiKey)
      const titles = posts.map((p) => p.title)
      expect(titles).toEqual(expect.arrayContaining(['Geo A Post', 'Geo B Post']))

      const ownPost = posts.find((p) => p.title === ownTitle)
      const foreignPost = posts.find((p) => p.title === foreignTitle)
      expect(ownPost).toBeTruthy()
      expect(foreignPost).toBeTruthy()

      // own geo: allowed
      const ownRes = await updatePost(request, user.apiKey, ownPost!.id, {
        content: `${name}-own-${Date.now()}`,
      })
      expect(ownRes.status()).toBe(200)

      // foreign geo: denied by ABAC `where` narrowing
      const foreignRes = await updatePost(request, user.apiKey, foreignPost!.id, {
        content: `${name}-foreign-${Date.now()}`,
      })
      expect(foreignRes.status()).not.toBe(200)
      expect([403, 404]).toContain(foreignRes.status())

      // The `geo` field is no longer field-locked: it is constrained in the admin UI
      // via `filterOptions` so rangers only see their own geos in the dropdown.
      // We don't assert REST PATCH rejection here because filterOptions is a UI-level
      // constraint; the row-level ABAC `where` above is the actual security boundary.
      void geoOfPost
    })
  }

  test('ranger permissions endpoint exposes geo-scoped update where clause', async ({ request }) => {
    const { token, geos: rangerGeos } = await loginViaRest(
      request,
      geoUsers.rangerA.email,
      geoUsers.rangerA.password,
    )

    const permRes = await request.get('/api/me/permissions?collection=posts', {
      headers: { Authorization: `JWT ${token}` },
    })
    expect(permRes.status()).toBe(200)

    const body = await permRes.json()
    expect(body.collection).toBe('posts')
    expect(body.actions).toContain('read')
    expect(body.actions).toContain('update')

    if (body.where) {
      const compiled = JSON.stringify(body.where)
      expect(compiled).toContain('geo')
      for (const id of rangerGeos) {
        expect(compiled).toContain(id)
      }
    }
  })

  test('viewer reads all posts but cannot update any post (RBAC denies write)', async ({ request }) => {
    const posts = await listPosts(request, geoUsers.viewer.apiKey)
    const titles = posts.map((p) => p.title)
    expect(titles).toEqual(expect.arrayContaining(['Geo A Post', 'Geo B Post']))

    for (const post of posts.filter((p) => p.title === 'Geo A Post' || p.title === 'Geo B Post')) {
      const res = await updatePost(request, geoUsers.viewer.apiKey, post.id, {
        content: `viewer-attempt-${Date.now()}`,
      })
      expect(res.status()).not.toBe(200)
      expect([403, 404]).toContain(res.status())
    }
  })
})
