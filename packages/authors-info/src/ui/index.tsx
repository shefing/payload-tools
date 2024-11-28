import React from 'react';

import { TableCellProps, CreatedAtCellClient } from './index.client.js';

export const CreatedAtCell: React.FC<TableCellProps> = (props) => {
  return <CreatedAtCellClient cellData={props} />;
};
