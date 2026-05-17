import type { Payload } from 'payload'

import type { RolePermissions } from './payload-types'

export const adminUser = {
  email: 'admin@payload-tools.dev',
  password: 'Password1!',
}

export const tenantUsers = {
  alice: {
    email: 'alice@tenant-a.dev',
    password: 'Password1!',
    apiKey: 'tenant-a-api-key',
  },
  bob: {
    email: 'bob@tenant-b.dev',
    password: 'Password1!',
    apiKey: 'tenant-b-api-key',
  },
}

export const seed = async (payload: Payload) => {
  // ── Roles ───────────────────────────────────────────────────────────────────
  let adminRoleId: string | undefined
  let editorRoleId: string | undefined
  const editorPermissions: RolePermissions = [
    { entity: ['articles', 'pages'], type: ['read', 'write', 'publish'] },
  ]
  const viewerPermissions: RolePermissions = [{ entity: ['articles', 'pages'], type: ['read'] }]
  const { totalDocs: roleCount } = await payload.count({ collection: 'roles', overrideAccess: true })
  if (!roleCount) {
    const adminRole = await payload.create({
      collection: 'roles',
      data: { name: 'admin' },
      overrideAccess: true,
    })
    adminRoleId = String(adminRole.id)
    const editorRole = await payload.create({
      collection: 'roles',
      overrideAccess: true,
      data: {
        name: 'editor',
        permissions: editorPermissions,
      },
    })
    editorRoleId = String(editorRole.id)
    await payload.create({
      collection: 'roles',
      overrideAccess: true,
      data: {
        name: 'viewer',
        permissions: viewerPermissions,
      },
    })
    payload.logger.info('Seed: roles created')
  } else {
    const existing = await payload.find({
      collection: 'roles',
      where: { name: { in: ['admin', 'editor', 'viewer'] } },
      limit: 10,
      overrideAccess: true,
    })

    for (const role of existing.docs) {
      if (role.name === 'admin') {
        adminRoleId = String(role.id)
      }

      if (role.name === 'editor') {
        editorRoleId = String(role.id)

        await payload.update({
          collection: 'roles',
          id: role.id,
          data: {
            permissions: editorPermissions,
          },
          overrideAccess: true,
        })
      }

      if (role.name === 'viewer') {
        await payload.update({
          collection: 'roles',
          id: role.id,
          data: {
            permissions: viewerPermissions,
          },
          overrideAccess: true,
        })
      }
    }
  }

  // ── Tenants ─────────────────────────────────────────────────────────────────
  const tenantIds: Record<string, string> = {}

  for (const name of ['tenant-a', 'tenant-b']) {
    const existingTenant = await payload.find({
      collection: 'tenants',
      where: { name: { equals: name } },
      limit: 1,
      overrideAccess: true,
    })

    if (existingTenant.docs.length) {
      tenantIds[name] = String(existingTenant.docs[0].id)
      continue
    }

    const tenant = await payload.create({
      collection: 'tenants',
      data: { name },
      overrideAccess: true,
    })

    tenantIds[name] = String(tenant.id)
  }

  // ── Admin user ──────────────────────────────────────────────────────────────
  const { totalDocs: userCount } = await payload.count({
    collection: 'users',
    where: { email: { equals: adminUser.email } },
    overrideAccess: true,
  })
  if (!userCount) {
    await payload.create({
      collection: 'users',
      data: {
        ...adminUser,
        isAdmin: true,
        userRoles: adminRoleId ? [adminRoleId] : [],
        enableAPIKey: true,
        apiKey: process.env.AUTOMATION_SEED_API_KEY,
      },
      overrideAccess: true,
    })
    payload.logger.info('Seed: admin user created')
  } else {
    await payload.update({
      collection: 'users',
      data: {
        isAdmin: true,
        userRoles: adminRoleId ? [adminRoleId] : [],
        enableAPIKey: true,
        apiKey: process.env.AUTOMATION_SEED_API_KEY,
      },
      where: { email: { equals: adminUser.email } },
      overrideAccess: true,
    })
  }

  // ── Tenant users ────────────────────────────────────────────────────────────
  for (const [tenantName, user] of [
    ['tenant-a', tenantUsers.alice],
    ['tenant-b', tenantUsers.bob],
  ] as const) {
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: user.email } },
      limit: 1,
      overrideAccess: true,
    })

    const userData = {
      email: user.email,
      password: user.password,
      enableAPIKey: true,
      apiKey: user.apiKey,
      isAdmin: false,
      userRoles: editorRoleId ? [editorRoleId] : [],
      tenant: tenantIds[tenantName],
    }

    if (!existing.docs.length) {
      await payload.create({
        collection: 'users',
        data: userData,
        overrideAccess: true,
      })
    } else {
      await payload.update({
        collection: 'users',
        data: userData,
        where: { email: { equals: user.email } },
        overrideAccess: true,
      })
    }
  }

  // ── Sample articles (exercises color-picker, icon-select) ───────────────────
  // Only create seed articles if they don't already exist (avoid wiping E2E test data)
  const seedArticles = [
    { title: 'Hello World', textColor: 'blue-500', bgColor: 'gray-100', icon: 'star', _status: 'published' as const },
    { title: 'Second Article', textColor: 'red-600', bgColor: 'white', icon: 'heart', _status: 'draft' as const },
    {
      title: 'Tenant A Article',
      textColor: 'green-500',
      bgColor: 'gray-100',
      icon: 'star',
      tenant: tenantIds['tenant-a'],
      _status: 'published' as const,
    },
    {
      title: 'Tenant B Article',
      textColor: 'purple-500',
      bgColor: 'white',
      icon: 'heart',
      tenant: tenantIds['tenant-b'],
      _status: 'published' as const,
    },
  ]
  for (const articleData of seedArticles) {
    const existing = await payload.find({
      collection: 'articles',
      where: { title: { equals: articleData.title } },
      limit: 1,
      overrideAccess: true,
    })
    if (!existing.totalDocs) {
      await payload.create({ collection: 'articles', overrideAccess: true, data: articleData })
      payload.logger.info(`Seed: created article "${articleData.title}"`)
    }
  }
  payload.logger.info('Seed: sample articles checked')

  // ── Sample pages (exercises quickfilter, reset-list-view, right-panel) ──────
  const { totalDocs: pageCount } = await payload.count({ collection: 'pages', overrideAccess: true })
  if (!pageCount) {
    for (const [title, status] of [
      ['Home', 'published'],
      ['About', 'published'],
      ['Contact', 'draft'],
      ['Blog', 'archived'],
    ] as const) {
      await payload.create({
        collection: 'pages',
        data: { title, status },
        overrideAccess: true,
      })
    }
    payload.logger.info('Seed: sample pages created')
  }
}
