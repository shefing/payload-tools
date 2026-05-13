import { expect, test } from '@playwright/test'

const tenantUsers = {
  alice: {
    email: 'alice@tenant-a.dev',
    password: 'Password1!',
  },
  bob: {
    email: 'bob@tenant-b.dev',
    password: 'Password1!',
  },
}

const loginViaRest = async (request: Parameters<typeof test>[0]['request'], email: string, password: string) => {
  const loginRes = await request.post('/api/users/login', {
    data: { email, password },
  })

  expect(loginRes.ok()).toBeTruthy()

  const body = await loginRes.json()
  const [, payload] = (body.token as string).split('.')
  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
    tenant?: string
  }

  return {
    token: body.token as string,
    tenantId: String(decoded.tenant),
  }
}

test.describe('abac plugin (@shefing/abac)', () => {
  for (const [label, user] of Object.entries(tenantUsers)) {
    test(`${label} only sees their tenant documents via REST`, async ({ request }) => {
      const { token, tenantId } = await loginViaRest(request, user.email, user.password)

      const listRes = await request.get('/api/articles', {
        headers: { Authorization: `JWT ${token}` },
      })

      expect(listRes.status()).toBe(200)

      const listBody = await listRes.json()
      const docs = listBody.docs as Array<{ tenant?: { id?: string } | string | null }>
      const restTitles = docs.map((doc: { title?: string }) => doc.title).filter(Boolean)

      expect(
        docs.every((doc) => {
          if (!doc.tenant) {
            return false
          }

          const docTenantId = typeof doc.tenant === 'string' ? doc.tenant : doc.tenant.id
          return String(docTenantId) === tenantId
        }),
      ).toBe(true)
    })

    test(`${label} gets tenant-scoped permissions and GraphQL results`, async ({ request }) => {
      const { token, tenantId } = await loginViaRest(request, user.email, user.password)

      const listRes = await request.get('/api/articles', {
        headers: { Authorization: `JWT ${token}` },
      })

      expect(listRes.status()).toBe(200)

      const listBody = await listRes.json()
      const restTitles = (listBody.docs as Array<{ title?: string }>).map((doc) => doc.title).filter(Boolean)

      const permissionsRes = await request.get('/api/me/permissions?collection=articles', {
        headers: { Authorization: `JWT ${token}` },
      })

      expect(permissionsRes.status()).toBe(200)

      const permissionsBody = await permissionsRes.json()
      expect(permissionsBody.collection).toBe('articles')
      expect(permissionsBody.actions).toContain('read')
      expect(permissionsBody.where).toEqual({ tenant: { equals: tenantId } })

      const graphqlRes = await request.post('/api/graphql', {
        headers: { Authorization: `JWT ${token}` },
        data: {
          query: `query Articles { Articles { docs { title tenant { id } } } }`,
        },
      })

      expect(graphqlRes.status()).toBe(200)

      const graphqlBody = await graphqlRes.json()
      const docs = graphqlBody.data.Articles.docs as Array<{
        title?: string
        tenant?: { id?: string } | string | null
      }>
      const graphQlTitles = docs.map((doc) => doc.title).filter(Boolean)

      expect(graphQlTitles.sort()).toEqual(restTitles.sort())
    })
  }

  test('admin UI list remains reachable and shows article rows', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForURL((url) => url.pathname === '/admin', { timeout: 30000 })

    await page.goto('/admin/collections/articles')
    await page.waitForLoadState('networkidle', { timeout: 30000 })

    await expect(page.getByRole('heading', { name: 'Articles' })).toBeVisible()
    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
    expect(await rows.count()).toBeGreaterThan(0)
  })
})