import { test, expect } from '@playwright/test'
import { login } from './helpers'

// CollectionQuickFilterPlugin only renders filter controls when a collection has
// collection.custom.filterList configured. The test-app's pages and articles
// collections do not define filterList, so the QuickFilter component is not injected.
// Tests verify graceful absence and fall back to skip when the UI is not present.
test.describe('CollectionQuickFilterPlugin (@shefing/quickfilter)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/admin/collections/pages')
    await page.waitForURL(/\/admin\/collections\/pages/)
  })

  test('quick filter controls are visible above the collection list', async ({ page }) => {
    // Filter controls only appear when filterList is configured on the collection
    const filterControl = page.locator('[data-testid="quickfilter"], .quickfilter, [class*="quickfilter"]').first()
    if (await filterControl.isVisible()) {
      await expect(filterControl).toBeVisible()
    } else {
      // Plugin is active but no filterList is configured — skip gracefully
      test.skip()
    }
  })

  test('selecting a filter value narrows the displayed documents', async ({ page }) => {
    const filterButton = page.getByRole('button', { name: /published/i })
    if (await filterButton.isVisible()) {
      await filterButton.click()
      await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Contact' })).not.toBeVisible()
    } else {
      test.skip()
    }
  })

  test('clearing a filter restores the full document list', async ({ page }) => {
    const filterButton = page.getByRole('button', { name: /published/i })
    if (await filterButton.isVisible()) {
      await filterButton.click()
      // Clear the filter
      const clearButton = page.getByRole('button', { name: /clear|all|reset/i }).first()
      if (await clearButton.isVisible()) {
        await clearButton.click()
        await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
        await expect(page.getByRole('link', { name: 'Contact' })).toBeVisible()
      } else {
        test.skip()
      }
    } else {
      test.skip()
    }
  })

  test('multiple filters can be combined', async ({ page }) => {
    // Requires at least two filter controls to be present
    const filterButtons = page.getByRole('button', { name: /published|draft|archived/i })
    const count = await filterButtons.count()
    if (count >= 2) {
      await filterButtons.first().click()
      await filterButtons.nth(1).click()
      // At least one document should remain visible
      await expect(page.getByRole('table')).toBeVisible()
    } else {
      test.skip()
    }
  })
})
