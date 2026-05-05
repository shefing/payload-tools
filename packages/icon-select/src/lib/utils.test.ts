import { describe, it, expect } from 'vitest'
import { cn } from './utils.js'

describe('cn', () => {
  it('returns a single class name unchanged', () => {
    expect(cn('foo')).toBe('foo')
  })

  it('merges multiple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes (falsy values are ignored)', () => {
    expect(cn('foo', false && 'bar', undefined, null, 'baz')).toBe('foo baz')
  })

  it('deduplicates conflicting tailwind classes (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('merges tailwind utility conflicts correctly', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('returns empty string when no arguments provided', () => {
    expect(cn()).toBe('')
  })

  it('handles array-style clsx inputs', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })
})
