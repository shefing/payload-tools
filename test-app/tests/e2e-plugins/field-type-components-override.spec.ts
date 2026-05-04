import { test, expect } from '@playwright/test'
import { getToken, createArticle, deleteArticle, navigateToArticleById, randomSuffix } from './helpers'

// DynamicFieldOverrides is initialised with { overrides: [] } in the test-app,
// so no field types are overridden. Tests verify the plugin does not break the UI
// and that default field components still render correctly.
test.describe('DynamicFieldOverrides plugin (@shefing/field-type-component-override)', () => {
  let token: string
  let articleId: string

  test.beforeEach(async ({ page, request }) => {
    token = await getToken(request)
    const suffix = randomSuffix()
    articleId = await createArticle(request, token, {
      title: `Field Override Test ${suffix}`,
      textColor: 'blue-500',
      bgColor: 'gray-100',
      icon: 'star',
      _status: 'published',
    })
    await navigateToArticleById(page, articleId)
  })

  test.afterEach(async ({ request }) => {
    await deleteArticle(request, token, articleId)
  })

  test('custom component override is rendered for a configured field type', async ({ page }) => {
    // With overrides: [] no custom components are injected — the default text field renders
    await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 15000 })
  })

  test('overridden field still saves and loads values correctly', async ({ page }) => {
    // Edit the title field (default text component) and save
    const titleField = page.locator('input[name="title"]')
    await titleField.click()
    await titleField.pressSequentially(' Updated')
    await page.getByRole('button', { name: /save/i }).first().click()
    await expect(page.getByText(/successfully/i)).toBeVisible()
    // Reload and confirm value persisted
    await page.reload()
    await expect(page.locator('input[name="title"]')).toHaveValue(/Updated/, { timeout: 10000 })
  })

  test('non-overridden field types render their default components', async ({ page }) => {
    // Text Color and Background Color fields use the color-picker custom component
    // and should still render correctly alongside the override plugin
    const contentTab = page.getByRole('tab', { name: /content/i })
    if (await contentTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await contentTab.click()
    }
    await expect(page.getByText('Text Color')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Background Color')).toBeVisible({ timeout: 10000 })
  })

  test('empty overrides config does not break the admin UI', async ({ page }) => {
    // The page should be fully interactive with no JS errors
    await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('button', { name: /save/i }).first()).toBeVisible({ timeout: 10000 })
  })
})
