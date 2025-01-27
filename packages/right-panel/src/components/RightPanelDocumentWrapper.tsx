'use client'; // This directive ensures the component is a client component

import React, { useEffect } from 'react';
import { DocumentDrawerContent } from './DocumentView.js';
import { useNav } from '@payloadcms/ui';
import { useCustomContext } from '../providers/CustomContext.js';

const RightPanelDocumentWrapper: React.FC = () => {
  const { isRightPanelOpen, collection, id, resetRightPanel } = useCustomContext();
  const { setNavOpen } = useNav();

  useEffect(() => {
    setNavOpen(false);
    document.body.style.overflowY = 'hidden';

    return () => {
      resetRightPanel();
      document.body.style.overflowY = 'auto';
    };
  }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const editViewElement = document.getElementById('edit-view');
    if (editViewElement) {
      editViewElement.style.width = isRightPanelOpen ? '50%' : '100%';
    }
  }, [isRightPanelOpen]);

  return isRightPanelOpen ? (
    <div className='rightpanel'>
      {<DocumentDrawerContent Header={null} collectionSlug={collection} id={id} />}
    </div>
  ) : null;
};

export default RightPanelDocumentWrapper;
