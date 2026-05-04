import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('Color Picker plugin (@shefing/color-picker)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('color picker fields render on the article edit form', async ({ page }) => {
    // Navigate to the articles list and open the first seeded article
    await page.goto('/admin/collections/articles')
    await page.getByRole('link', { name: 'Hello World' }).click()
    await page.waitForURL(/\/admin\/collections\/articles\/\w+/)

    // Both color-picker fields should be visible
    await expect(page.getByText('Text Color')).toBeVisible()
    await expect(page.getByText('Background Color')).toBeVisible()
  })

  test('color picker popover opens and a color can be selected', async ({ page }) => {
    await page.goto('/admin/collections/articles')
    await page.getByRole('link', { name: 'Hello World' }).click()
    await page.waitForURL(/\/admin\/collections\/articles\/\w+/)

    // Click the Text Color picker button to open the popover
    const textColorButton = page.locator('.useTw').first().getByRole('button')
    await textColorButton.click()

    // Popover with color swatches should appear
    const popover = page.locator('[cmdk-root]')
    await expect(popover).toBeVisible()

    // Search for a specific color
    await popover.getByPlaceholder('Search color...').fill('red')

    // Pick the first visible color swatch
    const firstSwatch = popover.locator('[cmdk-item]').first()
    await firstSwatch.click()

    // Popover should close after selection
    await expect(popover).not.toBeVisible()
  })

  test('color picker label renders as string even when i18n object is used', async ({ page }) => {
    // This test guards against the regression fixed in issue #36:
    // field.label as { en: 'Color' } must not crash the component
    await page.goto('/admin/collections/articles')
    await page.getByRole('link', { name: 'Hello World' }).click()
    await page.waitForURL(/\/admin\/collections\/articles\/\w+/)

    // No JS error should have occurred — page should still be interactive
    await expect(page.getByText('Text Color')).toBeVisible()
    await expect(page.getByText('Background Color')).toBeVisible()
  })

  test('can create a new article with color fields', async ({ page }) => {
    await page.goto('/admin/collections/articles/create')

    await page.getByLabel('Title').fill('E2E Test Article')

    // Open the Text Color picker and pick a color
    const textColorButton = page.locator('.useTw').first().getByRole('button')
    await textColorButton.click()
    const popover = page.locator('[cmdk-root]')
    await expect(popover).toBeVisible()
    await popover.locator('[cmdk-item]').first().click()

    // Save the document
    await page.getByRole('button', { name: /save/i }).first().click()
    await expect(page.getByText(/successfully/i)).toBeVisible()
  })
})
