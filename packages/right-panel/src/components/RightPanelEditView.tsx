import { DefaultEditView as EditView } from '@payloadcms/ui';
import React from 'react';
import RightPanelDocumentWrapper from './RightPanelDocumentWrapper.js';
import '../styles/custom.css';
const RightPanelEditView: React.FC = () => {
  const headerHeight = 120;
  return (
    <div className='right-panel-edit-view'>
      <div id='edit-view' className='flex overflow-auto'>
        {/* @ts-expect-error – DefaultEditView props changed in Payload 3.84.1; props are injected by Payload at runtime */}
        <EditView />
      </div>
      <RightPanelDocumentWrapper />
    </div>
  );
};
export default RightPanelEditView;
