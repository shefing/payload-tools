import { test } from '@playwright/test'
import { login } from './helpers'

test('dump articles list', async ({ page }) => {
  await login(page)
  await page.goto('/admin/collections/articles')
  await page.waitForTimeout(3000)
  const links = await page.getByRole('link').allTextContents()
  process.stdout.write('LINKS: ' + JSON.stringify(links) + '\n')
  const cells = await page.locator('td').allTextContents()
  process.stdout.write('CELLS: ' + JSON.stringify(cells.slice(0, 20)) + '\n')
})
