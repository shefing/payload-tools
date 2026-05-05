import { describe, it, expect } from 'vitest'
import { getLabelString } from './getLabelString.js'

describe('getLabelString (icon-select)', () => {
  it('returns the string as-is when label is a plain string', () => {
    expect(getLabelString('My Icon')).toBe('My Icon')
  })

  it('returns the first value when label is an i18n object', () => {
    expect(getLabelString({ en: 'Icon', fr: 'Icône' })).toBe('Icon')
  })

  it('returns fallback "Icon" when label is false', () => {
    expect(getLabelString(false)).toBe('Icon')
  })

  it('returns fallback "Icon" when label is undefined', () => {
    expect(getLabelString(undefined)).toBe('Icon')
  })

  it('uses a custom fallback when provided', () => {
    expect(getLabelString(undefined, 'Pick Icon')).toBe('Pick Icon')
  })

  it('returns fallback for an empty i18n object', () => {
    expect(getLabelString({})).toBe('Icon')
  })
})
