'use client'

import type { TFunction } from '@payloadcms/translations'
import { Pill, useConfig, useTranslation } from '@payloadcms/ui'
import { formatDate } from '@payloadcms/ui/shared'
import React from 'react'

import { getVersionLabel } from './getVersionLabel.js'

const baseClass = 'version-pill-label'

const renderPill = (label: React.ReactNode, pillStyle: Parameters<typeof Pill>[0]['pillStyle']) => {
  return (
    <Pill pillStyle={pillStyle} size="small">
      {label}
    </Pill>
  )
}

export const VersionPillLabel: React.FC<{
  currentlyPublishedVersion?: {
    id: number | string
    publishedLocale?: string
    updatedAt: string
    version: {
      updatedAt: string
    }
  }
  disableDate?: boolean

  doc: {
    [key: string]: unknown
    id: number | string
    publishedLocale?: string
    updatedAt?: string
    version: {
      [key: string]: unknown
      _status: 'draft' | 'published'
      updatedAt: string
    }
  }
  /**
   * By default, the date is displayed first, followed by the version label.
   * @default false
   */
  labelFirst?: boolean
  labelOverride?: React.ReactNode
  /**
   * @default 'pill'
   */
  labelStyle?: 'pill' | 'text'
  labelSuffix?: React.ReactNode
  latestDraftVersion?: {
    id: number | string
    updatedAt: string
  }
}> = ({
  currentlyPublishedVersion,
  disableDate = false,
  doc,
  labelFirst = false,
  labelOverride,
  labelStyle = 'pill',
  labelSuffix,
  latestDraftVersion,
}) => {
  const {
    config: {
      admin: { dateFormat },
      localization,
    },
  } = useConfig()
  const { i18n, t } = useTranslation<TFunction>()

  const { label, pillStyle } = getVersionLabel({
    currentlyPublishedVersion,
    latestDraftVersion,
    t: t as Parameters<typeof getVersionLabel>[0]['t'],
    version: doc,
  })
  const labelText: React.ReactNode = (
    <span>
      {labelOverride || label}
      {labelSuffix}
    </span>
  )

  const showDate = !disableDate && doc.updatedAt
  const formattedDate = showDate
    ? formatDate({ date: doc.updatedAt, i18n, pattern: dateFormat })
    : null

  const localeCode = Array.isArray(doc.publishedLocale)
    ? doc.publishedLocale[0]
    : doc.publishedLocale

  const locale =
    localization && localization?.locales
      ? localization.locales.find((loc) => loc.code === localeCode)
      : null
  const localeLabel: string | null = locale
    ? (typeof locale?.label === 'object' ? locale.label[i18n?.language] ?? null : locale?.label ?? null)
    : null

  return (
    <div className={baseClass}>
      {labelFirst ? (
        <React.Fragment>
          {labelStyle === 'pill' ? (
            renderPill(labelText, pillStyle)
          ) : (
            <span className={`${baseClass}-text`}>{labelText}</span>
          )}
          {showDate && <span className={`${baseClass}-date`}>{formattedDate}</span>}
        </React.Fragment>
      ) : (
        <React.Fragment>
          {showDate && <span className={`${baseClass}-date`}>{formattedDate}</span>}
          {labelStyle === 'pill' ? (
            renderPill(labelText, pillStyle)
          ) : (
            <span className={`${baseClass}-text`}>{labelText}</span>
          )}
        </React.Fragment>
      )}
      {localeLabel && <Pill size="small">{localeLabel}</Pill>}
    </div>
  )
}
