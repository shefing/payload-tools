'use client';
import React, { Fragment } from 'react';
import moment from 'moment';
import { useLocale } from '@payloadcms/ui'

export interface TableCellProps {
  cellData: any;
  fieldKey: 'createdAt' | 'updatedAt';
}

export const CreatedAtCellClient: React.FC<TableCellProps> = (props) => {
  const { cellData, fieldKey } = props;
  const locale = useLocale()
  moment.locale(locale.code);

  // Ensure cellData is not null before passing it to moment
  const validCellData = cellData?.rowData?.[fieldKey] ?? null;

  const fromNow = validCellData ? moment(validCellData,locale.code).fromNow() : 'N/A';

  return <Fragment>{validCellData ? fromNow : 'N/A'}</Fragment>;
};
