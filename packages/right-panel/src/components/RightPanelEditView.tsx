import type { EditViewComponent, PayloadServerReactComponent } from 'payload';
import { DefaultEditView as EditView } from '@payloadcms/ui';
import React from 'react';
import RightPanelDocumentWrapper from './RightPanelDocumentWrapper.js';
import '../styles/custom.css';
const RightPanelEditView: PayloadServerReactComponent<EditViewComponent> = () => {
  const headerHeight = 120;
  return (
    <div className='right-panel-edit-view'>
      <div id='edit-view' className='flex overflow-auto'>
        <EditView />
      </div>
      <RightPanelDocumentWrapper />
    </div>
  );
};
export default RightPanelEditView;
