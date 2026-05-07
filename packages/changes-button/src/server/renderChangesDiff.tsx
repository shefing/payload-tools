import type {
  PayloadRequest,
  SanitizedCollectionPermission,
  SanitizedGlobalPermission,
  ServerFunction,
  TypeWithVersion,
} from 'payload'
import type { ReactNode } from 'react'

// PR-A (`@payloadcms/next/views/diff` subpath export) is not yet in a Payload
// release, so we vendor the diff pipeline locally under `../vendor/diff/`.
// When PR-A lands, swap these three imports to `@payloadcms/next/views/diff`
// and delete `src/vendor/diff/`.
import { countChangedFields } from '../vendor/diff/utilities/countChangedFields.js'
import { RenderDiff } from '../vendor/diff/index.js'
import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { getClientSchemaMap } from '@payloadcms/ui/utilities/getClientSchemaMap'
import { getSchemaMap } from '@payloadcms/ui/utilities/getSchemaMap'

import { fetchLatestVersion } from './fetchVersions.js'

export type CompareFrom = 'latestDraft' | 'unsaved'

export type RenderChangesDiffArgs = {
  collectionSlug?: string
  /** `'unsaved'` | `'latestDraft'`. Defaults to `'latestDraft'`. */
  compareFrom?: CompareFrom
  docID?: number | string
  /** Required when `compareFrom === 'unsaved'`. */
  formData?: Record<string, unknown>
  globalSlug?: string
  /** Optional locale code list; defaults to all configured locales. */
  selectedLocales?: string[]
}

export type RenderChangesDiffResult = {
  /** Sources that exist for this document; the client decides whether to show the toggle. */
  availableSources: CompareFrom[]
  /** Server-rendered React node containing the diff (empty when `hasChanges === false`). */
  Diff: ReactNode
  /** `true` when at least one field differs between from/to. */
  hasChanges: boolean
}

/**
 * `renderChangesDiffHandler` is a Payload Server Function (registered under the
 * key `shefing/changes-button:render-diff`) that renders a diff between the
 * currently-published version of a document and either the latest draft or
 * the supplied unsaved form values.
 *
 * Reuses the same diff pipeline as the built-in Versions view via the public
 * `@payloadcms/next/views/diff` subpath (PR-A).
 */
export const renderChangesDiffHandler: ServerFunction<
  RenderChangesDiffArgs,
  Promise<RenderChangesDiffResult>
> = async ({ req, ...args }: RenderChangesDiffArgs & { req: PayloadRequest }): Promise<RenderChangesDiffResult> => {
  const {
    collectionSlug,
    compareFrom = 'latestDraft',
    formData,
    globalSlug,
    selectedLocales: selectedLocalesArg,
  } = args

  const { i18n, payload } = req
  const { config } = payload
  const { user } = req

  const entityConfig = collectionSlug
    ? payload.collections[collectionSlug]?.config
    : globalSlug
      ? payload.globals[globalSlug]?.config
      : undefined

  if (!entityConfig) {
    throw new Error(
      `[changes-button] Unknown entity: collectionSlug='${collectionSlug ?? ''}' globalSlug='${
        globalSlug ?? ''
      }'`,
    )
  }

  // Resolve doc-level permissions for the diff (mirrors `Version/index.tsx`
  // behavior, but uses the public `payload.auth` flow rather than the
  // internal `initPageResult.permissions`).
  const { permissions } = await payload.auth({ headers: req.headers, req })
  const docPermissions: SanitizedCollectionPermission | SanitizedGlobalPermission | undefined =
    collectionSlug ? permissions.collections?.[collectionSlug] : permissions.globals?.[globalSlug!]

  // Fetch baseline (currently published) and — when needed — the latest draft.
  const [currentlyPublishedVersion, latestDraftVersion] = await Promise.all([
    fetchLatestVersion({ collectionSlug, globalSlug, locale: 'all', overrideAccess: false, req, status: 'published' }),
    compareFrom === 'latestDraft'
      ? fetchLatestVersion({ collectionSlug, globalSlug, locale: 'all', overrideAccess: false, req, status: 'draft' })
      : Promise.resolve<null | TypeWithVersion<object>>(null),
  ])

  // The diff renders `versionFrom` on the LEFT (red, "before") and
  // `versionTo` on the RIGHT (green, "after"). For the Review flow the user
  // wants to see the currently published version on the left and the
  // proposed/new content (unsaved edits or latest draft) on the right —
  // i.e. "what is published" → "what will be published". For brand-new
  // entities with no published baseline yet, `from` is an empty object so
  // every field shows as an addition.
  const versionFromSiblingData: object = currentlyPublishedVersion
    ? {
        ...(currentlyPublishedVersion.version as object),
        updatedAt: currentlyPublishedVersion.updatedAt,
      }
    : {}

  let versionToSiblingData: object
  if (compareFrom === 'unsaved') {
    if (!formData) {
      throw new Error('[changes-button] `formData` is required when compareFrom === "unsaved".')
    }
    versionToSiblingData = formData
  } else {
    if (!latestDraftVersion) {
      // Nothing to diff against — treat as no changes.
      return { availableSources: ['unsaved'], Diff: null, hasChanges: false }
    }
    versionToSiblingData = {
      ...(latestDraftVersion.version as object),
      updatedAt: latestDraftVersion.updatedAt,
    }
  }

  // Build the schema maps the diff pipeline expects.
  const schemaMap = getSchemaMap({ collectionSlug, config, globalSlug, i18n })
  const clientConfig = getClientConfig({ config, i18n, importMap: payload.importMap, user })
  const clientSchemaMap = getClientSchemaMap({
    collectionSlug,
    config: clientConfig,
    globalSlug,
    i18n,
    payload,
    schemaMap,
  })

  // Resolve the top-level client fields for the entity (used by `countChangedFields`).
  const clientFields = collectionSlug
    ? clientConfig.collections?.find((c: { slug: string }) => c.slug === collectionSlug)?.fields
    : clientConfig.globals?.find((g: { slug: string }) => g.slug === globalSlug)?.fields

  // Default `selectedLocales` to all configured locales when unspecified.
  const selectedLocales =
    selectedLocalesArg ??
    (config.localization ? config.localization.locales.map((l) => l.code) : [])

  const buildArgs = {
    clientSchemaMap,
    customDiffComponents: {},
    entitySlug: (collectionSlug || globalSlug)!,
    fields: entityConfig.fields,
    fieldsPermissions: docPermissions?.fields,
    i18n,
    modifiedOnly: true,
    parentIndexPath: '',
    parentIsLocalized: false,
    parentPath: '',
    parentSchemaPath: '',
    req,
    selectedLocales,
    versionFromSiblingData,
    versionToSiblingData,
  } as const

  const Diff = RenderDiff(buildArgs as Parameters<typeof RenderDiff>[0])

  // Count changed fields between from/to siblings using the public API shape.
  const hasChanges = clientFields
    ? countChangedFields({
        config: clientConfig,
        fields: clientFields,
        locales: selectedLocales.length > 0 ? selectedLocales : undefined,
        parentIsLocalized: false,
        valueFrom: versionFromSiblingData,
        valueTo: versionToSiblingData,
      } as Parameters<typeof countChangedFields>[0]) > 0
    : false

  const availableSources: CompareFrom[] = []
  if (formData || compareFrom === 'unsaved') {
    availableSources.push('unsaved')
  }
  if (latestDraftVersion) {
    availableSources.push('latestDraft')
  }

  return { availableSources, Diff, hasChanges }
}

export default renderChangesDiffHandler
