import { expect, test, type APIRequestContext } from '@playwright/test'

import { login, loginAs, randomSuffix } from './helpers'

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

const loginViaRest = async (request: APIRequestContext, email: string, password: string) => {
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
      const docs = listBody.docs as Array<{ title?: string; tenant?: { id?: string } | string | null }>
      const restTitles = docs.map((doc) => doc.title).filter(Boolean)

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
    await login(page)

    await page.goto('/admin/collections/articles')
    await page.waitForLoadState('networkidle', { timeout: 30000 })

    await expect(page.getByRole('heading', { name: 'Articles' })).toBeVisible()
    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
    expect(await rows.count()).toBeGreaterThan(0)
  })

  test('alice (tenant-a) can create, view and edit an article with tenant auto-populated', async ({ page }) => {
    const suffix = randomSuffix()
    const articleTitle = `Alice Article ${suffix}`

    // ── 1. Log in as Alice (tenant-a) ────────────────────────────────────────
    await loginAs(page, tenantUsers.alice.email, tenantUsers.alice.password)

    // ── 2. Navigate to create a new article ──────────────────────────────────
    await page.goto('/admin/collections/articles/create')
    await page.waitForLoadState('networkidle', { timeout: 30000 })

    const titleInput = page.locator('input[name="title"]')
    await titleInput.waitFor({ state: 'visible', timeout: 15000 })

    // ── 3. Fill in the title ─────────────────────────────────────────────────
    await titleInput.fill(articleTitle)

    // ── 4. Save the article (tenant is stamped server-side on create by abacPlugin) ──
    await page.getByRole('button', { name: 'Save Draft' }).click()
    // Wait for Payload to redirect from /create to the new article edit page
    await page.waitForURL((url) => !url.href.endsWith('/create'), { timeout: 30000 })
    await page.waitForLoadState('networkidle', { timeout: 30000 })

    // After save, Payload redirects to the edit page — capture the new article id from the URL
    const editUrl = page.url()
    expect(editUrl).toMatch(/\/admin\/collections\/articles\/[^/]+$/)
    const articleId = editUrl.split('/').pop()!
    expect(articleId).not.toBe('create')

    // ── 5. Verify the article is visible (view) and tenant was stamped ────────
    const tenantField = page.locator('[id^="field-tenant"]').first()
    await expect(page.locator('input[name="title"]')).toHaveValue(articleTitle)
    await expect(tenantField).toBeVisible({ timeout: 10000 })
    // Wait for the relationship field to resolve the tenant name (lazy-loaded)
    await expect(tenantField).toContainText('tenant-a', { ignoreCase: true, timeout: 15000 })

    // ── 6. Edit the article ──────────────────────────────────────────────────
    const updatedTitle = `${articleTitle} (edited)`
    await page.locator('input[name="title"]').fill(updatedTitle)
    await page.getByRole('button', { name: 'Save Draft' }).click()
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    // Wait for the save to complete (title input reflects updated value)
    await expect(page.locator('input[name="title"]')).toHaveValue(updatedTitle, { timeout: 15000 })

    // ── 7. Confirm tenant is still tenant-a after edit ────────────────────────
    await expect(tenantField).toContainText('tenant-a', { ignoreCase: true, timeout: 15000 })

    // ── 8. Cleanup: delete the article via REST as admin ─────────────────────
    const adminApiKey = process.env.AUTOMATION_SEED_API_KEY
    await page.request.delete(`/api/articles/${articleId}`, {
      headers: { Authorization: `users API-Key ${adminApiKey}` },
    })
  })
})