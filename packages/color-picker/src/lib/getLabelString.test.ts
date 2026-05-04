import { describe, it, expect } from 'vitest'
import { getLabelString } from './getLabelString.js'

describe('getLabelString', () => {
  it('returns the string as-is when label is a plain string', () => {
    expect(getLabelString('My Color')).toBe('My Color')
  })

  it('returns the first value when label is an i18n object', () => {
    expect(getLabelString({ en: 'Color', fr: 'Couleur' })).toBe('Color')
  })

  it('returns fallback when label is false', () => {
    expect(getLabelString(false)).toBe('Color')
  })

  it('returns fallback when label is undefined', () => {
    expect(getLabelString(undefined)).toBe('Color')
  })

  it('uses a custom fallback when provided', () => {
    expect(getLabelString(undefined, 'Pick')).toBe('Pick')
  })

  it('returns fallback for an empty i18n object', () => {
    expect(getLabelString({})).toBe('Color')
  })
})
