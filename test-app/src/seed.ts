import type { Payload } from 'payload'

export const adminUser = {
  email: 'admin@payload-tools.dev',
  password: 'Password1!',
}

export const seed = async (payload: Payload) => {
  // ── Roles ───────────────────────────────────────────────────────────────────
  let adminRoleId: string | undefined
  const { totalDocs: roleCount } = await payload.count({ collection: 'roles', overrideAccess: true })
  if (!roleCount) {
    const adminRole = await payload.create({
      collection: 'roles',
      data: { name: 'admin' },
      overrideAccess: true,
    })
    adminRoleId = String(adminRole.id)
    await payload.create({
      collection: 'roles',
      overrideAccess: true,
      data: {
        name: 'editor',
        permissions: [
          { entity: ['articles', 'pages'], type: ['read', 'write', 'publish'] },
        ],
      },
    })
    await payload.create({
      collection: 'roles',
      overrideAccess: true,
      data: {
        name: 'viewer',
        permissions: [
          { entity: ['articles', 'pages'], type: ['read'] },
        ],
      },
    })
    payload.logger.info('Seed: roles created')
  } else {
    const existing = await payload.find({
      collection: 'roles',
      where: { name: { equals: 'admin' } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs.length) adminRoleId = String(existing.docs[0].id)
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
        apiKey: '3dbb49cb-ce8f-4032-a3df-4ed088d4234c',
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
        apiKey: '3dbb49cb-ce8f-4032-a3df-4ed088d4234c',
      },
      where: { email: { equals: adminUser.email } },
      overrideAccess: true,
    })
  }

  // ── Sample articles (exercises color-picker, icon-select) ───────────────────
  // Only create seed articles if they don't already exist (avoid wiping E2E test data)
  const seedArticles = [
    { title: 'Hello World', textColor: 'blue-500', bgColor: 'gray-100', icon: 'star', _status: 'published' as const },
    { title: 'Second Article', textColor: 'red-600', bgColor: 'white', icon: 'heart', _status: 'draft' as const },
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
