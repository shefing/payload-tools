import type { I18n } from '@payloadcms/translations'
import type {
  Column,
  PaginatedDocs,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  TypeWithVersion,
} from 'payload'

import { SortColumn } from '@payloadcms/ui'
import React from 'react'

import { AutosaveCell } from './cells/AutosaveCell'
import { CreatedAtCell, type CreatedAtCellProps } from './cells/CreatedAt'
import { IDCell } from './cells/ID'

type Updator = {
  creator?: string | null;
  updator?: string | null;
  process?: string | null;
  createdAt: string;
  updatedAt: string;
  autosave?: boolean | undefined;
  publishedLocale?: string | undefined;
  version: { _status?: string | undefined };
} & TypeWithVersion<string>;

export const buildVersionColumns = ({
                                      collectionConfig,
                                      CreatedAtCellOverride,
                                      currentlyPublishedVersion,
                                      docID,
                                      docs,
                                      globalConfig,
                                      i18n: { t },
                                      isTrashed,
                                      latestDraftVersion,
                                    }: {
  collectionConfig?: SanitizedCollectionConfig
  CreatedAtCellOverride?: React.ComponentType<CreatedAtCellProps>
  currentlyPublishedVersion?: {
    id: number | string
    updatedAt: string
  }
  docID?: number | string
  docs: PaginatedDocs<TypeWithVersion<never>>['docs']
  globalConfig?: SanitizedGlobalConfig
  i18n: I18n
  isTrashed?: boolean
  latestDraftVersion?: {
    id: number | string
    updatedAt: string
  }
}): Column[] => {
  const entityConfig = collectionConfig || globalConfig

  const CreatedAtCellComponent = CreatedAtCellOverride ?? CreatedAtCell

  const columns: Column[] = [
    {
      accessor: 'updatedAt',
      active: true,
      field: {
        name: '',
        type: 'date',
      },
      Heading: <SortColumn Label={t('general:updatedAt')} name="updatedAt" />,
      renderedCells: docs.map((doc, i) => {
        return (
          <CreatedAtCellComponent
            collectionSlug={collectionConfig?.slug}
            docID={docID}
            globalSlug={globalConfig?.slug}
            isTrashed={isTrashed}
            key={i}
            rowData={{
              id: doc.id,
              updatedAt: doc.updatedAt,
            }}
          />
        )
      }),
    },
    {
      accessor: 'id',
      active: true,
      field: {
        name: '',
        type: 'text',
      },
      Heading: <SortColumn disable Label={t('version:versionID')} name="id" />,
      renderedCells: docs.map((doc, i) => {
        return <IDCell id={doc.id} key={i} />
      }),
    },
  ];

  columns.splice(1, 0, {
    accessor: 'updator',
    active: true,
    field: {
      name: '',
      type: 'text',
    },
    Heading: <SortColumn Label={'Updated by'} disable name='updator' />,
    renderedCells: docs.map((doc:Updator, i) => {
      return <IDCell id={doc.updator as string} key={i} />;
    }),
  });
  columns.splice(1, 0, {
    accessor: 'updator',
    active: true,
    field: {
      name: '',
      type: 'text',
    },
    Heading: <SortColumn Label={'Updated by'} disable name='updator' />,
    renderedCells: docs.map((doc:Updator, i) => {
      return <IDCell id={doc.process as string} key={i} />;
    }),
  });
  if (
    entityConfig?.versions?.drafts ||
    (entityConfig?.versions?.drafts && entityConfig.versions.drafts?.autosave)
  ) {
    columns.push({
      accessor: '_status',
      active: true,
      field: {
        name: '',
        type: 'checkbox',
      },
      Heading: <SortColumn disable Label={t('version:status')} name="status" />,
      renderedCells: docs.map((doc, i) => {
        return (
          <AutosaveCell
            currentlyPublishedVersion={currentlyPublishedVersion}
            key={i}
            latestDraftVersion={latestDraftVersion}
            rowData={doc}
          />
        )
      }),
    })
  }

  return columns
}
