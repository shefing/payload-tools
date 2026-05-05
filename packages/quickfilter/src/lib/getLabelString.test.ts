import { describe, it, expect } from 'vitest'
import { getLabelString } from './getLabelString.js'

describe('getLabelString (quickfilter)', () => {
  it('returns the string as-is when label is a plain string', () => {
    expect(getLabelString('Status', 'status')).toBe('Status')
  })

  it('returns the first value when label is an i18n object', () => {
    expect(getLabelString({ en: 'Status', fr: 'Statut' }, 'status')).toBe('Status')
  })

  it('returns fallback when label is false', () => {
    expect(getLabelString(false, 'fieldName')).toBe('fieldName')
  })

  it('returns fallback when label is undefined', () => {
    expect(getLabelString(undefined, 'fieldName')).toBe('fieldName')
  })

  it('returns fallback for an empty i18n object', () => {
    expect(getLabelString({}, 'fieldName')).toBe('fieldName')
  })

  it('uses fieldName as fallback (mimics processNavGroups usage)', () => {
    expect(getLabelString(undefined, 'createdAt')).toBe('createdAt')
  })
})
