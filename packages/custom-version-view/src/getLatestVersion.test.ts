import { describe, it, expect, vi } from 'vitest'
import { getLatestVersion } from './getLatestVersion.js'

function makePayload({
  findVersionsDocs = [],
  findGlobalVersionsDocs = [],
}: {
  findVersionsDocs?: any[]
  findGlobalVersionsDocs?: any[]
} = {}) {
  return {
    findVersions: vi.fn().mockResolvedValue({ docs: findVersionsDocs }),
    findGlobalVersions: vi.fn().mockResolvedValue({ docs: findGlobalVersionsDocs }),
  } as any
}

describe('getLatestVersion', () => {
  it('returns null when no versions found for a collection', async () => {
    const payload = makePayload()
    const result = await getLatestVersion({
      slug: 'articles',
      type: 'collection',
      parentID: '123',
      payload,
      status: 'published',
    })
    expect(result).toBeNull()
  })

  it('returns id and updatedAt for the latest collection version', async () => {
    const payload = makePayload({
      findVersionsDocs: [{ id: 'v1', updatedAt: '2024-01-01T00:00:00.000Z' }],
    })
    const result = await getLatestVersion({
      slug: 'articles',
      type: 'collection',
      parentID: '123',
      payload,
      status: 'published',
    })
    expect(result).toEqual({ id: 'v1', updatedAt: '2024-01-01T00:00:00.000Z' })
  })

  it('calls findVersions with correct where clause for collection', async () => {
    const payload = makePayload({
      findVersionsDocs: [{ id: 'v1', updatedAt: '2024-01-01T00:00:00.000Z' }],
    })
    await getLatestVersion({
      slug: 'articles',
      type: 'collection',
      parentID: '42',
      payload,
      status: 'draft',
    })
    expect(payload.findVersions).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'articles',
        where: expect.objectContaining({
          and: expect.arrayContaining([
            { 'version._status': { equals: 'draft' } },
            { parent: { equals: '42' } },
          ]),
        }),
      }),
    )
  })

  it('calls findGlobalVersions for global type', async () => {
    const payload = makePayload({
      findGlobalVersionsDocs: [{ id: 'gv1', updatedAt: '2024-06-01T00:00:00.000Z' }],
    })
    const result = await getLatestVersion({
      slug: 'settings',
      type: 'global',
      payload,
      status: 'published',
    })
    expect(payload.findGlobalVersions).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'settings' }),
    )
    expect(result).toEqual({ id: 'gv1', updatedAt: '2024-06-01T00:00:00.000Z' })
  })

  it('returns null when no global versions found', async () => {
    const payload = makePayload()
    const result = await getLatestVersion({
      slug: 'settings',
      type: 'global',
      payload,
      status: 'published',
    })
    expect(result).toBeNull()
  })

  it('does not add parent filter when parentID is not provided', async () => {
    const payload = makePayload()
    await getLatestVersion({
      slug: 'articles',
      type: 'collection',
      payload,
      status: 'published',
    })
    const callArg = payload.findVersions.mock.calls[0][0]
    const hasParentFilter = callArg.where.and.some((c: any) => 'parent' in c)
    expect(hasParentFilter).toBe(false)
  })

  it('returns null and does not throw on payload error', async () => {
    const payload: any = {
      findVersions: vi.fn().mockRejectedValue(new Error('DB error')),
      findGlobalVersions: vi.fn(),
    }
    const result = await getLatestVersion({
      slug: 'articles',
      type: 'collection',
      parentID: '1',
      payload,
      status: 'published',
    })
    expect(result).toBeNull()
  })
})
