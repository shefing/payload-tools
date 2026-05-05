import { describe, it, expect } from 'vitest'
import { CollectionResetPreferencesPlugin } from './index.js'

const RESET_BUTTON_PATH = '@shefing/reset-list-view/ResetListViewButton#ResetListViewButton'

function makeConfig(collections: any[] = [], extra: any = {}) {
  return { collections, ...extra } as any
}

describe('CollectionResetPreferencesPlugin', () => {
  it('returns config unchanged when disabled', () => {
    const config = makeConfig([{ slug: 'articles', fields: [] }])
    const result = CollectionResetPreferencesPlugin({ disabled: true })(config)
    expect(result).toBe(config)
  })

  it('initializes collections array when missing', () => {
    const config: any = {}
    const result = CollectionResetPreferencesPlugin({})(config)
    expect(Array.isArray(result.collections)).toBe(true)
  })

  it('adds reset button to all collections by default', () => {
    const config = makeConfig([
      { slug: 'articles', fields: [] },
      { slug: 'pages', fields: [] },
    ])
    const result = CollectionResetPreferencesPlugin({})(config)
    for (const col of result.collections) {
      const items = col.admin.components.listMenuItems
      expect(items.some((i: any) => i.path === RESET_BUTTON_PATH)).toBe(true)
    }
  })

  it('adds reset button only to includedCollections', () => {
    const config = makeConfig([
      { slug: 'articles', fields: [] },
      { slug: 'pages', fields: [] },
    ])
    const result = CollectionResetPreferencesPlugin({ includedCollections: ['articles'] })(config)
    const articles = result.collections.find((c: any) => c.slug === 'articles')
    const pages = result.collections.find((c: any) => c.slug === 'pages')
    expect(articles.admin.components.listMenuItems.some((i: any) => i.path === RESET_BUTTON_PATH)).toBe(true)
    expect(pages.admin).toBeUndefined()
  })

  it('skips excludedCollections', () => {
    const config = makeConfig([
      { slug: 'articles', fields: [] },
      { slug: 'pages', fields: [] },
    ])
    const result = CollectionResetPreferencesPlugin({ excludedCollections: ['pages'] })(config)
    const articles = result.collections.find((c: any) => c.slug === 'articles')
    const pages = result.collections.find((c: any) => c.slug === 'pages')
    expect(articles.admin.components.listMenuItems.some((i: any) => i.path === RESET_BUTTON_PATH)).toBe(true)
    expect(pages.admin).toBeUndefined()
  })

  it('passes the correct slug as clientProps', () => {
    const config = makeConfig([{ slug: 'articles', fields: [] }])
    const result = CollectionResetPreferencesPlugin({})(config)
    const items = result.collections[0].admin.components.listMenuItems
    const btn = items.find((i: any) => i.path === RESET_BUTTON_PATH)
    expect(btn.clientProps.slug).toBe('articles')
  })

  it('appends to existing listMenuItems array', () => {
    const existingItem = { path: 'some/other/component' }
    const config = makeConfig([
      {
        slug: 'articles',
        fields: [],
        admin: { components: { listMenuItems: [existingItem] } },
      },
    ])
    const result = CollectionResetPreferencesPlugin({})(config)
    const items = result.collections[0].admin.components.listMenuItems
    expect(items).toHaveLength(2)
    expect(items[0]).toBe(existingItem)
    expect(items[1].path).toBe(RESET_BUTTON_PATH)
  })

  it('converts non-array listMenuItems to array before appending', () => {
    const existingItem = { path: 'some/other/component' }
    const config = makeConfig([
      {
        slug: 'articles',
        fields: [],
        admin: { components: { listMenuItems: existingItem } },
      },
    ])
    const result = CollectionResetPreferencesPlugin({})(config)
    const items = result.collections[0].admin.components.listMenuItems
    expect(Array.isArray(items)).toBe(true)
    expect(items).toHaveLength(2)
  })
})
