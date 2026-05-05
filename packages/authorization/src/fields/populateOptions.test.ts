import { describe, it, expect } from 'vitest'
import { populateOptions } from './populateOptions.js'

describe('populateOptions', () => {
  const entities = [
    { label: 'Articles', value: 'articles' },
    { label: 'Pages', value: 'pages' },
  ]

  it('sets options on a flat entity select field', () => {
    const fields: any[] = [{ name: 'entity', type: 'select', options: [] }]
    populateOptions(fields, entities)
    expect(fields[0].options).toEqual(entities)
  })

  it('sets options on a nested entity field inside a group', () => {
    const fields: any[] = [
      {
        name: 'permissions',
        type: 'array',
        fields: [{ name: 'entity', type: 'select', options: [] }],
      },
    ]
    populateOptions(fields, entities)
    expect(fields[0].fields[0].options).toEqual(entities)
  })

  it('sets options on entity fields inside tabs', () => {
    const fields: any[] = [
      {
        type: 'tabs',
        tabs: [
          {
            fields: [{ name: 'entity', type: 'select', options: [] }],
          },
        ],
      },
    ]
    populateOptions(fields, entities)
    expect(fields[0].tabs[0].fields[0].options).toEqual(entities)
  })

  it('does not modify fields that are not named entity', () => {
    const fields: any[] = [{ name: 'title', type: 'text' }]
    populateOptions(fields, entities)
    expect((fields[0] as any).options).toBeUndefined()
  })

  it('handles empty fields array without error', () => {
    expect(() => populateOptions([], entities)).not.toThrow()
  })
})
