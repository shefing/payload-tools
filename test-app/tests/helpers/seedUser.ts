import { request as playwrightRequest } from '@playwright/test'

const SERVER_URL = 'http://localhost:3000'

const adminUser = {
  email: 'admin@payload-tools.dev',
  password: 'Password1!',
}

export const testUser = {
  email: 'dev@payloadcms.com',
  password: 'test',
}

async function getAdminToken(): Promise<string> {
  const apiKey = process.env.AUTOMATION_SEED_API_KEY || '3dbb49cb-ce8f-4032-a3df-4ed088d4234c'
  return `users API-Key ${apiKey}`
}

/**
 * Seeds a test user for e2e admin tests via REST API.
 */
export async function seedTestUser(): Promise<void> {
  const context = await playwrightRequest.newContext({ baseURL: SERVER_URL })
  const token = await getAdminToken()

  // Find and delete existing test user if any
  const findRes = await context.get(`/api/users?where[email][equals]=${encodeURIComponent(testUser.email)}&limit=10`, {
    headers: { Authorization: token },
  })
  const findBody = await findRes.json()
  for (const doc of findBody?.docs ?? []) {
    await context.delete(`/api/users/${doc.id}`, {
      headers: { Authorization: token },
    })
  }

  // Create fresh test user
  const createRes = await context.post('/api/users', {
    headers: { Authorization: token },
    data: testUser,
  })
  if (!createRes.ok()) {
    const body = await createRes.json()
    throw new Error(`Failed to create test user: ${JSON.stringify(body)}`)
  }

  await context.dispose()
}

/**
 * Cleans up test user after tests via REST API.
 */
export async function cleanupTestUser(): Promise<void> {
  const context = await playwrightRequest.newContext({ baseURL: SERVER_URL })
  const token = await getAdminToken()

  const findRes = await context.get(`/api/users?where[email][equals]=${encodeURIComponent(testUser.email)}&limit=10`, {
    headers: { Authorization: token },
  })
  const findBody = await findRes.json()
  for (const doc of findBody?.docs ?? []) {
    await context.delete(`/api/users/${doc.id}`, {
      headers: { Authorization: token },
    })
  }

  await context.dispose()
}
