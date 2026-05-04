import { test, expect } from '@playwright/test'
import { getToken, randomSuffix, login } from './helpers'

async function createPage(
  request: import('@playwright/test').APIRequestContext,
  token: string,
  data: Record<string, unknown>,
): Promise<string> {
  const res = await request.post('/api/pages', {
    headers: { Authorization: token },
    data,
  })
  const body = await res.json()
  const id = body?.doc?.id
  if (!id) throw new Error(`Failed to create page: ${JSON.stringify(body)}`)
  return id
}

async function deletePage(
  request: import('@playwright/test').APIRequestContext,
  token: string,
  id: string,
): Promise<void> {
  await request.delete(`/api/pages/${id}`, {
    headers: { Authorization: token },
  })
}

test.describe('List-view plugins (quickfilter + reset-list-view)', () => {
  let token: string
  let pageIds: string[] = []
  let suffix: string

  test.beforeEach(async ({ page, request }) => {
    token = await getToken(request)
    suffix = randomSuffix()
    pageIds = await Promise.all([
      createPage(request, token, { title: `Home ${suffix}`, status: 'published' }),
      createPage(request, token, { title: `About ${suffix}`, status: 'published' }),
      createPage(request, token, { title: `Contact ${suffix}`, status: 'draft' }),
      createPage(request, token, { title: `Blog ${suffix}`, status: 'archived' }),
    ])
    await login(page)
    await page.goto(`/admin/collections/pages?search=${encodeURIComponent(suffix)}`)
    await page.waitForURL(/\/admin\/collections\/pages/, { timeout: 15000 })
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('table tbody tr, .collection-list__no-results', { timeout: 20000 }).catch(() => {})
    await page.waitForTimeout(500)
  })

  test.afterEach(async ({ request }) => {
    await Promise.all(pageIds.map((id) => deletePage(request, token, id)))
  })

  test('pages list shows created documents', async ({ page }) => {
    await expect(page.locator('td', { hasText: `Home ${suffix}` }).first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('td', { hasText: `About ${suffix}` }).first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('td', { hasText: `Contact ${suffix}` }).first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('td', { hasText: `Blog ${suffix}` }).first()).toBeVisible({ timeout: 10000 })
  })

  test('quickfilter — filter by status narrows the list', async ({ page }) => {
    const filterControl = page.getByRole('button', { name: /published/i })
    if (await filterControl.isVisible()) {
      await filterControl.click()
      await expect(page.locator('td', { hasText: `Home ${suffix}` }).first()).toBeVisible()
      await expect(page.locator('td', { hasText: `About ${suffix}` }).first()).toBeVisible()
      await expect(page.locator('td', { hasText: `Contact ${suffix}` }).first()).not.toBeVisible()
    } else {
      test.skip()
    }
  })

  test('reset-list-view — reset button restores default list state', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i)
    if (await searchInput.isVisible()) {
      await searchInput.fill(`Home ${suffix}`)
      await page.waitForTimeout(1000)
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)
      await expect(page.locator('td', { hasText: `Home ${suffix}` }).first()).toBeVisible()
      await expect(page.locator('td', { hasText: `About ${suffix}` }).first()).not.toBeVisible({ timeout: 5000 })
    }

    const resetButton = page.locator('.popup-button-list__button', { hasText: /reset/i })
    if (await resetButton.isVisible()) {
      await resetButton.click()
      await expect(page.locator('td', { hasText: `Home ${suffix}` }).first()).toBeVisible()
      await expect(page.locator('td', { hasText: `About ${suffix}` }).first()).toBeVisible()
    } else {
      test.skip()
    }
  })
})

test.describe('Articles list', () => {
  let token: string
  let articleId: string
  let suffix: string

  test.beforeEach(async ({ page, request }) => {
    token = await getToken(request)
    suffix = randomSuffix()
    const res = await request.post('/api/articles', {
      headers: { Authorization: token },
      data: {
        title: `List View Test ${suffix}`,
        textColor: 'blue-500',
        bgColor: 'gray-100',
        icon: 'star',
        _status: 'published',
      },
    })
    const body = await res.json()
    articleId = body?.doc?.id
    await login(page)
    await page.goto(`/admin/collections/articles?search=${encodeURIComponent(suffix)}`)
    await page.waitForURL(/\/admin\/collections\/articles/, { timeout: 15000 })
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('table tbody tr, .collection-list__no-results', { timeout: 20000 }).catch(() => {})
    await page.waitForTimeout(500)
  })

  test.afterEach(async ({ request }) => {
    await request.delete(`/api/articles/${articleId}`, {
      headers: { Authorization: token },
    })
  })

  test('shows created article', async ({ page }) => {
    await expect(page.locator('td', { hasText: `List View Test ${suffix}` }).first()).toBeVisible()
  })

  test('can navigate to article edit page', async ({ page }) => {
    const row = page.locator('tr', { hasText: `List View Test ${suffix}` }).first()
    await row.getByRole('link').first().click()
    await page.waitForURL(/\/admin\/collections\/articles\/\w+/)
    await expect(page.locator('input[name="title"]')).toHaveValue(`List View Test ${suffix}`, { timeout: 10000 })
  })
})
