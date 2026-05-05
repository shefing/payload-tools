'use client';

import React from 'react';

import { CreatedAtCellClient, UpdatedAtCellClient } from './index.client.js';

export const CreatedAtCell = (props) => {
  return <CreatedAtCellClient {...props} />;
};

export const UpdatedAtCell = (props) => {
  return <UpdatedAtCellClient {...props} />;
};
