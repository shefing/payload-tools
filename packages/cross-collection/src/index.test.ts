import { describe, it, expect } from 'vitest'
import CrossCollectionConfig, { ensurePath } from './index.js'

describe('ensurePath', () => {
  it('creates nested keys that do not exist', () => {
    const obj: any = {}
    const result = ensurePath(obj, ['a', 'b'])
    expect(obj.a.b).toEqual({})
    expect(result).toBe(obj.a.b)
  })

  it('does not overwrite existing values', () => {
    const obj: any = { a: { existing: true } }
    ensurePath(obj, ['a', 'b'])
    expect(obj.a.existing).toBe(true)
    expect(obj.a.b).toEqual({})
  })

  it('returns the leaf object so callers can assign to it', () => {
    const obj: any = {}
    const leaf = ensurePath(obj, ['x', 'y'])
    leaf.Component = 'MyComponent'
    expect(obj.x.y.Component).toBe('MyComponent')
  })

  describe('prototype pollution (CWE-1321)', () => {
    it('refuses a __proto__ segment and leaves Object.prototype untouched', () => {
      const obj: any = {}
      expect(() => ensurePath(obj, ['__proto__', 'polluted'])).toThrow(/unsafe path segment/)
      expect(({} as any).polluted).toBeUndefined()
      expect(Object.prototype).not.toHaveProperty('polluted')
    })

    it('refuses constructor and prototype segments', () => {
      expect(() => ensurePath({}, ['constructor', 'prototype', 'polluted'])).toThrow(
        /unsafe path segment/,
      )
      expect(() => ensurePath({}, ['prototype', 'polluted'])).toThrow(/unsafe path segment/)
      expect(({} as any).polluted).toBeUndefined()
    })

    it('refuses an unsafe segment nested deeper in the path', () => {
      const obj: any = {}
      expect(() => ensurePath(obj, ['a', 'b', '__proto__', 'polluted'])).toThrow(
        /unsafe path segment/,
      )
      expect(({} as any).polluted).toBeUndefined()
    })

    it('does not traverse into inherited properties', () => {
      const parent = { inherited: { secret: true } }
      const obj: any = Object.create(parent)
      const leaf = ensurePath(obj, ['inherited', 'child'])
      leaf.value = 1
      expect(Object.prototype.hasOwnProperty.call(obj, 'inherited')).toBe(true)
      expect(parent.inherited).not.toHaveProperty('child')
      expect(parent.inherited.secret).toBe(true)
    })
  })
})

describe('CrossCollectionConfig', () => {
  it('returns config unchanged when no collections or globals', () => {
    const config: any = { collections: [], globals: [] }
    const result = CrossCollectionConfig()(config)
    expect(result.collections).toEqual([])
    expect(result.globals).toEqual([])
  })

  it('applies customOverrides to all collections by default', () => {
    const MyComponent = () => null
    const config: any = {
      collections: [{ slug: 'articles', fields: [] }, { slug: 'pages', fields: [] }],
    }
    const result = CrossCollectionConfig({
      customOverrides: { 'admin.components.edit': MyComponent },
    })(config)
    expect(result.collections[0].admin.components.edit.Component).toBe(MyComponent)
    expect(result.collections[1].admin.components.edit.Component).toBe(MyComponent)
  })

  it('excludes specified collections from overrides', () => {
    const MyComponent = () => null
    const config: any = {
      collections: [{ slug: 'articles', fields: [] }, { slug: 'pages', fields: [] }],
    }
    const result = CrossCollectionConfig({
      excludedCollections: ['pages'],
      customOverrides: { 'admin.components.edit': MyComponent },
    })(config)
    expect(result.collections[0].admin.components.edit.Component).toBe(MyComponent)
    expect(result.collections[1].admin).toBeUndefined()
  })

  it('applies customOverrides to globals', () => {
    const MyComponent = () => null
    const config: any = {
      globals: [{ slug: 'settings', fields: [] }],
    }
    const result = CrossCollectionConfig({
      customOverrides: { 'admin.components.edit': MyComponent },
    })(config)
    expect(result.globals[0].admin.components.edit.Component).toBe(MyComponent)
  })

  it('excludes specified globals from overrides', () => {
    const MyComponent = () => null
    const config: any = {
      globals: [{ slug: 'settings', fields: [] }, { slug: 'nav', fields: [] }],
    }
    const result = CrossCollectionConfig({
      excludedGlobals: ['nav'],
      customOverrides: { 'admin.components.edit': MyComponent },
    })(config)
    expect(result.globals[0].admin.components.edit.Component).toBe(MyComponent)
    expect(result.globals[1].admin).toBeUndefined()
  })

  it('handles missing collections gracefully', () => {
    const config: any = { globals: [] }
    expect(() => CrossCollectionConfig()(config)).not.toThrow()
  })

  it('handles missing globals gracefully', () => {
    const config: any = { collections: [] }
    expect(() => CrossCollectionConfig()(config)).not.toThrow()
  })

  it('uses empty defaults when no pluginConfig is provided', () => {
    const config: any = { collections: [{ slug: 'articles', fields: [] }] }
    const result = CrossCollectionConfig()(config)
    expect(result.collections[0].admin).toBeUndefined()
  })
})
