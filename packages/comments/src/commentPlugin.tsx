'use client';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { mergeRegister, registerNestedElementResolver } from '@lexical/utils';
import { PluginComponent } from '@payloadcms/richtext-lexical';
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_EDITOR,
  NodeKey,
  RangeSelection,
} from 'lexical';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Thread, Comment, CommentStore, useCommentStore, Comments } from './commenting';
import { CommentInputBox, CommentsPanel } from './index';
import {
  $createMarkNode,
  $getMarkIDs,
  $isMarkNode,
  $unwrapMarkNode,
  $wrapSelectionInMarkNode,
  MarkNode,
} from '@lexical/mark';
import { INSERT_INLINE_COMMAND } from '.';
import { createPortal } from 'react-dom';

import { useField } from '@payloadcms/ui';

import { useCustomContext } from './providers/CustomContext';

export const CommentPlugin: PluginComponent = (props) => {
  const { value, setValue } = useField<string>({
    path: `comments`,
  });
  //@ts-expect-error props
  const { path } = props;

  const [editor] = useLexicalComposerContext();
  const initalComments = value ? (JSON.parse(value)[path] ? JSON.parse(value)[path] : []) : [];
  const commentStore: CommentStore = useMemo(
    () => new CommentStore(editor, initalComments),
    [editor],
  );
  commentStore.registerOnChange(() => {
    const allComments: Map<string, Comments> = value ? JSON.parse(value) : new Map();
    allComments[path] = commentStore.getComments();
    setValue(JSON.stringify(allComments));
  });
  const comments = useCommentStore(commentStore);
  const sortedComments = sortComments();
  const markNodeMap = useMemo<Map<string, Set<NodeKey>>>(() => {
    return new Map();
  }, []);
  const [activeAnchorKey, setActiveAnchorKey] = useState<NodeKey | null>();
  const [activeIDs, setActiveIDs] = useState<Array<string>>([]);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { lastFocusedLexicalEditor, setLastFocusedLexicalEditor } = useCustomContext();
  const [position, setPosition] = useState({ top: 0 });

  useEffect(() => {
    if (activeAnchorKey) {
      const selectDomNode = editor.getElementByKey(activeAnchorKey);
      if (selectDomNode) {
        const { top, height } = selectDomNode.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        if (viewportHeight - top - height >= 210) {
          setPosition({ top: 0 });
        } else {
          setPosition({ top: -260 });
        }
      }
    }
  }, [activeAnchorKey]);

  useEffect(() => {
    setIsFocused(path === lastFocusedLexicalEditor);
  }, [lastFocusedLexicalEditor]);

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) {
      return;
    }
    const handleFocus = () => {
      setLastFocusedLexicalEditor(path);
    };
    rootElement.addEventListener('focus', handleFocus);
    // Clean up the event listeners when the component unmounts
    return () => {
      rootElement.removeEventListener('focus', handleFocus);
    };
  }, [editor]);

  function sortComments(): Comments {
    /* eslint-disable */
    const sortedCommentsList: any[] = [];

    const traverseTree = (node: any, collectedNodes: any[]) => {
      if (node.type === 'mark') {
        collectedNodes.push(node);
      }
      if (node.children) {
        node.children.forEach((childNode: any) => traverseTree(childNode, collectedNodes));
      }
    };
    const serializedState = editor.getEditorState().toJSON();
    const extractMarkNodes: any[] = [];

    if (serializedState?.root) {
      traverseTree(serializedState.root, extractMarkNodes);
    }
    extractMarkNodes.forEach((node) => {
      comments.find((commentOrThread) => {
        if (node.ids[0] == commentOrThread.id) {
          if (!sortedCommentsList.includes(commentOrThread))
            sortedCommentsList.push(commentOrThread);
        }
      });
    });
    /* eslint-enable */
    return sortedCommentsList;
  }

  const cancelAddComment = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();

      if (selection !== null) {
        selection.dirty = true;
      }
    });
    setShowCommentInput(false);
  }, [editor]);

  const deleteCommentOrThread = useCallback(
    (comment: Comment | Thread, thread?: Thread) => {
      if (comment.type === 'comment') {
        const deletionInfo = commentStore.deleteCommentOrThread(comment, thread);
        if (!deletionInfo) {
          return;
        }
        const { markedComment, index } = deletionInfo;
        commentStore.addComment(markedComment, thread, index);
      } else {
        commentStore.deleteCommentOrThread(comment);
        // Remove ids from associated marks
        const id = thread !== undefined ? thread.id : comment.id;
        const markNodeKeys = markNodeMap.get(id);
        if (markNodeKeys !== undefined) {
          // Do async to avoid causing a React infinite loop
          setTimeout(() => {
            editor.update(() => {
              for (const key of markNodeKeys) {
                const node: null | MarkNode = $getNodeByKey(key);
                if ($isMarkNode(node)) {
                  node.deleteID(id);
                  if (node.getIDs().length === 0) {
                    $unwrapMarkNode(node);
                  }
                }
              }
            });
          });
        }
      }
    },
    [commentStore, editor, markNodeMap],
  );

  const submitAddComment = useCallback(
    (
      commentOrThread: Comment | Thread,
      isInlineComment: boolean,
      thread?: Thread,
      selection?: RangeSelection | null,
    ) => {
      commentStore.addComment(commentOrThread, thread);
      if (isInlineComment) {
        editor.update(() => {
          if ($isRangeSelection(selection)) {
            const isBackward = selection.isBackward();
            const id = commentOrThread.id;

            // Wrap content in a MarkNode
            $wrapSelectionInMarkNode(selection, isBackward, id);
          }
        });
        setShowCommentInput(false);
      }
    },
    [commentStore, editor],
  );

  useEffect(() => {
    const changedElems: Array<HTMLElement> = [];
    for (let i = 0; i < activeIDs.length; i++) {
      const id = activeIDs[i];
      const keys = markNodeMap.get(id);
      if (keys !== undefined) {
        for (const key of keys) {
          const elem = editor.getElementByKey(key);
          if (elem !== null) {
            elem.classList.add('selected');
            changedElems.push(elem);
            setShowComments(true);
          }
        }
      }
    }
    return () => {
      for (let i = 0; i < changedElems.length; i++) {
        const changedElem = changedElems[i];
        changedElem.classList.remove('selected');
      }
    };
  }, [activeIDs, editor, markNodeMap]);

  useEffect(() => {
    const markNodeKeysToIDs: Map<NodeKey, Array<string>> = new Map();

    return mergeRegister(
      registerNestedElementResolver<MarkNode>(
        editor,
        MarkNode,
        (from: MarkNode) => {
          return $createMarkNode(from.getIDs());
        },
        (from: MarkNode, to: MarkNode) => {
          // Merge the IDs
          const ids = from.getIDs();
          ids.forEach((id) => {
            to.addID(id);
          });
        },
      ),
      editor.registerMutationListener(
        MarkNode,
        (mutations) => {
          editor.getEditorState().read(() => {
            for (const [key, mutation] of mutations) {
              const node: null | MarkNode = $getNodeByKey(key);
              let ids: NodeKey[] = [];

              if (mutation === 'destroyed') {
                ids = markNodeKeysToIDs.get(key) || [];
              } else if ($isMarkNode(node)) {
                ids = node.getIDs();
              }

              for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                let markNodeKeys = markNodeMap.get(id);
                markNodeKeysToIDs.set(key, ids);

                if (mutation === 'destroyed') {
                  if (markNodeKeys !== undefined) {
                    markNodeKeys.delete(key);
                    if (markNodeKeys.size === 0) {
                      markNodeMap.delete(id);
                    }
                  }
                } else {
                  if (markNodeKeys === undefined) {
                    markNodeKeys = new Set();
                    markNodeMap.set(id, markNodeKeys);
                  }
                  if (!markNodeKeys.has(key)) {
                    markNodeKeys.add(key);
                  }
                }
              }
            }
          });
        },
        { skipInitialization: false },
      ),
      editor.registerUpdateListener(({ editorState, tags }) => {
        editorState.read(() => {
          const selection = $getSelection();
          let hasActiveIds = false;
          let hasAnchorKey = false;

          if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();

            if ($isTextNode(anchorNode)) {
              const commentIDs = $getMarkIDs(anchorNode, selection.anchor.offset);
              if (commentIDs !== null) {
                setActiveIDs(commentIDs);
                hasActiveIds = true;
              }
              if (!selection.isCollapsed()) {
                setActiveAnchorKey(anchorNode.getKey());
                hasAnchorKey = true;
              }
            }
          }
          if (!hasActiveIds) {
            setActiveIDs((_activeIds) => (_activeIds.length === 0 ? _activeIds : []));
          }
          if (!hasAnchorKey) {
            setActiveAnchorKey(null);
          }
          if (!tags.has('collaboration') && $isRangeSelection(selection)) {
            setShowCommentInput(false);
          }
        });
      }),
      editor.registerCommand(
        INSERT_INLINE_COMMAND,
        () => {
          const domSelection = window.getSelection();
          if (domSelection !== null) {
            domSelection.removeAllRanges();
          }
          setShowCommentInput(true);
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );
  }, [editor, markNodeMap]);

  // const onAddComment = () => {
  //   editor.dispatchCommand(INSERT_INLINE_COMMAND, undefined)
  // }

  const editViewElement = document.getElementById('edit-view') || document.body;

  return (
    <>
      {showCommentInput &&
        createPortal(
          <div
            className={position.top < 0 ? 'CommentAboveText' : ''}
            style={{
              position: 'absolute',
              top: `${position.top}px`,
              left: `0px`,
            }}
          >
            <CommentInputBox
              editor={editor}
              cancelAddComment={cancelAddComment}
              submitAddComment={submitAddComment}
            />
          </div>,
          document.body,
        )}
      {/* {activeAnchorKey !== null &&
        activeAnchorKey !== undefined &&
        !showCommentInput && isFocused &&
        createPortal(
          <AddCommentBox anchorKey={activeAnchorKey} editor={editor} onAddComment={onAddComment} />,
          document.body,
        )} */}
      {isFocused &&
        createPortal(
          <button
            className={`CommentPlugin_ShowCommentsButton ${showComments ? 'active' : ''}`}
            onClick={() => setShowComments(!showComments)}
            title={showComments ? 'Hide Comments' : 'Show Comments'}
          >
            <i className='comments' />
          </button>,
          document.body,
        )}

      {showComments &&
        isFocused &&
        createPortal(
          <CommentsPanel
            heading={'Comments'}
            comments={sortedComments}
            submitAddComment={submitAddComment}
            deleteCommentOrThread={deleteCommentOrThread}
            activeIDs={activeIDs}
            markNodeMap={markNodeMap}
            setShowComments={setShowComments}
          />,
          editViewElement!,
          'comments',
        )}
    </>
  );
};
