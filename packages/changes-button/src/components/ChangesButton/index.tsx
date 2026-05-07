'use client'
import {
  Button,
  useConfig,
  useDocumentInfo,
  useForm,
  useFormModified,
  useModal,
  useTranslation,
} from '@payloadcms/ui'
import { hasDraftsEnabled } from 'payload/shared'
import React from 'react'

import { getLabel } from '../../labels.js'
import { useChangesDrawer } from '../ChangesDrawer'

/**
 * `ChangesButton` is the entry-point client component referenced from
 * `config.admin.components.edit.beforeDocumentControls` (injected by
 * `changesButtonPlugin`).
 *
 * Visibility rules — the button renders `null` unless ALL are true:
 * - Entity has drafts enabled (`hasDraftsEnabled(entity)`).
 * - User has publish permission (`useDocumentInfo().hasPublishPermission`).
 * - Document is not in trash.
 * - For collections: the document has been saved at least once (`docID`
 *   is defined). For globals: always (globals always have an implicit id).
 *
 * The diff itself always compares the currently-published version against
 * the latest saved draft of this same document. If the user has unsaved
 * edits when the button is clicked, the form is saved as a draft first so
 * the diff reflects the just-saved content (per issue #4 and #5).
 */
export const ChangesButton: React.FC = () => {
  const {
    collectionSlug,
    globalSlug,
    hasPublishedDoc,
    hasPublishPermission,
    id: docID,
    isTrashed,
    unpublishedVersionCount,
    uploadStatus,
  } = useDocumentInfo()
  const modified = useFormModified()
  const { getEntityConfig } = useConfig()
  const { i18n } = useTranslation()
  const { submit } = useForm()

  const entity = collectionSlug
    ? getEntityConfig({ collectionSlug })
    : globalSlug
      ? getEntityConfig({ globalSlug })
      : null

  const draftsEnabled = entity ? hasDraftsEnabled(entity as Parameters<typeof hasDraftsEnabled>[0]) : false

  // Globals don't have a `docID` per se but always have a stable identity;
  // for collections we require an `id` so the comparison is scoped to a
  // specific document (otherwise `findVersions` returns the latest version
  // of *any* doc — see issue #2).
  const hasIdentity = Boolean(globalSlug) || Boolean(docID)

  // Mirror PublishButton's `canPublish` gate so the Changes button is
  // visible exactly when Publish is enabled. PublishButton uses:
  //   hasPublishPermission && (modified || hasNewerVersions || !hasPublishedDoc)
  //   && uploadStatus !== 'uploading'
  // (see @payloadcms/ui/src/elements/PublishButton/index.tsx).
  const hasNewerVersions = (unpublishedVersionCount ?? 0) > 0
  const canPublish =
    Boolean(hasPublishPermission) &&
    (modified || hasNewerVersions || !hasPublishedDoc) &&
    uploadStatus !== 'uploading'

  const visible = draftsEnabled && canPublish && !isTrashed && hasIdentity

  const { Drawer: ChangesDrawerInstance, drawerSlug } = useChangesDrawer({
    collectionSlug,
    docID,
    globalSlug,
  })

  const { openModal } = useModal()

  const [busy, setBusy] = React.useState(false)

  const handleClick = React.useCallback(async () => {
    if (busy) {
      return
    }
    // If the user has unsaved edits, save them as a draft first so the
    // server-side diff reflects the latest content (issue #4). The form
    // submit flow updates `unpublishedVersionCount` and persists the draft;
    // the drawer will then re-fetch the diff against the freshly saved doc.
    if (modified) {
      try {
        setBusy(true)
        await submit({
          overrides: { _status: 'draft' },
          skipValidation: true,
        })
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[changes-button] failed to save draft before opening diff', err)
        // Fall through to opening the drawer anyway — the user will see the
        // last persisted state vs published.
      } finally {
        setBusy(false)
      }
    }
    openModal(drawerSlug)
  }, [busy, modified, openModal, drawerSlug, submit])

  if (!visible) {
    return null
  }

  return (
    <React.Fragment>
      <Button
        buttonStyle="secondary"
        className="changes-button"
        disabled={busy}
        onClick={() => {
          void handleClick()
        }}
        size="medium"
      >
        {getLabel('changes', i18n.language)}
      </Button>
      <ChangesDrawerInstance />
    </React.Fragment>
  )
}

export default ChangesButton
