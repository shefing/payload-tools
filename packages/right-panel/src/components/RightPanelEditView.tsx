import { DefaultEditView as EditView } from '@payloadcms/ui';
import React from 'react';
import RightPanelDocumentWrapper from './RightPanelDocumentWrapper.js';
import '../styles/custom.css';

interface RightPanelEditViewProps {
  searchParams?: Record<string, string>;
}

const RightPanelEditView: React.FC<RightPanelEditViewProps> = ({ searchParams }) => {
  const isDrawer = searchParams?.inRightPanel === '1';
  return (
    <div className='right-panel-edit-view'>
      <div id='edit-view' className='flex overflow-auto'>
        {/* @ts-expect-error – DefaultEditView props changed in Payload 3.84.1; props are injected by Payload at runtime */}
        <EditView />
      </div>
      {!isDrawer && <RightPanelDocumentWrapper />}
    </div>
  );
};
export default RightPanelEditView;
