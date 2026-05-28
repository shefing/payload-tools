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

export const geoUsers = {
  rangerA: {
    email: 'ranger-a@geo.dev',
    password: 'Password1!',
    apiKey: 'geo-ranger-a-api-key',
  },
  rangerB: {
    email: 'ranger-b@geo.dev',
    password: 'Password1!',
    apiKey: 'geo-ranger-b-api-key',
  },
  viewer: {
    email: 'viewer@geos.dev',
    password: 'Password1!',
    apiKey: 'geo-viewer-api-key',
  },
}

export const seed = async (payload: Payload) => {
  // ── Env guard ───────────────────────────────────────────────────────────────
  // The admin user's API key is sourced from AUTOMATION_SEED_API_KEY. If it's
  // missing, the seed would silently write `undefined` and all E2E tests that
  // authenticate as admin would fail with confusing 401s. Fail loudly instead.
  if (!process.env.AUTOMATION_SEED_API_KEY) {
    throw new Error(
      'AUTOMATION_SEED_API_KEY is not set. The seed step requires this env var to provision the admin API key. ' +
        'Set it locally (e.g. `AUTOMATION_SEED_API_KEY=admin-automation-key pnpm dev`) and configure it as a CI secret.',
    )
  }

  // ── Roles ───────────────────────────────────────────────────────────────────
  let adminRoleId: string | undefined
  let editorRoleId: string | undefined
  let rangerRoleId: string | undefined
  let viewerRoleId: string | undefined
  const editorPermissions: RolePermissions = [
    { entity: ['articles', 'pages'], type: ['read', 'write', 'publish'] },
  ]
  const viewerPermissions: RolePermissions = [{ entity: ['articles', 'pages', 'posts'], type: ['read'] }]
  const rangerPermissions: RolePermissions = [
    { entity: ['posts'], type: ['read', 'write', 'publish'] },
  ]
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
    const viewerRole = await payload.create({
      collection: 'roles',
      overrideAccess: true,
      data: {
        name: 'viewer',
        permissions: viewerPermissions,
      },
    })
    viewerRoleId = String(viewerRole.id)
    const rangerRole = await payload.create({
      collection: 'roles',
      overrideAccess: true,
      data: {
        name: 'ranger',
        permissions: rangerPermissions,
      },
    })
    rangerRoleId = String(rangerRole.id)
    payload.logger.info('Seed: roles created')
  } else {
    const existing = await payload.find({
      collection: 'roles',
      where: { name: { in: ['admin', 'editor', 'viewer', 'ranger'] } },
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
        viewerRoleId = String(role.id)
        await payload.update({
          collection: 'roles',
          id: role.id,
          data: {
            permissions: viewerPermissions,
          },
          overrideAccess: true,
        })
      }

      if (role.name === 'ranger') {
        rangerRoleId = String(role.id)
        await payload.update({
          collection: 'roles',
          id: role.id,
          data: {
            permissions: rangerPermissions,
          },
          overrideAccess: true,
        })
      }
    }

    if (!rangerRoleId) {
      const rangerRole = await payload.create({
        collection: 'roles',
        overrideAccess: true,
        data: { name: 'ranger', permissions: rangerPermissions },
      })
      rangerRoleId = String(rangerRole.id)
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

  // ── Geos ─────────────────────────────────────────────────────────────────────
  const geoIds: Record<string, string> = {}
  for (const name of ['geo-a', 'geo-b']) {
    const existingGeo = await payload.find({
      collection: 'geos',
      where: { name: { equals: name } },
      limit: 1,
      overrideAccess: true,
    })

    if (existingGeo.docs.length) {
      geoIds[name] = String(existingGeo.docs[0].id)
      continue
    }

    const geo = await payload.create({
      collection: 'geos',
      data: { name },
      overrideAccess: true,
    })
    geoIds[name] = String(geo.id)
  }

  // ── Geo users (ranger / viewer) ───────────────────────────────────────────
  const geoUserSpecs = [
    {
      user: geoUsers.rangerA,
      roleId: rangerRoleId,
      geos: [geoIds['geo-a']],
    },
    {
      user: geoUsers.rangerB,
      roleId: rangerRoleId,
      geos: [geoIds['geo-b']],
    },
    {
      user: geoUsers.viewer,
      roleId: viewerRoleId,
      geos: [geoIds['geo-a'], geoIds['geo-b']],
    },
  ] as const

  for (const spec of geoUserSpecs) {
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: spec.user.email } },
      limit: 1,
      overrideAccess: true,
    })

    const userData = {
      email: spec.user.email,
      password: spec.user.password,
      enableAPIKey: true,
      apiKey: spec.user.apiKey,
      isAdmin: false,
      userRoles: spec.roleId ? [spec.roleId] : [],
      geos: [...spec.geos],
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
        where: { email: { equals: spec.user.email } },
        overrideAccess: true,
      })
    }
  }

  // ── Sample posts (one per geo) ───────────────────────────────────────────────
  const seedPosts = [
    { title: 'Geo A Post', geo: geoIds['geo-a'], content: 'Post visible to everyone, editable by geo-a rangers.' },
    { title: 'Geo B Post', geo: geoIds['geo-b'], content: 'Post visible to everyone, editable by geo-b rangers.' },
  ]
  for (const postData of seedPosts) {
    const existing = await payload.find({
      collection: 'posts',
      where: { title: { equals: postData.title } },
      limit: 1,
      overrideAccess: true,
    })
    if (!existing.totalDocs) {
      await payload.create({ collection: 'posts', overrideAccess: true, data: postData })
      payload.logger.info(`Seed: created post "${postData.title}"`)
    }
  }
  payload.logger.info('Seed: sample posts checked')

  // ── Sample pages (exercises quickfilter, reset-list-view, right-panel) ──────
  const { totalDocs: pageCount } = await payload.count({ collection: 'pages', overrideAccess: true })
  if (!pageCount) {
    const pageSeeds: Array<{ title: string; status: 'draft' | 'published' | 'archived' }> = [
      { title: 'Home', status: 'published' },
      { title: 'About', status: 'published' },
      { title: 'Contact', status: 'draft' },
      { title: 'Blog', status: 'archived' },
    ]
    for (const { title, status } of pageSeeds) {
      await payload.create({
        collection: 'pages',
        data: { title, status, tenant: tenantIds['tenant-a'] },
        overrideAccess: true,
      })
    }
    payload.logger.info('Seed: sample pages created')
  }
}
