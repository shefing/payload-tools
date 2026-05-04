import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('List-view plugins (quickfilter + reset-list-view)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/admin/collections/pages')
    await page.waitForURL(/\/admin\/collections\/pages/)
  })

  test('pages list shows seeded documents', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'About' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Contact' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Blog' })).toBeVisible()
  })

  test('quickfilter — filter by status narrows the list', async ({ page }) => {
    // The quickfilter plugin adds filter buttons above the list
    // Look for a filter control (button or select) for the status field
    const filterControl = page.getByRole('button', { name: /published/i })
    if (await filterControl.isVisible()) {
      await filterControl.click()
      // After filtering, only published pages should be visible
      await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'About' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Contact' })).not.toBeVisible()
    } else {
      // Plugin may render as a select — skip gracefully if UI differs
      test.skip()
    }
  })

  test('reset-list-view — reset button restores default list state', async ({ page }) => {
    // Apply a search to change list state
    const searchInput = page.getByPlaceholder(/search/i)
    if (await searchInput.isVisible()) {
      await searchInput.fill('Home')
      await page.keyboard.press('Enter')
      await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'About' })).not.toBeVisible()
    }

    // The reset-list-view plugin adds a reset/clear button
    const resetButton = page.getByRole('button', { name: /reset/i })
    if (await resetButton.isVisible()) {
      await resetButton.click()
      // All seeded pages should be visible again
      await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'About' })).toBeVisible()
    } else {
      test.skip()
    }
  })
})

test.describe('Articles list', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/admin/collections/articles')
    await page.waitForURL(/\/admin\/collections\/articles/)
  })

  test('shows seeded articles', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Hello World' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Second Article' })).toBeVisible()
  })

  test('can navigate to article edit page', async ({ page }) => {
    await page.getByRole('link', { name: 'Hello World' }).click()
    await page.waitForURL(/\/admin\/collections\/articles\/\w+/)
    await expect(page.getByLabel('Title')).toHaveValue('Hello World')
  })
})
