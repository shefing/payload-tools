import { test, expect } from '@playwright/test'
import { login, adminUser } from './helpers'

test.describe('addAccess plugin (@shefing/authorization)', () => {
  test('unauthenticated requests to protected collections return 403', async ({ request }) => {
    const res = await request.get('/api/articles')
    expect(res.status()).toBe(403)
  })

  test('authenticated admin can read articles collection', async ({ request }) => {
    // Log in via REST to get a token
    const loginRes = await request.post('/api/users/login', {
      data: { email: adminUser.email, password: adminUser.password },
    })
    expect(loginRes.ok()).toBeTruthy()
    const { token } = await loginRes.json()

    const res = await request.get('/api/articles', {
      headers: { Authorization: `JWT ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.docs).toBeDefined()
  })

  test('authenticated admin can read pages collection', async ({ request }) => {
    const loginRes = await request.post('/api/users/login', {
      data: { email: adminUser.email, password: adminUser.password },
    })
    const { token } = await loginRes.json()

    const res = await request.get('/api/pages', {
      headers: { Authorization: `JWT ${token}` },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.docs).toBeDefined()
  })

  test('access control is not applied to unprotected collections (media)', async ({ request }) => {
    // media collection has access: { read: () => true } and is excluded from addAccess
    const res = await request.get('/api/media')
    expect(res.status()).toBe(200)
  })
})
