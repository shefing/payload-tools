import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `renderChangesDiff.test.ts` exercises the high-level branching of
 * `renderChangesDiffHandler` without spinning up Payload.
 *
 * The vendored diff pipeline (`../vendor/diff/*`) and the schema-map utilities
 * (`@payloadcms/ui/utilities/*`) are mocked — we are not testing those, only:
 *
 *   1. `hasChanges` is `false` when the from/to sibling data are identical.
 *   2. `hasChanges` is `true` when they differ.
 *   3. `compareFrom: 'unsaved'` requires `formData` and feeds it through.
 *   4. Missing published baseline returns `{ hasChanges: false, Diff: null }`.
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
    globals: [],
  }),
}))
vi.mock('@payloadcms/ui/utilities/getClientSchemaMap', () => ({
  getClientSchemaMap: () => new Map(),
}))
vi.mock('@payloadcms/ui/utilities/getSchemaMap', () => ({ getSchemaMap: () => new Map() }))

// `fetchLatestVersion` is the only side-effecting helper inside the SUT — mock it
// per-test to control the published / draft return values.
const fetchLatestVersionMock = vi.fn()
vi.mock('./fetchVersions.js', () => ({
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
        permissions: { collections: { posts: { fields: undefined } } },
      })),
      collections: { posts: { config: { fields: [{ name: 'title', type: 'text' }] } } },
      config: { localization: undefined },
      globals: {},
      importMap: {},
      logger: { error: vi.fn() },
    },
    user: undefined,
  }) as unknown as Parameters<
    Awaited<typeof import('./renderChangesDiff.js')>['renderChangesDiffHandler']
  >[0]['req']

beforeEach(() => {
  fetchLatestVersionMock.mockReset()
})

describe('renderChangesDiffHandler', () => {
  it('returns hasChanges: false when from/to sibling data are equal', async () => {
    const { renderChangesDiffHandler } = await import('./renderChangesDiff.js')

    fetchLatestVersionMock.mockImplementation(async ({ status }: { status: string }) => ({
      version: { title: 'same' },
      updatedAt: '2024-01-01T00:00:00Z',
      __status: status,
    }))

    const result = await renderChangesDiffHandler({
      collectionSlug: 'posts',
      compareFrom: 'latestDraft',
      req: makeReq(),
    } as never)

    expect(result.hasChanges).toBe(false)
  })

  it('returns hasChanges: true when sibling data differ', async () => {
    const { renderChangesDiffHandler } = await import('./renderChangesDiff.js')

    fetchLatestVersionMock.mockImplementation(async ({ status }: { status: string }) => ({
      version: { title: status === 'published' ? 'old' : 'new' },
      updatedAt: '2024-01-01T00:00:00Z',
    }))

    const result = await renderChangesDiffHandler({
      collectionSlug: 'posts',
      compareFrom: 'latestDraft',
      req: makeReq(),
    } as never)

    expect(result.hasChanges).toBe(true)
    expect(result.Diff).toBeTruthy()
  })

  it('throws when compareFrom === "unsaved" and no formData is supplied', async () => {
    const { renderChangesDiffHandler } = await import('./renderChangesDiff.js')

    fetchLatestVersionMock.mockResolvedValue({
      version: { title: 'published' },
      updatedAt: '2024-01-01T00:00:00Z',
    })

    await expect(
      renderChangesDiffHandler({
        collectionSlug: 'posts',
        compareFrom: 'unsaved',
        req: makeReq(),
      } as never),
    ).rejects.toThrow(/formData.*required.*unsaved/)
  })

  it('returns no-op result when there is no published baseline (latestDraft compare with no draft)', async () => {
    const { renderChangesDiffHandler } = await import('./renderChangesDiff.js')

    fetchLatestVersionMock.mockResolvedValue(null)

    const result = await renderChangesDiffHandler({
      collectionSlug: 'posts',
      compareFrom: 'latestDraft',
      req: makeReq(),
    } as never)

    expect(result.hasChanges).toBe(false)
    expect(result.Diff).toBeNull()
  })
})
