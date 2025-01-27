'use client';

import { useModal } from '@faceless-ui/modal';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import type { DocumentDrawerProps } from '../types.js';
import { LoadingOverlay } from '@payloadcms/ui';
/*
import { useConfig } from '@payloadcms/ui'
*/
import { useServerFunctions } from '@payloadcms/ui';
import { useTranslation } from '@payloadcms/ui';
import { abortAndIgnore } from '@payloadcms/ui/shared';
import { DocumentDrawerContextProvider } from './Provider.js';

import { useRelatedCollections } from '../useRelatedCollections.js';
import { useCustomContext } from '../providers/CustomContext.js';
import { useStepNav } from '@payloadcms/ui';
import { XIcon } from '@payloadcms/ui/icons/X';

export const DocumentDrawerContent: React.FC<DocumentDrawerProps> = ({
  id: existingDocID,
  collectionSlug,
  disableActions,
  drawerSlug,
  initialData,
  onDelete: onDeleteFromProps,
  onDuplicate: onDuplicateFromProps,
  onSave: onSaveFromProps,
  redirectAfterDelete,
  redirectAfterDuplicate,
}) => {
  /*  const {
    config: { collections },
  } = useConfig()*/
  const { setIsRightPanelOpen, prevStepNav } = useCustomContext();
  const { stepNav, setStepNav } = useStepNav();

  /*  const [collectionConfig] = useState(() =>

    collections.find((collection) => collection.slug === collectionSlug),
  )*/
  const [collectionConfig] = useRelatedCollections(collectionSlug);

  const documentViewAbortControllerRef = React.useRef<AbortController>(null);

  const { closeModal } = useModal();
  const { t } = useTranslation();

  /*
  const [isOpen, setIsOpen] = useState(false)
*/

  const { renderDocument } = useServerFunctions();

  const [DocumentView, setDocumentView] = useState<React.ReactNode>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const hasRenderedDocument = useRef(false);
  const baseClass = 'doc-drawer';

  const getDocumentView = useCallback(
    (docID?: number | string) => {
      abortAndIgnore(documentViewAbortControllerRef.current as AbortController);

      const controller = new AbortController();
      documentViewAbortControllerRef.current = controller;

      const fetchDocumentView = async () => {
        setIsLoading(true);

        try {
          const result = await renderDocument({
            collectionSlug,
            disableActions: true,
            docID,
            drawerSlug: undefined,
            initialData,
            redirectAfterDelete: redirectAfterDelete !== undefined ? redirectAfterDelete : false,
            redirectAfterDuplicate:
              redirectAfterDuplicate !== undefined ? redirectAfterDuplicate : false,
            signal: controller.signal,
          });

          if (result?.Document) {
            setDocumentView(result.Document);
            setIsLoading(false);
          }
        } catch (error: unknown) {
          toast.error((error as Error)?.message || t('error:unspecific'));
          closeModal(drawerSlug as string);
          // toast.error(data?.errors?.[0].message || t('error:unspecific'))
        }
      };

      void fetchDocumentView();
    },
    [
      collectionSlug,
      disableActions,
      drawerSlug,
      initialData,
      redirectAfterDelete,
      redirectAfterDuplicate,
      renderDocument,
      closeModal,
      t,
    ],
  );

  const onSave = useCallback<DocumentDrawerProps['onSave']>(
    (args) => {
      getDocumentView(args.doc.id);

      if (typeof onSaveFromProps === 'function') {
        void onSaveFromProps({
          ...args,
          collectionConfig,
        });
      }
    },
    [onSaveFromProps, collectionConfig, getDocumentView],
  );

  const onDuplicate = useCallback<DocumentDrawerProps['onDuplicate']>(
    (args) => {
      getDocumentView(args.doc.id);

      if (typeof onDuplicateFromProps === 'function') {
        void onDuplicateFromProps({
          ...args,
          collectionConfig,
        });
      }
    },
    [onDuplicateFromProps, collectionConfig, getDocumentView],
  );

  const onDelete = useCallback<DocumentDrawerProps['onDelete']>(
    (args) => {
      if (typeof onDeleteFromProps === 'function') {
        void onDeleteFromProps({
          ...args,
          collectionConfig,
        });
      }

      closeModal(drawerSlug as string);
    },
    [onDeleteFromProps, closeModal, drawerSlug, collectionConfig],
  );

  const clearDoc = useCallback(() => {
    getDocumentView();
  }, [getDocumentView]);

  useEffect(() => {
    if (!DocumentView && !hasRenderedDocument.current) {
      getDocumentView(existingDocID as number);
      hasRenderedDocument.current = true;
    }
  }, [DocumentView, getDocumentView, existingDocID]);

  // Cleanup any pending requests when the component unmounts
  useEffect(() => {
    return () => {
      abortAndIgnore(documentViewAbortControllerRef.current as AbortController);
    };
  }, []);

  useEffect(() => {
    if (stepNav[0].label != prevStepNav[0]?.label) {
      setStepNav(prevStepNav);
    }
  }, [stepNav]);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <DocumentDrawerContextProvider
      clearDoc={clearDoc}
      drawerSlug={drawerSlug as string}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onSave={onSave}
    >
      <button
        aria-label={t('general:close')}
        className='doc-drawer__header-close right-panel-close'
        onClick={() => setIsRightPanelOpen(false)}
        type='button'
      >
        <XIcon />
      </button>
      {DocumentView}
    </DocumentDrawerContextProvider>
  );
};
