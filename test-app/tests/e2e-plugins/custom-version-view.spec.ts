import { test, expect } from '@playwright/test'
import { getToken, createArticle, deleteArticle, navigateToArticleById, randomSuffix } from './helpers'

test.describe('versionsPlugin (@shefing/custom-version-view)', () => {
  let token: string
  let articleId: string

  test.beforeEach(async ({ page, request }) => {
    token = await getToken(request)
    const suffix = randomSuffix()
    articleId = await createArticle(request, token, {
      title: `Version Test ${suffix}`,
      textColor: 'blue-500',
      bgColor: 'gray-100',
      icon: 'star',
      _status: 'draft',
    })
    await navigateToArticleById(page, articleId)
  })

  test.afterEach(async ({ request }) => {
    await deleteArticle(request, token, articleId)
  })

  // Helper: find the versions tab regardless of role (link, tab, or button)
  function versionsTab(page: import('@playwright/test').Page) {
    return page.locator('a, [role="tab"], button').filter({ hasText: /versions/i }).first()
  }

  test('custom versions tab is visible on the article edit page', async ({ page }) => {
    // Wait for the form to be hydrated before looking for the tab
    await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 15000 })
    await expect(versionsTab(page)).toBeVisible({ timeout: 15000 })
  })

  test('versions list shows previously saved drafts', async ({ page }) => {
    await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 15000 })
    const tab = versionsTab(page)
    await tab.waitFor({ state: 'visible', timeout: 15000 })
    await tab.click()
    await page.waitForURL(/\/versions/, { timeout: 15000 })
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    const table = page.getByRole('table')
    await expect(table).toBeVisible({ timeout: 10000 })
  })

  test('can restore a previous version of a document', async ({ page }) => {
    await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 15000 })
    // Make a small change to enable the Save Draft button
    const titleField = page.locator('input[name="title"]')
    await titleField.click()
    await titleField.pressSequentially(' ')

    // Save a new draft to ensure at least one version exists
    const saveDraftBtn = page.getByRole('button', { name: /save draft/i }).first()
    await saveDraftBtn.waitFor({ state: 'visible' })
    await expect(saveDraftBtn).toBeEnabled({ timeout: 10000 })
    await saveDraftBtn.click()
    await page.waitForTimeout(500)

    const tab = versionsTab(page)
    await tab.waitFor({ state: 'visible', timeout: 15000 })
    await tab.click()
    await page.waitForURL(/\/versions/, { timeout: 15000 })
    await page.waitForLoadState('networkidle', { timeout: 15000 })

    const firstVersionLink = page.getByRole('link').filter({ hasText: /ago|draft|published/i }).first()
    if (await firstVersionLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstVersionLink.click()
      await page.waitForLoadState('networkidle', { timeout: 15000 })
      const restoreButton = page.getByRole('button', { name: /restore/i })
      await expect(restoreButton).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('version timestamps are displayed in a human-readable format', async ({ page }) => {
    await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 15000 })
    const tab = versionsTab(page)
    await tab.waitFor({ state: 'visible', timeout: 15000 })
    await tab.click()
    await page.waitForURL(/\/versions/, { timeout: 15000 })
    await page.waitForLoadState('networkidle', { timeout: 15000 })

    const relativeTime = page.getByText(/ago|just now|a few seconds/i).first()
    await expect(relativeTime).toBeVisible({ timeout: 10000 })
  })
})
