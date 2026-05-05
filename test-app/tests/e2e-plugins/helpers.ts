import { type Page, type APIRequestContext } from '@playwright/test'

export const adminUser = {
  email: 'admin@payload-tools.dev',
  password: 'Password1!',
}

/**
 * Get the API Key auth header value (no network call needed).
 * The admin user is seeded with this key via seed.ts.
 */
export function getToken(_request?: APIRequestContext): Promise<string> {
  const apiKey = process.env.AUTOMATION_SEED_API_KEY || '3dbb49cb-ce8f-4032-a3df-4ed088d4234c'
  return Promise.resolve(`users API-Key ${apiKey}`)
}

/**
 * Create an article via the REST API and return its id.
 */
export async function createArticle(
  request: APIRequestContext,
  token: string,
  data: Record<string, unknown>,
): Promise<string> {
  const res = await request.post('/api/articles', {
    headers: { Authorization: token },
    data,
  })
  const body = await res.json()
  const id = body?.doc?.id
  if (!id) throw new Error(`Failed to create article: ${JSON.stringify(body)}`)
  return id
}

/**
 * Delete an article via the REST API.
 */
export async function deleteArticle(
  request: APIRequestContext,
  token: string,
  id: string,
): Promise<void> {
  await request.delete(`/api/articles/${id}`, {
    headers: { Authorization: token },
  })
}

/**
 * Navigate directly to the edit page of an article by id.
 * Always ensures the browser is logged in before navigating.
 */
export async function navigateToArticleById(page: Page, id: string) {
  const articleUrl = `/admin/collections/articles/${id}`

  // Always login first (login() is idempotent — skips if already authenticated)
  await login(page)

  await page.goto(articleUrl)
  await page.waitForLoadState('networkidle', { timeout: 20000 })

  // Wait for the title input — retry once with reload if not found
  const titleField = page.locator('input[name="title"]')
  const found = await titleField.waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false)
  if (!found) {
    await page.reload()
    await page.waitForLoadState('networkidle', { timeout: 20000 })
    await titleField.waitFor({ state: 'visible', timeout: 15000 })
  }
}

/**
 * Log in to the Payload admin panel via the login form.
 * If already logged in (redirected away from login), does nothing.
 */
export async function login(page: Page) {
  await page.goto('/admin/login')
  await page.waitForLoadState('domcontentloaded')

  // If already authenticated, Payload redirects away from /admin/login
  if (!page.url().includes('/admin/login')) return

  await page.fill('input[type="email"]', adminUser.email)
  await page.fill('input[type="password"]', adminUser.password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL((url) => !url.href.includes('/admin/login'), { timeout: 30000 })
  await page.waitForLoadState('domcontentloaded')
}

/**
 * Generate a random suffix to avoid test collisions.
 */
export function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8)
}
