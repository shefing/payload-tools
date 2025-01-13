'use client'
import { MarkNode } from '@lexical/mark'
import { CommentPlugin } from '../commentPlugin'
import { ToolbarGroup } from '@payloadcms/richtext-lexical'
import {
  createClientFeature,
  getSelectedNode,
  toolbarFeatureButtonsGroupWithItems,
} from '@payloadcms/richtext-lexical/client'
import { CommentIcon } from '../Icons/CommentIcon'
import { $getSelection, $isRangeSelection } from 'lexical'
import { INSERT_INLINE_COMMAND } from '..'

const toolbarGroups: ToolbarGroup[] = [
  toolbarFeatureButtonsGroupWithItems([
    {
      ChildComponent: CommentIcon,

      isActive: ({ selection }) => {
        if ($isRangeSelection(selection)) {
          const selectedNode = getSelectedNode(selection)
          return selectedNode != null
        }
        return false
      },
      isEnabled: ({ selection }) => {
        return !!($isRangeSelection(selection) && $getSelection()?.getTextContent()?.length)
      },
      key: 'comment',

      onSelect: ({ editor }) => {
        editor.dispatchCommand(INSERT_INLINE_COMMAND, undefined)
 
      },
    },
  ]),
]

export const commentClientFeature = createClientFeature({
  nodes: [MarkNode],
  plugins: [
    {
      Component: CommentPlugin,
      position: 'normal',
    },
  ],
  toolbarFixed: {
    groups: toolbarGroups,
  },
})