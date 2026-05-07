'use client'
import {
  Drawer,
  formatDrawerSlug,
  LoadingOverlay,
  useEditDepth,
  useForm,
  useFormModified,
  useServerFunctions,
  useTranslation,
} from '@payloadcms/ui'
import React, { useCallback, useEffect, useId, useMemo, useState } from 'react'

import type { CompareFrom, RenderChangesDiffResult } from '../../server/renderChangesDiff.js'

import { getLabel, SERVER_FUNCTION_KEY } from '../../labels.js'
import { CompareSourceToggle } from './CompareSourceToggle.js'

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
  const modified = useFormModified()
  const { getData } = useForm()
  const { i18n } = useTranslation()

  const initialCompareFrom: CompareFrom = modified ? 'unsaved' : 'latestDraft'
  const [compareFrom, setCompareFrom] = useState<CompareFrom>(initialCompareFrom)
  const [pending, setPending] = useState<boolean>(true)
  const [error, setError] = useState<null | string>(null)
  const [result, setResult] = useState<null | RenderChangesDiffResult>(null)

  const fetchDiff = useCallback(
    async (next: CompareFrom) => {
      setPending(true)
      setError(null)
      try {
        const formData = next === 'unsaved' ? (getData() as Record<string, unknown>) : undefined
        const r = (await serverFunction({
          name: SERVER_FUNCTION_KEY,
          args: {
            collectionSlug,
            compareFrom: next,
            docID,
            formData,
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
    },
    [collectionSlug, docID, getData, globalSlug, serverFunction, i18n.language],
  )

  // Initial fetch on mount.
  useEffect(() => {
    void fetchDiff(initialCompareFrom)
    // Run once on mount; subsequent updates flow through `handleToggle`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleToggle = useCallback(
    (next: CompareFrom) => {
      if (next === compareFrom) {
        return
      }
      setCompareFrom(next)
      void fetchDiff(next)
    },
    [compareFrom, fetchDiff],
  )

  return (
    <div className="changes-button__drawer">
      {result?.availableSources && modified ? (
        <CompareSourceToggle
          availableSources={result.availableSources}
          onChange={handleToggle}
          value={compareFrom}
        />
      ) : null}
      {pending ? <LoadingOverlay /> : null}
      {!pending && error ? <p className="changes-button__error">{error}</p> : null}
      {!pending && !error && result?.hasChanges === false ? (
        <p className="changes-button__empty">{getLabel('noChangesToReview', i18n.language)}</p>
      ) : null}
      {!pending && !error && result?.hasChanges ? (
        <div className="changes-button__diff">{result.Diff}</div>
      ) : null}
    </div>
  )
}
