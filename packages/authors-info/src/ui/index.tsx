'use client';

import React from 'react';

import { TableCellProps, CreatedAtCellClient } from './index.client.js';

export const CreatedAtCell = (props) => {
  return <CreatedAtCellClient cellData={props} fieldKey='createdAt' />;
};

export const UpdatedAtCell = (props) => {
  return <CreatedAtCellClient cellData={props} fieldKey='updatedAt' />;
};
