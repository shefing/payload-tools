'use client';
import { createContext, useContext, useEffect, useState } from 'react';
/* eslint-disable */
interface ICustomContext {
  lastFocusedLexicalEditor: string;
  setLastFocusedLexicalEditor: (value: string) => void;
  showComments: boolean;
  setShowComments: (value: boolean) => void;
  isRightPanelOpen: boolean;
  setIsRightPanelOpen: (value: boolean) => void;
  collection: string;
  setCollection: (value: string) => void;
  id: string;
  setId: (value: string) => void;
  resetRightPanel: () => void;
  prevStepNav: any[];
  setPrevStepNav: (value: any) => void;
  inRightPanel: boolean;
  setInRightPanel: (value: boolean) => void;
}
export const CustomContext = createContext<ICustomContext>({
  lastFocusedLexicalEditor: '',
  setLastFocusedLexicalEditor: () => null,
  showComments: false,
  setShowComments: () => null,
  isRightPanelOpen: false,
  setIsRightPanelOpen: () => null,
  collection: '',
  setCollection: () => null,
  id: '',
  setId: () => null,
  resetRightPanel: () => null,
  prevStepNav: [],
  setPrevStepNav: () => null,
  inRightPanel: false,
  setInRightPanel: () => null,
});
export const CustomContextProvider = ({ children }) => {
  const [lastFocusedLexicalEditor, setLastFocusedLexicalEditor] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [collection, setCollection] = useState('');
  const [id, setId] = useState('');
  const [prevStepNav, setPrevStepNav] = useState([]);
  const [inRightPanel, setInRightPanel] = useState(false);

  const resetRightPanel = () => {
    setCollection('');
    setId('');
    setIsRightPanelOpen(false);
    setPrevStepNav([]);
  };

  useEffect(() => {
    showComments && setIsRightPanelOpen(false);
  }, [showComments]);

  useEffect(() => {
    isRightPanelOpen && setShowComments(false);
  }, [isRightPanelOpen]);

  return (
    <CustomContext.Provider
      value={{
        lastFocusedLexicalEditor,
        setLastFocusedLexicalEditor,
        showComments,
        setShowComments,
        isRightPanelOpen,
        setIsRightPanelOpen,
        id,
        setId,
        collection,
        setCollection,
        resetRightPanel,
        prevStepNav,
        setPrevStepNav,
        inRightPanel,
        setInRightPanel,
      }}
    >
      {children}
    </CustomContext.Provider>
  );
};

export const useCustomContext = () => useContext(CustomContext);
