/**
 * Slim wrapper around `payload.findVersions*` Local API helpers.
 *
 * This is intentionally a small, dependency-free copy of the same shape used
 * inside `@payloadcms/next/views/Version/fetchVersions.ts`. It is duplicated
 * here (rather than imported from a private path) so the plugin only depends
 * on the public `payload` API surface.
 */
import {
  logError,
  type PaginatedDocs,
  type PayloadRequest,
  type SelectType,
  type Sort,
  type TypeWithVersion,
  type Where,
} from 'payload'

export const fetchVersions = async <TVersionData extends object = object>({
  collectionSlug,
  depth,
  globalSlug,
  limit,
  locale,
  overrideAccess,
  parentID,
  req,
  select,
  sort,
  where: whereFromArgs,
}: {
  collectionSlug?: string
  depth?: number
  globalSlug?: string
  limit?: number
  locale?: 'all' | ({} & string)
  overrideAccess?: boolean
  parentID?: number | string
  req: PayloadRequest
  select?: SelectType
  sort?: Sort
  where?: Where
}): Promise<null | PaginatedDocs<TypeWithVersion<TVersionData>>> => {
  const where: Where = { and: [...(whereFromArgs ? [whereFromArgs] : [])] }

  try {
    if (collectionSlug) {
      if (parentID) {
        where.and!.push({ parent: { equals: parentID } })
      }
      return (await req.payload.findVersions({
        collection: collectionSlug,
        depth,
        draft: true,
        limit,
        locale,
        overrideAccess,
        req,
        select,
        sort,
        where,
      })) as PaginatedDocs<TypeWithVersion<TVersionData>>
    } else if (globalSlug) {
      return (await req.payload.findGlobalVersions({
        slug: globalSlug,
        depth,
        limit,
        locale,
        overrideAccess,
        req,
        select,
        sort,
        where,
      })) as PaginatedDocs<TypeWithVersion<TVersionData>>
    }
    return null
  } catch (err) {
    logError({ err, payload: req.payload })
    return null
  }
}

export const fetchLatestVersion = async <TVersionData extends object = object>({
  collectionSlug,
  globalSlug,
  locale,
  overrideAccess,
  parentID,
  req,
  status,
}: {
  collectionSlug?: string
  globalSlug?: string
  locale?: 'all' | ({} & string)
  overrideAccess?: boolean
  parentID?: number | string
  req: PayloadRequest
  status: 'draft' | 'published'
}): Promise<null | TypeWithVersion<TVersionData>> => {
  const entityConfig = collectionSlug
    ? req.payload.collections[collectionSlug]?.config
    : globalSlug
      ? req.payload.globals[globalSlug]?.config
      : undefined
  const draftsEnabled = entityConfig?.versions?.drafts
  const and: Where[] = [
    ...(draftsEnabled ? [{ 'version._status': { equals: status } as Where['version._status'] }] : []),
  ]

  const latest = await fetchVersions<TVersionData>({
    collectionSlug,
    depth: 1,
    globalSlug,
    limit: 1,
    locale,
    overrideAccess,
    parentID,
    req,
    sort: '-updatedAt',
    where: { and },
  })

  return latest?.docs?.length ? (latest.docs[0] as TypeWithVersion<TVersionData>) : null
}

/**
 * Fetch the currently-published document directly from the main collection
 * (or the global itself), rather than from the `_versions` history.
 *
 * This is the source of truth for "what is live right now": the doc in
 * `meetings` (with `_status: 'published'`) reflects the latest publish,
 * whereas `_meetings_versions` history may contain stale entries — e.g.
 * when a publish happens, the live doc updates immediately but the
 * matching version row's `updatedAt` doesn't always line up with what
 * the user perceives as "currently published".
 *
 * Returns the doc shape wrapped to match `TypeWithVersion` so the diff
 * pipeline can consume it the same way as a version row.
 */
export const fetchCurrentlyPublishedDoc = async <TVersionData extends object = object>({
  collectionSlug,
  globalSlug,
  locale,
  overrideAccess,
  parentID,
  req,
}: {
  collectionSlug?: string
  globalSlug?: string
  locale?: 'all' | ({} & string)
  overrideAccess?: boolean
  parentID?: number | string
  req: PayloadRequest
}): Promise<null | TypeWithVersion<TVersionData>> => {
  try {
    if (collectionSlug) {
      if (!parentID) {
        return null
      }
      const doc = (await req.payload.findByID({
        id: parentID,
        collection: collectionSlug,
        depth: 1,
        draft: false, // force the published variant
        locale,
        overrideAccess,
        req,
      })) as Record<string, unknown> | null
      if (!doc) {
        return null
      }
      // Only treat it as a published baseline if it is actually published.
      if (doc._status !== undefined && doc._status !== 'published') {
        return null
      }
      return {
        version: doc,
        updatedAt: (doc.updatedAt as string) ?? new Date().toISOString(),
      } as unknown as TypeWithVersion<TVersionData>
    } else if (globalSlug) {
      const doc = (await req.payload.findGlobal({
        slug: globalSlug,
        depth: 1,
        draft: false,
        locale,
        overrideAccess,
        req,
      })) as Record<string, unknown> | null
      if (!doc) {
        return null
      }
      if (doc._status !== undefined && doc._status !== 'published') {
        return null
      }
      return {
        version: doc,
        updatedAt: (doc.updatedAt as string) ?? new Date().toISOString(),
      } as unknown as TypeWithVersion<TVersionData>
    }
    return null
  } catch (err) {
    logError({ err, payload: req.payload })
    return null
  }
}
