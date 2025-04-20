'use client';
import React, { Fragment } from 'react';
import moment from 'moment';
import 'moment/locale/he';
export interface TableCellProps {
  cellData: any;
  fieldKey: 'createdAt' | 'updatedAt';
}

export const CreatedAtCellClient: React.FC<TableCellProps> = (props) => {
  const { cellData, fieldKey } = props;
  moment.locale('he');

  // Ensure cellData is not null before passing it to moment
  const validCellData = cellData?.rowData?.[fieldKey] ?? null;

  const fromNow = validCellData ? moment(validCellData).fromNow() : 'N/A';

  return <Fragment>{validCellData ? fromNow : 'N/A'}</Fragment>;
};
