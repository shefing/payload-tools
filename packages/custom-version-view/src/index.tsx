import { Gutter, ListQueryProvider, SetDocumentStepNav } from '@payloadcms/ui'
import { notFound } from 'next/navigation.js'
import { type DocumentViewServerProps, type PaginatedDocs, type Where } from 'payload'
import { isNumber } from 'payload/shared'
import React from 'react'

import { fetchLatestVersion, fetchVersions } from './fetchVersions'
import { CreatedAtCell } from './components/cells/CreatedAt'
import { buildVersionColumns } from './components/buildColumns'
import { VersionsViewClient } from './index.client'

const baseClass = 'versions'

export default async function VersionsView(props: DocumentViewServerProps) {
  const {
    hasPublishedDoc,
    initPageResult: {
      collectionConfig,
      docID: id,
      globalConfig,
      req,
      req: {
        i18n,
        payload: { config },
        t,
        user,
      },
    },
    routeSegments: segments,
    searchParams: { limit, page, sort },
    versions: { disableGutter = false, useVersionDrawerCreatedAtCell = false } = {},
  } = props

  const draftsEnabled = (collectionConfig ?? globalConfig)?.versions?.drafts

  const collectionSlug = collectionConfig?.slug
  const globalSlug = globalConfig?.slug

  const isTrashed = segments[2] === 'trash'

  const {
    localization,
    routes: { api: apiRoute },
    serverURL,
  } = config

  const whereQuery: {
    and: Array<{ parent?: { equals: number | string }; snapshot?: { not_equals: boolean } }>
  } & Where = {
    and: [],
  }
  if (localization && draftsEnabled) {
    whereQuery.and.push({
      snapshot: {
        not_equals: true,
      },
    })
  }

  const defaultLimit = collectionSlug ? collectionConfig?.admin?.pagination?.defaultLimit : 10

  const limitToUse = isNumber(limit) ? Number(limit) : defaultLimit

  const versionsData: PaginatedDocs = await fetchVersions({
    collectionSlug,
    depth: 0,
    draft: true,
    globalSlug,
    limit: limitToUse,
    locale: req.locale,
    overrideAccess: false,
    page: page ? parseInt(page.toString(), 10) : undefined,
    parentID: id,
    req,
    sort: sort as string,
    user,
    where: whereQuery,
  })

  if (!versionsData) {
    return notFound()
  }

  // Payload's transform/stripFields removes plugin-added fields (updator, process, creator)
  // from version docs because they may not be in the flattened field schema at transform time.
  // Workaround: query MongoDB directly for these fields and merge them into the docs.
  if (versionsData.docs?.length > 0 && collectionSlug) {
    try {
      const mongoose = (req.payload.db as any)?.connection
      if (mongoose) {
        const versionCollectionName = `_${collectionSlug}_versions`
        const collection = mongoose.collection(versionCollectionName)
        const versionIds = versionsData.docs.map((doc: any) => doc.id)
        // Use mongoose's built-in Types.ObjectId to avoid direct mongodb dependency
        const objectIds = versionIds.map((id: string) => {
          try { return (mongoose as any).base?.Types?.ObjectId
            ? new (mongoose as any).base.Types.ObjectId(id)
            : id
          } catch { return id }
        })
        const rawDocs = await collection.find(
          { _id: { $in: objectIds } },
          { projection: { _id: 1, 'version.updator': 1, 'version.process': 1, 'version.creator': 1 } }
        ).toArray()
        const rawMap = new Map(rawDocs.map((d: any) => [d._id.toString(), d.version || {}]))
        const locale = req.locale || 'he'
        versionsData.docs.forEach((doc: any) => {
          const raw = rawMap.get(doc.id) as any
          if (raw) {
            // Handle localized fields: stored as { he: "value" } in MongoDB
            const getLocalized = (val: any) => {
              if (val && typeof val === 'object' && !Array.isArray(val)) {
                return val[locale] || val['he'] || val['en'] || Object.values(val)[0]
              }
              return val
            }
            doc.updator = getLocalized(raw.updator)
            doc.process = getLocalized(raw.process)
            doc.creator = getLocalized(raw.creator)
          }
        })
      }
    } catch (e: any) {
      console.error('[custom-version-view] Failed to fetch author fields from MongoDB:', e.message)
    }
  }


  const [currentlyPublishedVersion, latestDraftVersion] = await Promise.all([
    hasPublishedDoc
      ? fetchLatestVersion({
        collectionSlug,
        depth: 0,
        globalSlug,
        overrideAccess: false,
        parentID: id,
        req,
        select: {
          id: true,
          updatedAt: true,
        },
        status: 'published',
        user,
      })
      : Promise.resolve(null),
    draftsEnabled
      ? fetchLatestVersion({
        collectionSlug,
        depth: 0,
        globalSlug,
        overrideAccess: false,
        parentID: id,
        req,
        select: {
          id: true,
          updatedAt: true,
        },
        status: 'draft',
        user,
      })
      : Promise.resolve(null),
  ])

  const fetchURL = collectionSlug
    ? `${serverURL}${apiRoute}/${collectionSlug}/versions`
    : `${serverURL}${apiRoute}/globals/${globalSlug}/versions`

  const columns = buildVersionColumns({
    collectionConfig,
    CreatedAtCellOverride: useVersionDrawerCreatedAtCell ? CreatedAtCell : undefined,
    currentlyPublishedVersion,
    docID: id,
    docs: versionsData?.docs,
    globalConfig,
    i18n,
    isTrashed,
    latestDraftVersion,
  })

  const pluralLabel =
    typeof collectionConfig?.labels?.plural === 'function'
      ? collectionConfig.labels.plural({ i18n, t })
      : (collectionConfig?.labels?.plural ?? globalConfig?.label)

  const GutterComponent = disableGutter ? React.Fragment : Gutter

  return (
    <React.Fragment>
      <SetDocumentStepNav
        collectionSlug={collectionSlug}
        globalSlug={globalSlug}
        id={id}
        isTrashed={isTrashed}
        pluralLabel={pluralLabel}
        useAsTitle={collectionConfig?.admin?.useAsTitle || globalSlug}
        view={i18n.t('version:versions')}
      />
      <main className={baseClass}>
        <GutterComponent className={`${baseClass}__wrap`}>
          <ListQueryProvider
            data={versionsData}
            modifySearchParams
            orderableFieldName={collectionConfig?.orderable === true ? '_order' : undefined}
            query={{
              limit: limitToUse,
              sort: sort as string,
            }}
          >
            <VersionsViewClient
              baseClass={baseClass}
              columns={columns}
              fetchURL={fetchURL}
              paginationLimits={collectionConfig?.admin?.pagination?.limits}
            />
          </ListQueryProvider>
        </GutterComponent>
      </main>
    </React.Fragment>
  )
}

export { VersionsView }