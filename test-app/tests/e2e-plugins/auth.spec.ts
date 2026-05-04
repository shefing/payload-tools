import { test, expect } from '@playwright/test'
import { login, adminUser } from './helpers'

test.describe('Authentication', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('logs in with seeded admin credentials', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL(/\/admin/)
    await expect(page.getByRole('navigation').first()).toBeVisible()
  })

  test('shows error on wrong password', async ({ page }) => {
    await page.goto('/admin/login')
    await page.fill('input[type="email"]', adminUser.email)
    await page.fill('input[type="password"]', 'wrong-password')
    await page.locator('button[type="submit"]').click()
    await expect(page.getByText(/the email or password provided is incorrect/i)).toBeVisible()
  })
})
