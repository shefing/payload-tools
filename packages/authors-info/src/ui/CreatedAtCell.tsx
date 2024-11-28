'use client';
import React, { Fragment } from 'react';
import moment from 'moment';

interface TableCellProps {
  cellData: any;
}
export const CreatedAtCell: React.FC<TableCellProps> = (props) => {
  const { cellData } = props;
  // Ensure cellData is not null before passing it to moment
  const validCellData = cellData !== null ? cellData : undefined;

  return <Fragment>{validCellData ? moment(validCellData).fromNow() : 'N/A'}</Fragment>;
};
