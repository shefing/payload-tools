'use client'
import {
  Drawer,
  formatDrawerSlug,
  LoadingOverlay,
  useEditDepth,
  useServerFunctions,
  useTranslation,
} from '@payloadcms/ui'
import React, { useCallback, useEffect, useId, useMemo, useState } from 'react'

import type { RenderChangesDiffResult } from '../../server/renderChangesDiff.js'

import { getLabel, SERVER_FUNCTION_KEY } from '../../labels.js'

export type UseChangesDrawerArgs = {
  collectionSlug?: string
  docID?: number | string
  globalSlug?: string
}

export type UseChangesDrawerReturn = {
  closeDrawer: () => void
  Drawer: React.FC
  drawerSlug: string
  openDrawer: () => void
}

/**
 * Hook returning a stable drawer slug + a `<Drawer>` component bound to it.
 *
 * Mirrors the shape of `useVersionDrawer` from `@payloadcms/next` so call
 * sites can swap implementations without restructuring. Stacking is handled
 * by `useEditDepth()` so the drawer composes correctly inside relation-field
 * drawers.
 */
export const useChangesDrawer = (args: UseChangesDrawerArgs): UseChangesDrawerReturn => {
  const { i18n } = useTranslation()
  const editDepth = useEditDepth()
  const uuid = useId()
  const drawerSlug = useMemo(
    () => formatDrawerSlug({ slug: `changes-${uuid}`, depth: editDepth }),
    [uuid, editDepth],
  )

  // The drawer JSX is exposed as a stable component so the caller can render it
  // once near the toggler.
  const DrawerComponent: React.FC = useCallback(
    () => (
      <Drawer
        slug={drawerSlug}
        title={getLabel('reviewChanges', i18n.language)}
        children={<ChangesDrawerContent {...args} />}
      />
    ),
    // We deliberately don't depend on `args` to avoid remounting the drawer on every render;
    // identity-stable callers (memoized parents) get the same instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drawerSlug, i18n.language],
  )

  // Open / close are no-ops here — wiring goes through `<DrawerToggler slug={drawerSlug}>`
  // (faceless-ui handles the open state). The hook surface still exposes them so
  // imperative callers can hook into the modal context themselves if needed.
  return {
    closeDrawer: () => undefined,
    Drawer: DrawerComponent,
    drawerSlug,
    openDrawer: () => undefined,
  }
}

type ChangesDrawerContentProps = UseChangesDrawerArgs

const ChangesDrawerContent: React.FC<ChangesDrawerContentProps> = ({
  collectionSlug,
  docID,
  globalSlug,
}) => {
  const { serverFunction } = useServerFunctions()
  const { i18n } = useTranslation()

  const [pending, setPending] = useState<boolean>(true)
  const [error, setError] = useState<null | string>(null)
  const [result, setResult] = useState<null | RenderChangesDiffResult>(null)

  const fetchDiff = useCallback(async () => {
    setPending(true)
    setError(null)
    try {
      // Always compare currently-published vs latest saved draft of the same doc.
      const r = (await serverFunction({
        name: SERVER_FUNCTION_KEY,
        args: {
          collectionSlug,
          docID,
          globalSlug,
        },
      })) as RenderChangesDiffResult
      setResult(r)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[changes-button] failed to render diff', err)
      setError(err instanceof Error ? err.message : getLabel('failedToLoadDiff', i18n.language))
    } finally {
      setPending(false)
    }
  }, [collectionSlug, docID, globalSlug, serverFunction, i18n.language])

  // Fetch on mount.
  useEffect(() => {
    void fetchDiff()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="changes-button__drawer">
      {pending ? <LoadingOverlay /> : null}
      {!pending && error ? <p className="changes-button__error">{error}</p> : null}
      {!pending && !error && result?.notPublishedYet ? (
        <p className="changes-button__empty">{getLabel('notPublishedYet', i18n.language)}</p>
      ) : null}
      {!pending && !error && !result?.notPublishedYet && result?.hasChanges === false ? (
        <p className="changes-button__empty">{getLabel('noChangesToReview', i18n.language)}</p>
      ) : null}
      {!pending && !error && result?.hasChanges ? (
        <div className="changes-button__diff">{result.Diff}</div>
      ) : null}
    </div>
  )
}
