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
 * - There is something publishable (unsaved edits, newer draft version, or
 *   not yet published).
 *
 * UX:
 * - When the form has unsaved edits, clicking Changes opens the drawer
 *   immediately and the diff is computed against the *in-memory* form
 *   values (sent to the server as `formData`). No draft save happens,
 *   so there is no form-state churn, no router refresh, and no risk of
 *   the modal being torn down mid-render. The user can review the diff
 *   without first clicking "Save Draft".
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
  const { getData } = useForm()

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

  // Mirror PublishButton's `canPublish` gate (modified || hasNewerVersions
  // || !hasPublishedDoc) so the Changes button shows whenever Publish would.
  const hasNewerVersions = (unpublishedVersionCount ?? 0) > 0
  const canPublish =
    Boolean(hasPublishPermission) &&
    (modified || hasNewerVersions || !hasPublishedDoc) &&
    uploadStatus !== 'uploading'

  const visible = draftsEnabled && !isTrashed && hasIdentity && canPublish

  // When the user clicks Changes while the form is dirty, snapshot the
  // in-memory form values and hand them to the drawer as `formData`. The
  // server-side diff handler uses that as the right-hand ("after") side
  // of the diff instead of the latest persisted draft, so we never need
  // to call `submit()` here — avoiding the regression where the draft
  // save's form-state churn / router refresh tore down the modal.
  const formDataRef = React.useRef<null | Record<string, unknown>>(null)

  const formDataProvider = React.useCallback(() => formDataRef.current, [])

  const { Drawer: ChangesDrawerInstance, drawerSlug } = useChangesDrawer({
    collectionSlug,
    docID,
    globalSlug,
    formDataProvider,
  })

  const { openModal } = useModal()

  const handleClick = React.useCallback(() => {
    formDataRef.current = modified ? (getData() as Record<string, unknown>) : null
    openModal(drawerSlug)
  }, [modified, getData, openModal, drawerSlug])

  if (!visible) {
    return null
  }

  return (
    <React.Fragment>
      <Button
        buttonStyle="secondary"
        className="changes-button"
        onClick={handleClick}
        size="medium"
      >
        {getLabel('changes', i18n.language)}
      </Button>
      <ChangesDrawerInstance />
    </React.Fragment>
  )
}

export default ChangesButton
