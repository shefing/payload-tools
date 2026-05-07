'use client'
import { useTranslation } from '@payloadcms/ui'
import React from 'react'

import type { CompareFrom } from '../../server/renderChangesDiff.js'

import { getLabel } from '../../labels.js'

export type CompareSourceToggleProps = {
  availableSources: CompareFrom[]
  onChange: (next: CompareFrom) => void
  value: CompareFrom
}

/**
 * Small segmented control switching between `'unsaved'` and `'latestDraft'`
 * compare sources. Only renders when both sources are available.
 */
export const CompareSourceToggle: React.FC<CompareSourceToggleProps> = ({
  availableSources,
  onChange,
  value,
}) => {
  const { i18n } = useTranslation()
  if (availableSources.length < 2) {
    return null
  }
  return (
    <div className="changes-button__compare-toggle" role="tablist">
      <button
        aria-selected={value === 'unsaved'}
        className={`changes-button__compare-toggle__option${
          value === 'unsaved' ? ' changes-button__compare-toggle__option--active' : ''
        }`}
        onClick={() => onChange('unsaved')}
        role="tab"
        type="button"
      >
        {getLabel('toggleUnsaved', i18n.language)}
      </button>
      <button
        aria-selected={value === 'latestDraft'}
        className={`changes-button__compare-toggle__option${
          value === 'latestDraft' ? ' changes-button__compare-toggle__option--active' : ''
        }`}
        onClick={() => onChange('latestDraft')}
        role="tab"
        type="button"
      >
        {getLabel('toggleLatestDraft', i18n.language)}
      </button>
    </div>
  )
}
