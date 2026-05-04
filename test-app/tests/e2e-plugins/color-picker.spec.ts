import { test, expect } from '@playwright/test'
import { getToken, createArticle, deleteArticle, navigateToArticleById, randomSuffix } from './helpers'

test.describe('Color Picker plugin (@shefing/color-picker)', () => {
  let token: string
  let articleId: string

  test.beforeEach(async ({ page, request }) => {
    token = await getToken(request)
    const suffix = randomSuffix()
    articleId = await createArticle(request, token, {
      title: `Color Picker Test ${suffix}`,
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

  test('color picker fields render on the article edit form', async ({ page }) => {
    // authors-info plugin wraps fields in a "Content" tab — ensure it is active
    const contentTab = page.getByRole('tab', { name: /content/i })
    if (await contentTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await contentTab.click()
    }
    await expect(page.getByText('Text Color')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Background Color')).toBeVisible({ timeout: 10000 })
  })

  test('color picker popover opens and a color can be selected', async ({ page }) => {
    // Ensure Content tab is active (authors-info plugin wraps fields in tabs)
    const contentTab = page.getByRole('tab', { name: /content/i })
    if (await contentTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await contentTab.click()
    }
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
    const contentTab = page.getByRole('tab', { name: /content/i })
    if (await contentTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await contentTab.click()
    }
    await expect(page.getByText('Text Color')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Background Color')).toBeVisible({ timeout: 10000 })
  })

  test('can create a new article with color fields', async ({ page, request }) => {
    const suffix = randomSuffix()
    await page.goto('/admin/collections/articles/create')

    await page.locator('input[name="title"]').fill(`E2E Color Create ${suffix}`)

    // Ensure Content tab is active (authors-info plugin wraps fields in tabs)
    const contentTab2 = page.getByRole('tab', { name: /content/i })
    if (await contentTab2.isVisible({ timeout: 3000 }).catch(() => false)) {
      await contentTab2.click()
    }
    // Open the Text Color picker and pick a color
    const textColorButton = page.locator('.useTw').first().getByRole('button')
    await textColorButton.click()
    const popover = page.locator('[cmdk-root]')
    await expect(popover).toBeVisible()
    await popover.locator('[cmdk-item]').first().click()

    // Save the document
    await page.getByRole('button', { name: /save/i }).first().click()
    await expect(page.getByText(/successfully/i)).toBeVisible()

    // Cleanup the newly created article
    const newToken = await getToken(request)
    const url = page.url()
    const newId = url.split('/').pop()
    if (newId && newId !== 'create') {
      await deleteArticle(request, newToken, newId)
    }
  })
})
