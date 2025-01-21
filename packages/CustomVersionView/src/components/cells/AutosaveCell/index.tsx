'use client'
/* eslint-disable */
import { Pill, useConfig, useTranslation } from '@payloadcms/ui'
import React, { Fragment } from 'react'

type VersionStatus = 'draft' | 'published';

type AutosaveCellProps = {
  latestDraftVersion?: string
  latestPublishedVersion?: string
  rowData?: {
    autosave?: boolean
    publishedLocale?: string
    version: {
      _status?: string
    }
  }
}

export const renderPill = (data:any, latestVersion:string|undefined, currentLabel:string|'', previousLabel:string|'', pillStyle:any) => {
  return (
    <React.Fragment>
      {data?.id === latestVersion ? (
        <Pill pillStyle={pillStyle}>{currentLabel}</Pill>
      ) : (
        <Pill>{previousLabel}</Pill>
      )}
      &nbsp;&nbsp;
    </React.Fragment>
  )
}

export const AutosaveCell: React.FC<AutosaveCellProps> = ({
  latestDraftVersion,
  latestPublishedVersion,
  rowData = { autosave: undefined, publishedLocale: undefined, version: undefined },
}) => {
  const { i18n, t } = useTranslation()
  
  const {
    config: { localization },
  } = useConfig()

  const publishedLocale = rowData?.publishedLocale || undefined
  //@ts-ignore
  const status: VersionStatus  = rowData?.version?._status 
  let publishedLocalePill = null

  const versionInfo = {
    draft: {
      currentLabel: t('version:currentDraft'),
      latestVersion: latestDraftVersion,
      pillStyle: undefined,
      previousLabel: t('version:draft'),
    },
    published: {
      currentLabel: t('version:currentPublishedVersion'),
      latestVersion: latestPublishedVersion,
      pillStyle: 'success',
      previousLabel: t('version:previouslyPublished'),
    },
  }
  
  const { currentLabel, latestVersion, pillStyle, previousLabel } = versionInfo[status] || {}

  if (localization && localization?.locales && publishedLocale) {
    const localeCode = Array.isArray(publishedLocale) ? publishedLocale[0] : publishedLocale

    const locale = localization.locales.find((loc) => loc.code === localeCode)
    const label = locale?.label; 
    let formattedLabel: string | undefined;

    if (typeof label === 'string') {
      formattedLabel = label;
    } else if (typeof label === 'object' && label !== null) {

      formattedLabel = label[i18n?.language] || label['default'] || Object.values(label)[0]; //when the language is not spicific, take the first value
    }

    if (formattedLabel) {
      publishedLocalePill = <Pill>{formattedLabel}</Pill>
    }
  }

  return (
    <Fragment>
      {rowData?.autosave && <Pill>{t('version:autosave')}</Pill>}
      {status && renderPill(rowData, latestVersion, currentLabel, previousLabel, pillStyle)}
      {publishedLocalePill}
    </Fragment>
  )
}