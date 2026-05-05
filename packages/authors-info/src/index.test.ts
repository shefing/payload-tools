import { describe, it, expect } from 'vitest'
import type { Field } from 'payload'
import { addAuthorsFields } from './index.js'

// Helper: build a minimal Payload config with given collection fields
function makeConfig(fields: Field[]) {
  return {
    admin: { user: 'users' },
    collections: [
      {
        slug: 'articles',
        fields,
        versions: { drafts: false },
      },
    ],
  } as any
}

// Helper: run the plugin and return the processed fields
function processedFields(fields: Field[]) {
  const result = addAuthorsFields()(makeConfig(fields))
  return result.collections![0].fields
}

describe('addAuthorsFields – processFields (issue #79: id field must not be swallowed into a tab)', () => {
  it('does not move the id field into the Content tab', () => {
    const fields: Field[] = [
      { name: 'id', type: 'text' } as Field,
      { name: 'title', type: 'text' } as Field,
    ]
    const result = processedFields(fields)

    // The top-level result should contain a tabs field and the id field at the root
    const tabsField = result.find((f: Field) => f.type === 'tabs')
    expect(tabsField).toBeDefined()

    const idAtRoot = result.find((f: Field) => 'name' in f && (f as any).name === 'id')
    expect(idAtRoot).toBeDefined()

    // id must NOT appear inside any tab's fields
    const allTabFields = tabsField.tabs.flatMap((t: any) => t.fields ?? [])
    const idInTab = allTabFields.find((f: Field) => 'name' in f && (f as any).name === 'id')
    expect(idInTab).toBeUndefined()
  })

  it('does not move hidden fields into the Content tab', () => {
    const fields: Field[] = [
      { name: 'secret', type: 'text', admin: { hidden: true } } as Field,
      { name: 'title', type: 'text' } as Field,
    ]
    const result = processedFields(fields)

    const tabsField = result.find((f: Field) => f.type === 'tabs')
    expect(tabsField).toBeDefined()

    const hiddenAtRoot = result.find(
      (f: Field) => 'name' in f && (f as any).name === 'secret',
    )
    expect(hiddenAtRoot).toBeDefined()

    const allTabFields = tabsField.tabs.flatMap((t: any) => t.fields ?? [])
    const hiddenInTab = allTabFields.find((f: Field) => 'name' in f && (f as any).name === 'secret')
    expect(hiddenInTab).toBeUndefined()
  })

  it('does not treat a tabs field preceded only by id/hidden fields as the first eligible field', () => {
    // Before the fix, if fields[0] was 'id', the code would check fields[0].type == 'tabs'
    // which would be false, so it would wrap everything (including id) into a Content tab.
    // After the fix, the first *eligible* field is checked.
    const existingTab: Field = {
      type: 'tabs',
      tabs: [{ label: 'Main', fields: [{ name: 'title', type: 'text' } as Field] }],
    }
    const fields: Field[] = [
      { name: 'id', type: 'text' } as Field,
      existingTab,
    ]
    const result = processedFields(fields)

    // Should NOT create a new wrapping tabs field; instead the Author Data tab
    // should be pushed into the existing tabs field
    const tabsFields = result.filter((f: Field) => f.type === 'tabs')
    expect(tabsFields).toHaveLength(1)

    const tabs = tabsFields[0].tabs
    const authorTab = tabs.find((t: any) =>
      (typeof t.label === 'object' ? t.label.en : t.label) === 'Author Data',
    )
    expect(authorTab).toBeDefined()
  })

  it('places author fields into an Author Data tab', () => {
    const fields: Field[] = [{ name: 'title', type: 'text' } as Field]
    const result = processedFields(fields)

    const tabsField = result.find((f: Field) => f.type === 'tabs')
    expect(tabsField).toBeDefined()

    const authorTab = tabsField.tabs.find(
      (t: any) => (typeof t.label === 'object' ? t.label.en : t.label) === 'Author Data',
    )
    expect(authorTab).toBeDefined()

    const authorFieldNames = authorTab.fields.map((f: any) => f.name)
    expect(authorFieldNames).toContain('creator')
    expect(authorFieldNames).toContain('updator')
  })
})
