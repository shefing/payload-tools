'use client';
import React from 'react';
import moment from 'moment';
import { DefaultCell, useLocale } from '@payloadcms/ui'
import type { DateFieldClient, DefaultCellComponentProps } from 'payload'

export type DateCellProps = DefaultCellComponentProps<DateFieldClient>

export const CreatedAtCellClient: React.FC<DateCellProps> = (props) => {
  const locale = useLocale();
  moment.locale(locale.code);

  // @ts-ignore
  const rawDate = props?.cellData ?? props?.rowData?.createdAt ?? null;
  const fullFormatted = rawDate ? moment(rawDate).format('LLLL') : '';

  return (
    <span title={fullFormatted}>
      <DefaultCell {...props} />
    </span>
  );
};

export const UpdatedAtCellClient: React.FC<DateCellProps> = (props) => {
  const locale = useLocale();
  moment.locale(locale.code);

  // @ts-ignore
  const rawDate = props?.cellData ?? props?.rowData?.updatedAt ?? null;
  const fullFormatted = rawDate ? moment(rawDate).format('LLLL') : '';

  return (
    <span title={fullFormatted}>
      <DefaultCell {...props} />
    </span>
  );
};
