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
})
