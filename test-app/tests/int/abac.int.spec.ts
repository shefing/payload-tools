import { createLocalReq, getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { beforeAll, describe, expect, it } from 'vitest'

import { adminUser, tenantUsers } from '@/seed'

let payload: Payload
let payloadConfig: Awaited<typeof config>

const findUserByEmail = async (email: string) => {
  const result = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })

  return result.docs[0]
}

const findArticleByTitle = async (title: string) => {
  const result = await payload.find({
    collection: 'articles',
    where: { title: { equals: title } },
    limit: 1,
    overrideAccess: true,
  })

  return result.docs[0]
}

const getArticlesCollection = () => {
  return payloadConfig.collections?.find((collection) => collection.slug === 'articles')
}

const createReqForUser = async (user: Record<string, any>, urlSuffix = '') => {
  const req = await createLocalReq({ user, urlSuffix }, payload)

  req.user = user
  req.payload = payload

  if (req.url) {
    req.searchParams = new URL(req.url).searchParams
  }

  return req
}

describe('ABAC integration', () => {
  beforeAll(async () => {
    payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('scopes article reads to the current tenant', async () => {
    const alice = await findUserByEmail(tenantUsers.alice.email)
    const req = await createReqForUser(alice)
    const articlesCollection = getArticlesCollection()

    expect(articlesCollection).toBeDefined()

    const rolesCheck = await payload.find({
      collection: 'roles',
      where: {
        id: {
          in: alice.userRoles.map((role: { id: string }) => role.id),
        },
      },
      overrideAccess: true,
    })

    expect(rolesCheck.docs.length).toBeGreaterThan(0)

    await expect(articlesCollection!.access!.read!({ req })).resolves.toEqual({
      tenant: { equals: String(alice.tenant.id) },
    })
  })

  it('rejects cross-tenant creates', async () => {
    const alice = await findUserByEmail(tenantUsers.alice.email)
    const tenantBArticle = await findArticleByTitle('Tenant B Article')
    const req = await createReqForUser(alice)
    const articlesCollection = getArticlesCollection()

    expect(articlesCollection).toBeDefined()

    await expect(
      articlesCollection!.access!.create!({
        req,
        data: {
          title: 'Cross Tenant Create',
          tenant: tenantBArticle.tenant.id,
        },
      }),
    ).resolves.toBe(false)
  })

  it('stamps the tenant on create when omitted', async () => {
    const alice = await findUserByEmail(tenantUsers.alice.email)
    const req = await createReqForUser(alice)
    const articlesCollection = getArticlesCollection()

    expect(articlesCollection).toBeDefined()

    const beforeChangeResult = await articlesCollection!.hooks.beforeChange?.[0]({
      req,
      operation: 'create',
      data: {
        title: `Stamped Tenant Article ${Date.now()}`,
      },
    })

    expect(beforeChangeResult).toMatchObject({
      tenant: String(alice.tenant.id),
    })
  })

  it('returns permissions through the endpoint handler', async () => {
    const alice = await findUserByEmail(tenantUsers.alice.email)
    const req = await createReqForUser(alice, '/api/me/permissions?collection=articles')

    const endpoint = payloadConfig.endpoints?.find((entry) => entry.path === '/me/permissions')

    expect(endpoint).toBeDefined()

    const response = await endpoint!.handler(req)

    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.collection).toBe('articles')
    expect(body.where).toBeTruthy()
    expect(body.actions).toContain('read')
  })

  it('does not constrain admins', async () => {
    const admin = await findUserByEmail(adminUser.email)
    const req = await createReqForUser(admin)
    const articlesCollection = getArticlesCollection()

    expect(articlesCollection).toBeDefined()

    await expect(articlesCollection!.access!.read!({ req })).resolves.toBe(true)
  })
})