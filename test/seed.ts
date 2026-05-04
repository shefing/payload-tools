import type { Payload } from 'payload'

export const adminUser = {
  email: 'admin@payload-tools.dev',
  password: 'Password1!',
}

export const seed = async (payload: Payload) => {
  // ── Admin user ──────────────────────────────────────────────────────────────
  const { totalDocs: userCount } = await payload.count({
    collection: 'users',
    where: { email: { equals: adminUser.email } },
  })
  if (!userCount) {
    await payload.create({
      collection: 'users',
      data: {
        ...adminUser,
        roles: [],
      },
    })
    payload.logger.info('Seed: admin user created')
  }

  // ── Sample articles (exercises color-picker, icon-select) ───────────────────
  const { totalDocs: articleCount } = await payload.count({ collection: 'articles' })
  if (!articleCount) {
    await payload.create({
      collection: 'articles',
      data: {
        title: 'Hello World',
        textColor: 'blue-500',
        bgColor: 'gray-100',
        icon: 'star',
        _status: 'published',
      },
    })
    await payload.create({
      collection: 'articles',
      data: {
        title: 'Second Article',
        textColor: 'red-600',
        bgColor: 'white',
        icon: 'heart',
        _status: 'draft',
      },
    })
    payload.logger.info('Seed: sample articles created')
  }

  // ── Sample pages (exercises quickfilter, reset-list-view, right-panel) ──────
  const { totalDocs: pageCount } = await payload.count({ collection: 'pages' })
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
      })
    }
    payload.logger.info('Seed: sample pages created')
  }
}
