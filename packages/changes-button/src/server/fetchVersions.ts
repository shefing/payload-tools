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
