import { describe, it, expect } from 'vitest'
import { parseColumns } from './layout-helpers.js'

describe('parseColumns', () => {
  it('returns array as-is', () => {
    expect(parseColumns(['title', 'slug'])).toEqual(['title', 'slug'])
  })

  it('parses a JSON-encoded array string', () => {
    expect(parseColumns('["title","slug"]')).toEqual(['title', 'slug'])
  })

  it('handles a plain string column accessor (e.g. from old URL ?columns=title)', () => {
    expect(parseColumns('title')).toEqual(['title'])
  })

  it('returns empty array for empty string', () => {
    expect(parseColumns('')).toEqual([])
  })

  it('returns empty array for whitespace-only string', () => {
    expect(parseColumns('   ')).toEqual([])
  })

  it('returns empty array for non-string, non-array input', () => {
    expect(parseColumns(null)).toEqual([])
    expect(parseColumns(undefined)).toEqual([])
    expect(parseColumns(42)).toEqual([])
  })

  it('handles URL-decoded JSON array', () => {
    const decoded = decodeURIComponent('%5B%22title%22%2C%22slug%22%5D')
    expect(parseColumns(decoded)).toEqual(['title', 'slug'])
  })
})
