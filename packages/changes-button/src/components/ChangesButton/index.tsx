'use client'
import {
  Button,
  useConfig,
  useDocumentInfo,
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
 * - There are unpublished changes — either the form is `modified`
 *   (in-progress unsaved edits) or `unpublishedVersionCount > 0` (saved
 *   draft ahead of the published version). For brand-new entities (no
 *   published baseline yet) the diff renders against an empty baseline so
 *   the user can still review what would be published.
 */
export const ChangesButton: React.FC = () => {
  const {
    collectionSlug,
    globalSlug,
    hasPublishPermission,
    id: docID,
    isTrashed,
    unpublishedVersionCount,
  } = useDocumentInfo()
  const modified = useFormModified()
  const { getEntityConfig } = useConfig()
  const { i18n } = useTranslation()

  const entity = collectionSlug
    ? getEntityConfig({ collectionSlug })
    : globalSlug
      ? getEntityConfig({ globalSlug })
      : null

  const draftsEnabled = entity ? hasDraftsEnabled(entity as Parameters<typeof hasDraftsEnabled>[0]) : false

  const hasUnpublishedChanges = Boolean(modified) || (unpublishedVersionCount ?? 0) > 0

  const visible =
    draftsEnabled &&
    Boolean(hasPublishPermission) &&
    !isTrashed &&
    hasUnpublishedChanges

  const { Drawer: ChangesDrawerInstance, drawerSlug } = useChangesDrawer({
    collectionSlug,
    docID,
    globalSlug,
  })

  const { openModal } = useModal()

  if (!visible) {
    return null
  }

  return (
    <React.Fragment>
      <Button
        buttonStyle="secondary"
        className="changes-button"
        onClick={() => openModal(drawerSlug)}
        size="medium"
      >
        {getLabel('changes', i18n.language)}
      </Button>
      <ChangesDrawerInstance />
    </React.Fragment>
  )
}

export default ChangesButton
