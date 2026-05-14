import { createLocalReq, getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { beforeAll, describe, expect, it } from 'vitest'

import { adminUser, tenantUsers } from '@/seed'
import type { User, Role, Tenant } from '@/payload-types'

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

const createReqForUser = async (user: User, urlSuffix = '') => {
  const req = await createLocalReq({ user, urlSuffix }, payload)

  req.user = user
  req.payload = payload

  if (req.url) {
    Object.defineProperty(req, 'searchParams', {
      value: new URL(req.url).searchParams,
      writable: true,
      configurable: true,
    })
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
          in: (alice.userRoles ?? []).map((role) =>
            typeof role === 'string' ? role : (role as Role).id,
          ),
        },
      },
      overrideAccess: true,
    })

    expect(rolesCheck.docs.length).toBeGreaterThan(0)

    const tenantId = alice.tenant && typeof alice.tenant !== 'string'
      ? (alice.tenant as Tenant).id
      : String(alice.tenant)

    await expect(articlesCollection!.access!.read!({ req })).resolves.toEqual({
      tenant: { equals: String(tenantId) },
    })
  })

  it('rejects cross-tenant creates', async () => {
    const alice = await findUserByEmail(tenantUsers.alice.email)
    const tenantBArticle = await findArticleByTitle('Tenant B Article')
    const req = await createReqForUser(alice)
    const articlesCollection = getArticlesCollection()

    expect(articlesCollection).toBeDefined()

    const articleTenantId =
      tenantBArticle.tenant && typeof tenantBArticle.tenant !== 'string'
        ? (tenantBArticle.tenant as Tenant).id
        : String(tenantBArticle.tenant)

    await expect(
      articlesCollection!.access!.create!({
        req,
        data: {
          title: 'Cross Tenant Create',
          tenant: articleTenantId,
        },
      } as any),
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
    } as any)

    const tenantId = alice.tenant && typeof alice.tenant !== 'string'
      ? (alice.tenant as Tenant).id
      : String(alice.tenant)

    expect(beforeChangeResult).toMatchObject({
      tenant: String(tenantId),
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
