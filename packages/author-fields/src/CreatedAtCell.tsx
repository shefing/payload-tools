'use client'
import { useTableCell } from '@payloadcms/ui'
import React, { Fragment } from 'react'
import moment from 'moment'

export const CreatedAtCell: React.FC = () => {
  const { cellData } = useTableCell()
  // Ensure cellData is not null before passing it to moment
  const validCellData = cellData !== null ? cellData : undefined

  return <Fragment>{validCellData ? moment(validCellData).fromNow() : 'N/A'}</Fragment>
}
