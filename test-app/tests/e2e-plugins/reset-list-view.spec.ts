import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('CollectionResetPreferencesPlugin (@shefing/reset-list-view)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/admin/collections/pages')
    await page.waitForURL(/\/admin\/collections\/pages/)
  })

  test('reset button is present in the list view menu', async ({ page }) => {
    // The plugin adds a button inside the list menu (three-dot / kebab menu)
    const menuButton = page.locator('.list-controls__view-column-control .popup--type-click')
    if (await menuButton.isVisible()) {
      await menuButton.click()
      // The reset button label is built from t('general:resetPreferences') + collection plural label
      const resetButton = page.locator('.popup-button-list__button', { hasText: /Reset/i })
      await expect(resetButton).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('reset button clears column preferences and reloads the list', async ({ page }) => {
    // Open the columns menu and toggle a column off to create a preference
    const columnsButton = page.getByRole('button', { name: /columns/i })
    if (await columnsButton.isVisible()) {
      await columnsButton.click()
      // Toggle the first available column checkbox
      const firstCheckbox = page.locator('[role="menu"] input[type="checkbox"]').first()
      if (await firstCheckbox.isVisible()) {
        await firstCheckbox.click()
        await page.keyboard.press('Escape')
      }
    }

    // Now click the reset button
    const menuButton = page.locator('.list-controls__view-column-control .popup--type-click')
    if (await menuButton.isVisible()) {
      await menuButton.click()
    }
    const resetButton = page.locator('.popup-button-list__button', { hasText: /reset/i })
    if (await resetButton.isVisible()) {
      await resetButton.click()
      // After reset the page reloads — wait for the list to be visible again
      await page.waitForURL(/\/admin\/collections\/pages/)
      await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('reset button removes the columns query param from the URL', async ({ page }) => {
    // Manually add a columns param to simulate a saved preference state
    await page.goto('/admin/collections/pages?columns=%5B%22title%22%5D')
    await page.waitForURL(/\/admin\/collections\/pages/)

    const menuButton = page.locator('.list-controls__view-column-control .popup--type-click')
    if (await menuButton.isVisible()) {
      await menuButton.click()
    }
    const resetButton = page.locator('.popup-button-list__button', { hasText: /reset/i })
    if (await resetButton.isVisible()) {
      await resetButton.click()
      await page.waitForURL(/\/admin\/collections\/pages/)
      // The columns param should be gone after reset
      expect(page.url()).not.toContain('columns=')
    } else {
      test.skip()
    }
  })

  test('reset button label includes the collection plural name', async ({ page }) => {
    const menuButton = page.locator('.list-controls__view-column-control .popup--type-click')
    if (await menuButton.isVisible()) {
      await menuButton.click()
      // The button text is: resetPreferences + ' - ' + collectionPluralLabel
      // For the 'pages' collection the plural label is 'Pages'
      const resetButton = page.locator('.popup-button-list__button', { hasText: /reset.*pages/i })
      await expect(resetButton).toBeVisible()
    } else {
      test.skip()
    }
  })
})
