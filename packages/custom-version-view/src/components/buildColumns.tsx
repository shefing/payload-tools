import type { I18n } from '@payloadcms/translations';
import type {
  PaginatedDocs,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
  TypeWithVersion,
} from 'payload';

import { type Column, SortColumn } from '@payloadcms/ui';
import React from 'react';

import { AutosaveCell } from './cells/AutosaveCell/index.js';
import { CreatedAtCell } from './cells/CreatedAt/index.js';
import { IDCell } from './cells/ID/index.js';

type Updator = {
  creator?: string | null;
  updator?: string | null;
  createdAt: string;
  updatedAt: string;
  autosave?: boolean | undefined;
  publishedLocale?: string | undefined;
  version: { _status?: string | undefined };
} & TypeWithVersion<string>;

export const buildVersionColumns = ({
  collectionConfig,
  docID,
  docs,
  globalConfig,
  i18n: { t },
  latestDraftVersion,
  latestPublishedVersion,
}: {
  collectionConfig?: SanitizedCollectionConfig;
  config: SanitizedConfig;
  docID?: number | string;
  ///* eslint-disable @typescript-eslint/ban-ts-comment */@typescript-eslint/no-explicit-any
  docs: PaginatedDocs<Updator>['docs'];
  globalConfig?: SanitizedGlobalConfig;
  i18n: I18n;
  latestDraftVersion?: string;
  latestPublishedVersion?: string;
}): Column[] => {
  const entityConfig = collectionConfig || globalConfig;
  const columns: Column[] = [
    {
      accessor: 'updatedAt',
      active: true,
      field: {
        name: '',
        type: 'date',
      },
      Heading: <SortColumn Label={t('general:updatedAt')} name='updatedAt' />,

      renderedCells: docs.map((doc, i) => {
        return (
          <CreatedAtCell
            collectionSlug={collectionConfig?.slug}
            docID={docID}
            globalSlug={globalConfig?.slug}
            key={i}
            rowData={{
              id: doc.id,
              updatedAt: doc.updatedAt,
            }}
          />
        );
      }),
    },
    {
      accessor: 'id',
      active: true,
      field: {
        name: '',
        type: 'text',
      },
      Heading: <SortColumn disable Label={t('version:versionID')} name='id' />,
      renderedCells: docs.map((doc, i) => {
        return <IDCell id={doc.id} key={i} />;
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
    renderedCells: docs.map((doc, i) => {
      return <IDCell id={doc.updator as string} key={i} />;
    }),
  });

  if (
    entityConfig?.versions?.drafts ||
    (entityConfig?.versions?.drafts && entityConfig.versions.drafts?.autosave)
  ) {
    columns.splice(2, 0, {
      accessor: '_status',
      active: true,
      field: {
        name: '',
        type: 'checkbox',
      },
      Heading: <SortColumn disable Label={t('version:status')} name='status' />,
      renderedCells: docs.map((doc, i) => {
        return (
          <AutosaveCell
            key={i}
            latestDraftVersion={latestDraftVersion}
            latestPublishedVersion={latestPublishedVersion}
            rowData={doc}
          />
        );
      }),
    });
  }

  return columns;
};
