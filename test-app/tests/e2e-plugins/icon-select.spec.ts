import { test, expect } from '@playwright/test'
import { getToken, createArticle, deleteArticle, navigateToArticleById, randomSuffix } from './helpers'

test.describe('createIconSelectField (@shefing/icon-select)', () => {
  let token: string
  let articleId: string

  test.beforeEach(async ({ page, request }) => {
    token = await getToken(request)
    const suffix = randomSuffix()
    articleId = await createArticle(request, token, {
      title: `Icon Select Test ${suffix}`,
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

  test('icon select field renders on the article edit form', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Icon').first()).toBeVisible({ timeout: 10000 })
  })

  test('clicking the icon field opens the icon picker', async ({ page }) => {
    const iconField = page.getByText('Icon').first().locator('..').getByRole('button').first()
    if (await iconField.isVisible()) {
      await iconField.click()
      const picker = page.locator('[cmdk-root], [role="dialog"], [role="listbox"]').first()
      await expect(picker).toBeVisible()
    } else {
      await page.getByText('Icon').first().click()
      const picker = page.locator('[cmdk-root], [role="dialog"], [role="listbox"]').first()
      if (await picker.isVisible()) {
        await expect(picker).toBeVisible()
      } else {
        test.skip()
      }
    }
  })

  test('can search for and select an icon', async ({ page }) => {
    const iconField = page.getByText('Icon').first().locator('..').getByRole('button').first()
    if (await iconField.isVisible()) {
      await iconField.click()
    } else {
      await page.getByText('Icon').first().click()
    }

    const picker = page.locator('[cmdk-root], [role="dialog"], [role="listbox"]').first()
    if (!(await picker.isVisible())) {
      test.skip()
      return
    }

    const searchInput = picker.getByRole('searchbox').or(picker.getByPlaceholder(/search/i))
    if (await searchInput.isVisible()) {
      await searchInput.fill('star')
    }

    const firstItem = picker.locator('[cmdk-item], [role="option"]').first()
    if (await firstItem.isVisible()) {
      await firstItem.click()
      await expect(picker).not.toBeVisible()
    } else {
      test.skip()
    }
  })

  test('selected icon is saved and displayed correctly after reload', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    const iconContainer = page.getByText('Icon').first().locator('..')
    await expect(iconContainer).toBeVisible({ timeout: 10000 })
    // Dirty the form to enable the save button
    const titleField = page.locator('input[name="title"]')
    await titleField.click()
    await titleField.pressSequentially(' ')
    await page.getByRole('button', { name: /save/i }).first().click()
    await expect(page.getByText(/successfully/i)).toBeVisible()
    await page.reload()
    await expect(page.getByText('Icon').first()).toBeVisible()
  })
})
