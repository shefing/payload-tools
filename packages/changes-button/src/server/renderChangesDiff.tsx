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

/**
 * Kept for backward compatibility with any external typings — the runtime
 * always compares the currently saved doc against the latest published
 * version. The toggle was removed in v0.2 (see issue tracker).
 */
export type CompareFrom = 'latestDraft' | 'unsaved'

export type RenderChangesDiffArgs = {
  collectionSlug?: string
  /** @deprecated Ignored. Always compares saved doc vs latest published. */
  compareFrom?: CompareFrom
  /** Document id. Required — comparison is always scoped to this doc. */
  docID?: number | string
  /** @deprecated Ignored. Caller must save the draft before invoking. */
  formData?: Record<string, unknown>
  globalSlug?: string
  /** Optional locale code list; defaults to all configured locales. */
  selectedLocales?: string[]
}

export type RenderChangesDiffResult = {
  /** Always `['latestDraft']` — the toggle was removed; the field is kept for backward compatibility. */
  availableSources: CompareFrom[]
  /** Server-rendered React node containing the diff (empty when `hasChanges === false`). */
  Diff: ReactNode
  /** `true` when at least one field differs between from/to. */
  hasChanges: boolean
  /**
   * `true` when the document has no published baseline yet. The diff is
   * intentionally suppressed in this case (the comparison would otherwise
   * be "empty vs current", which misrepresents the change set). The client
   * should render a dedicated message instead.
   */
  notPublishedYet?: boolean
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
    docID,
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

  // For collections, the comparison must be scoped to the specific document
  // via `parentID`. Without it, `findVersions` would return the latest
  // version of *any* doc in the collection — bug #2 from the issue. For new
  // (unsaved) collection docs, `docID` is undefined and there is nothing
  // meaningful to compare against, so we short-circuit with no-changes.
  if (collectionSlug && !docID) {
    return { availableSources: [], Diff: null, hasChanges: false }
  }

  // Resolve doc-level permissions for the diff (mirrors `Version/index.tsx`
  // behavior, but uses the public `payload.auth` flow rather than the
  // internal `initPageResult.permissions`).
  const { permissions } = await payload.auth({ headers: req.headers, req })
  const docPermissions: SanitizedCollectionPermission | SanitizedGlobalPermission | undefined =
    collectionSlug ? permissions.collections?.[collectionSlug] : permissions.globals?.[globalSlug!]

  // Fetch baseline (currently published) and the latest draft — both scoped
  // to this specific document via `parentID`.
  const [currentlyPublishedVersion, latestDraftVersion] = await Promise.all([
    fetchLatestVersion({
      collectionSlug,
      globalSlug,
      locale: 'all',
      overrideAccess: false,
      parentID: docID,
      req,
      status: 'published',
    }),
    fetchLatestVersion({
      collectionSlug,
      globalSlug,
      locale: 'all',
      overrideAccess: false,
      parentID: docID,
      req,
      status: 'draft',
    }) as Promise<null | TypeWithVersion<object>>,
  ])

  // The diff renders `versionFrom` on the LEFT (red, "before") and
  // `versionTo` on the RIGHT (green, "after"). We always compare the
  // currently published version (left) against the latest saved draft of
  // this same document (right) — i.e. "what is published" vs "what will be
  // published next".
  //
  // If there is no published baseline yet, comparing "empty vs current"
  // misrepresents the change set (every field becomes an addition). The
  // user-visible expectation is "current document vs last published";
  // when no last-published exists, suppress the diff and let the client
  // surface a dedicated message instead.
  if (!currentlyPublishedVersion) {
    return {
      availableSources: ['latestDraft'],
      Diff: null,
      hasChanges: false,
      notPublishedYet: true,
    }
  }

  const versionFromSiblingData: object = {
    ...(currentlyPublishedVersion.version as object),
    updatedAt: currentlyPublishedVersion.updatedAt,
  }

  // If no draft exists either (e.g. brand-new global with drafts enabled
  // but never saved), there is nothing on the right side — treat as
  // "no changes".
  if (!latestDraftVersion) {
    return { availableSources: ['latestDraft'], Diff: null, hasChanges: false }
  }

  const versionToSiblingData: object = {
    ...(latestDraftVersion.version as object),
    updatedAt: latestDraftVersion.updatedAt,
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

  return { availableSources: ['latestDraft'], Diff, hasChanges }
}

export default renderChangesDiffHandler
