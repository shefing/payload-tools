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
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('shows error on wrong password', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByLabel('Email Address').fill(adminUser.email)
    await page.getByLabel('Password').fill('wrong-password')
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page.getByText(/invalid/i)).toBeVisible()
  })
})
