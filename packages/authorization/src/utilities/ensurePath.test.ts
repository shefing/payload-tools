import { describe, it, expect } from 'vitest'
import { ensurePath } from './ensurePath.js'

describe('ensurePath', () => {
  it('creates nested keys that do not exist', () => {
    const obj: any = {}
    const result = ensurePath(obj, ['a', 'b', 'c'])
    expect(obj.a.b.c).toEqual({})
    expect(result).toBe(obj.a.b.c)
  })

  it('does not overwrite existing nested objects', () => {
    const obj: any = { a: { b: { existing: true } } }
    ensurePath(obj, ['a', 'b', 'c'])
    expect(obj.a.b.existing).toBe(true)
    expect(obj.a.b.c).toEqual({})
  })

  it('returns the leaf object', () => {
    const obj: any = {}
    const leaf = ensurePath(obj, ['x', 'y'])
    leaf.value = 42
    expect(obj.x.y.value).toBe(42)
  })

  it('handles a single-element path', () => {
    const obj: any = {}
    ensurePath(obj, ['key'])
    expect(obj.key).toEqual({})
  })

  it('handles an empty path by returning the root object', () => {
    const obj: any = { root: true }
    const result = ensurePath(obj, [])
    expect(result).toBe(obj)
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
