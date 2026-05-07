import { describe, expect, it } from 'vitest'

import type { Config } from 'payload'

import { changesButtonPlugin } from './ChangesButtonPlugin.js'

/**
 * These tests exercise the plugin factory in isolation — they do NOT spin up
 * Payload. We rely on the public typing of `Config` and check structural
 * mutations performed by `changesButtonPlugin`.
 *
 * Server-function registration is handled by the consumer in
 * `(payload)/layout.tsx` via `wrapServerFunctions(...)` until Payload PR-B
 * lands in a release. The plugin factory itself no longer touches
 * `config.admin.serverFunctions`, so those assertions are gone.
 */
type CollectionLike = {
  slug: string
  fields: unknown[]
  versions?: { drafts?: boolean | object }
  admin?: {
    components?: {
      edit?: { beforeDocumentControls?: Array<{ path: string }> }
    }
  }
}

const makeCollection = (slug: string, drafts: boolean): CollectionLike => ({
  slug,
  fields: [],
  versions: drafts ? { drafts: true } : undefined,
})

const CHANGES_PATH = '@shefing/changes-button/client#ChangesButton'

const beforeControls = (entity: CollectionLike) =>
  entity.admin?.components?.edit?.beforeDocumentControls

describe('changesButtonPlugin', () => {
  it('injects the ChangesButton into drafts-enabled collections', () => {
    const config = {
      collections: [makeCollection('posts', true), makeCollection('logs', false)],
    } as unknown as Config

    const out = changesButtonPlugin()(config)
    const posts = out.collections![0] as unknown as CollectionLike
    const logs = out.collections![1] as unknown as CollectionLike

    expect(beforeControls(posts)).toEqual([{ path: CHANGES_PATH }])
    expect(beforeControls(logs)).toBeUndefined()
  })

  it('honors `excludedCollections`', () => {
    const config = {
      collections: [makeCollection('posts', true), makeCollection('pages', true)],
    } as unknown as Config

    const out = changesButtonPlugin({ excludedCollections: ['pages'] })(config)
    expect(beforeControls(out.collections![0] as unknown as CollectionLike)).toEqual([
      { path: CHANGES_PATH },
    ])
    expect(beforeControls(out.collections![1] as unknown as CollectionLike)).toBeUndefined()
  })

  it('injects the ChangesButton into drafts-enabled globals', () => {
    const config = {
      globals: [{ slug: 'header', fields: [], versions: { drafts: true } }],
    } as unknown as Config

    const out = changesButtonPlugin()(config)
    expect(beforeControls(out.globals![0] as unknown as CollectionLike)).toEqual([
      { path: CHANGES_PATH },
    ])
  })

  it('is idempotent — running the factory twice does not duplicate the button entry', () => {
    const factory = changesButtonPlugin()
    const config = { collections: [makeCollection('posts', true)] } as unknown as Config

    const once = factory(config)
    const twice = factory(once)
    expect(beforeControls(twice.collections![0] as unknown as CollectionLike)).toEqual([
      { path: CHANGES_PATH },
    ])
  })

  it('returns the config unchanged when `disabled: true`', () => {
    const config = { collections: [makeCollection('posts', true)] } as unknown as Config

    const out = changesButtonPlugin({ disabled: true })(config)
    expect(beforeControls(out.collections![0] as unknown as CollectionLike)).toBeUndefined()
  })
})
