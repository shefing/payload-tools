import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `renderChangesDiff.test.ts` exercises the high-level branching of
 * `renderChangesDiffHandler` without spinning up Payload.
 *
 * Covers the five use-cases from the bug report:
 *
 *   1. New collection doc (no `docID`) → safe no-op, no DiffCollapser crash.
 *   2. `fetchLatestVersion` is always called with `parentID: docID` (so we
 *      never accidentally compare against an unrelated doc's version).
 *   3. Drafts-enabled doc with no draft yet → safe no-op result.
 *   4. `hasChanges: false` when published === draft (saved doc with no
 *      pending changes — the button click flow already saved any edits).
 *   5. Always compares currently-published (LEFT) vs latest-draft (RIGHT);
 *      the response shape no longer carries a compare toggle.
 */

// ---- Module mocks (must be at top, before importing the SUT) ----------------

vi.mock('../vendor/diff/index.js', () => ({
  RenderDiff: (args: { versionFromSiblingData: object; versionToSiblingData: object }) =>
    ({ __diff: true, from: args.versionFromSiblingData, to: args.versionToSiblingData }) as unknown,
}))
vi.mock('../vendor/diff/utilities/countChangedFields.js', () => ({
  countChangedFields: (args: { valueFrom?: object; valueTo?: object }) => {
    const fromKeys = Object.keys(args.valueFrom ?? {})
    const toKeys = Object.keys(args.valueTo ?? {})
    const allKeys = new Set([...fromKeys, ...toKeys])
    let count = 0
    for (const k of allKeys) {
      if (
        (args.valueFrom as Record<string, unknown>)?.[k] !==
        (args.valueTo as Record<string, unknown>)?.[k]
      ) {
        count += 1
      }
    }
    return count
  },
}))
vi.mock('@payloadcms/ui/utilities/getClientConfig', () => ({
  getClientConfig: () => ({
    collections: [{ slug: 'posts', fields: [{ name: 'title', type: 'text' }] }],
    globals: [{ slug: 'site', fields: [{ name: 'title', type: 'text' }] }],
  }),
}))
vi.mock('@payloadcms/ui/utilities/getClientSchemaMap', () => ({
  getClientSchemaMap: () => new Map(),
}))
vi.mock('@payloadcms/ui/utilities/getSchemaMap', () => ({ getSchemaMap: () => new Map() }))

// `fetchLatestVersion` and `fetchCurrentlyPublishedDoc` are the only
// side-effecting helpers inside the SUT — mock them per-test to control the
// published / draft return values.
//
// To keep existing tests intact, by default `fetchCurrentlyPublishedDoc`
// delegates to `fetchLatestVersionMock({ status: 'published', ... })` — i.e.
// the LEFT side still resolves through the same mock that older tests already
// configure.
const fetchLatestVersionMock = vi.fn()
const fetchCurrentlyPublishedDocMock = vi.fn(async (args: { status?: string }) =>
  fetchLatestVersionMock({ ...args, status: 'published' }),
)
vi.mock('./fetchVersions.js', () => ({
  fetchCurrentlyPublishedDoc: (...args: unknown[]) =>
    (fetchCurrentlyPublishedDocMock as (...a: unknown[]) => unknown)(...args),
  fetchLatestVersion: (...args: unknown[]) => fetchLatestVersionMock(...args),
  fetchVersions: vi.fn(),
}))

// ---- Helpers ----------------------------------------------------------------

const makeReq = () =>
  ({
    headers: new Headers(),
    i18n: {},
    payload: {
      auth: vi.fn(async () => ({
        permissions: { collections: { posts: { fields: undefined } }, globals: { site: { fields: undefined } } },
      })),
      collections: { posts: { config: { fields: [{ name: 'title', type: 'text' }] } } },
      config: { localization: undefined },
      globals: { site: { config: { fields: [{ name: 'title', type: 'text' }] } } },
      importMap: {},
      logger: { error: vi.fn() },
    },
    user: undefined,
  }) as unknown as Parameters<
    Awaited<typeof import('./renderChangesDiff.js')>['renderChangesDiffHandler']
  >[0]['req']

beforeEach(() => {
  fetchLatestVersionMock.mockReset()
  fetchCurrentlyPublishedDocMock.mockClear()
  // Re-bind the default delegating implementation after `mockClear`.
  fetchCurrentlyPublishedDocMock.mockImplementation(async (args: { status?: string }) =>
    fetchLatestVersionMock({ ...args, status: 'published' }),
  )
})

describe('renderChangesDiffHandler', () => {
  it('issue #1+#2: returns no-op without calling fetchLatestVersion when collection doc has no docID', async () => {
    const { renderChangesDiffHandler } = await import('./renderChangesDiff.js')

    const result = await renderChangesDiffHandler({
      collectionSlug: 'posts',
      // no docID — brand-new (unsaved) doc
      req: makeReq(),
    } as never)

    expect(fetchLatestVersionMock).not.toHaveBeenCalled()
    expect(result).toEqual({ availableSources: [], Diff: null, hasChanges: false })
  })

  it('issue #2: scopes both fetchLatestVersion calls to parentID = docID', async () => {
    const { renderChangesDiffHandler } = await import('./renderChangesDiff.js')

    fetchLatestVersionMock.mockImplementation(async ({ status }: { status: string }) => ({
      version: { title: status === 'published' ? 'old' : 'new' },
      updatedAt: '2024-01-01T00:00:00Z',
    }))

    await renderChangesDiffHandler({
      collectionSlug: 'posts',
      docID: 'abc-123',
      req: makeReq(),
    } as never)

    expect(fetchLatestVersionMock).toHaveBeenCalledTimes(2)
    for (const call of fetchLatestVersionMock.mock.calls) {
      expect(call[0]).toMatchObject({ collectionSlug: 'posts', parentID: 'abc-123' })
    }
    const statuses = fetchLatestVersionMock.mock.calls.map((c) => c[0].status).sort()
    expect(statuses).toEqual(['draft', 'published'])
  })

  it('on creation (no published baseline), diffs empty object vs latest draft so all fields show as additions', async () => {
    const { renderChangesDiffHandler } = await import('./renderChangesDiff.js')

    // No published version, but a draft exists (typical "saved as draft, never published" case)
    fetchLatestVersionMock.mockImplementation(async ({ status }: { status: string }) =>
      status === 'published' ? null : { version: { title: 'drafted' }, updatedAt: '2024-01-02' },
    )

    const result = (await renderChangesDiffHandler({
      collectionSlug: 'posts',
      docID: 'abc-123',
      req: makeReq(),
    } as never)) as unknown as {
      Diff: { from: object; to: { title: string } }
      hasChanges: boolean
      notPublishedYet?: boolean
    }

    expect(result.notPublishedYet).toBeUndefined()
    expect(result.hasChanges).toBe(true)
    expect(result.Diff.from).toEqual({})
    expect(result.Diff.to.title).toBe('drafted')
  })

  it('issue #3: returns safe no-op when there is no latest draft for the doc', async () => {
    const { renderChangesDiffHandler } = await import('./renderChangesDiff.js')

    fetchLatestVersionMock.mockImplementation(async ({ status }: { status: string }) =>
      status === 'published' ? { version: { title: 'pub' }, updatedAt: '2024-01-01' } : null,
    )

    const result = await renderChangesDiffHandler({
      collectionSlug: 'posts',
      docID: 'abc-123',
      req: makeReq(),
    } as never)

    expect(result.hasChanges).toBe(false)
    expect(result.Diff).toBeNull()
  })

  it('issue #4: hasChanges is false when published equals latest draft', async () => {
    const { renderChangesDiffHandler } = await import('./renderChangesDiff.js')

    fetchLatestVersionMock.mockImplementation(async () => ({
      version: { title: 'same' },
      updatedAt: '2024-01-01T00:00:00Z',
    }))

    const result = await renderChangesDiffHandler({
      collectionSlug: 'posts',
      docID: 'abc-123',
      req: makeReq(),
    } as never)

    expect(result.hasChanges).toBe(false)
  })

  it('issue #5: always compares published (from) vs latest draft (to); no compareFrom toggle', async () => {
    const { renderChangesDiffHandler } = await import('./renderChangesDiff.js')

    fetchLatestVersionMock.mockImplementation(async ({ status }: { status: string }) => ({
      version: { title: status === 'published' ? 'OLD' : 'NEW' },
      updatedAt: '2024-01-01T00:00:00Z',
    }))

    const result = (await renderChangesDiffHandler({
      collectionSlug: 'posts',
      docID: 'abc-123',
      req: makeReq(),
    } as never)) as unknown as {
      Diff: { from: { title: string }; to: { title: string } }
      availableSources: string[]
      hasChanges: boolean
    }

    expect(result.hasChanges).toBe(true)
    expect(result.Diff.from.title).toBe('OLD')
    expect(result.Diff.to.title).toBe('NEW')
    // `availableSources` is kept for backward-compat but always reports a single, fixed source.
    expect(result.availableSources).toEqual(['latestDraft'])
  })

  it('handles globals (no docID required)', async () => {
    const { renderChangesDiffHandler } = await import('./renderChangesDiff.js')

    fetchLatestVersionMock.mockImplementation(async ({ status }: { status: string }) => ({
      version: { title: status === 'published' ? 'old' : 'new' },
      updatedAt: '2024-01-01T00:00:00Z',
    }))

    const result = await renderChangesDiffHandler({
      globalSlug: 'site',
      req: makeReq(),
    } as never)

    expect(result.hasChanges).toBe(true)
    // globals also pass through `parentID` (which is `undefined`); never short-circuited by the docID guard.
    expect(fetchLatestVersionMock).toHaveBeenCalledTimes(2)
    for (const call of fetchLatestVersionMock.mock.calls) {
      expect(call[0]).toMatchObject({ globalSlug: 'site' })
    }
  })

  it('on creation for a global (no published baseline, no draft), returns no-op since right side is empty', async () => {
    const { renderChangesDiffHandler } = await import('./renderChangesDiff.js')

    fetchLatestVersionMock.mockResolvedValue(null)

    const result = await renderChangesDiffHandler({
      globalSlug: 'site',
      req: makeReq(),
    } as never)

    expect(result).toEqual({
      availableSources: ['latestDraft'],
      Diff: null,
      hasChanges: false,
    })
  })
})
