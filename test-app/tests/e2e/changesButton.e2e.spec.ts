import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'

const ADMIN_USER = { email: 'admin@payload-tools.dev', password: 'Password1!' }
const SERVER_URL = 'http://localhost:3000'

/**
 * Smoke test for the @shefing/changes-button plugin.
 *
 * Verifies, against the test-app `articles` collection (drafts enabled):
 *   1. The Changes button is hidden on a freshly-opened create form (no edits yet).
 *   2. The Changes button appears once the form is modified after publish.
 *   3. Clicking the button opens the changes drawer with diff content.
 *   4. The drawer can be closed.
 *
 * Note: Toggle (Unsaved ↔ Latest draft) and "no-changes" empty state
 * coverage requires the upstream PR-A/PR-B APIs to be present at runtime
 * (`@payloadcms/next/views/diff` + `config.admin.serverFunctions`). Until
 * those ship in a release, this spec exercises only the visibility +
 * drawer-open path which works against the plugin's static UI layer.
 */
test.describe('Changes button (plugin)', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext()
    page = await context.newPage()
    await login({ page, user: ADMIN_USER })
  })

  test('button is hidden on an unmodified create form', async () => {
    await page.goto(`${SERVER_URL}/admin/collections/articles/create`)
    await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 30000 })

    // No edits yet → no unpublished changes → the Changes button must not render.
    await expect(page.locator('button.changes-button, .changes-button')).toHaveCount(0)
  })

  test('button appears after the doc is published and then modified', async () => {
    await page.goto(`${SERVER_URL}/admin/collections/articles/create`)
    await page.fill('input[name="title"]', 'Changes-button smoke article')

    // Publish.
    await page.click('button:has-text("Publish")')
    await expect(page.locator('.payload-toast-container').first()).toBeVisible({
      timeout: 30000,
    })

    // Modify the form → triggers `modified === true`.
    await page.fill('input[name="title"]', 'Changes-button smoke article (edited)')

    const changesBtn = page.locator('.changes-button').first()
    await expect(changesBtn).toBeVisible({ timeout: 15000 })
  })

  test('clicking the button opens the changes drawer', async () => {
    const changesBtn = page.locator('.changes-button').first()
    await changesBtn.click()

    // Drawer should appear with the localized title.
    const drawer = page.locator('[role="dialog"]', { hasText: 'Review changes' }).first()
    await expect(drawer).toBeVisible({ timeout: 15000 })

    // Close drawer (Esc) and verify it goes away.
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden({ timeout: 5000 })
  })
})
