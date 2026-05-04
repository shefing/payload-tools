import { type Page } from '@playwright/test'

export const adminUser = {
  email: 'admin@payload-tools.dev',
  password: 'Password1!',
}

/**
 * Log in to the Payload admin panel and wait for the dashboard.
 */
export async function login(page: Page) {
  await page.goto('/admin/login')
  await page.getByLabel('Email Address').fill(adminUser.email)
  await page.getByLabel('Password').fill(adminUser.password)
  await page.getByRole('button', { name: /log in/i }).click()
  await page.waitForURL('**/admin**')
  // Wait until the nav is visible — confirms successful login
  await page.getByRole('navigation').waitFor()
}
