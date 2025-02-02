### Comments Plugin

This plugin allows users to add comments on text within a RichText field using Lexical.

https://github.com/user-attachments/assets/adf970d6-9eb1-4553-ad5a-763f4fa91f12

### Usage

Users can seamlessly add comments to selected text, enabling thoughtful discussions on the content.

- ✅ **Comments Section**: The comments section is conveniently located on the **right side** of the screen, allowing users to easily **reply** or **delete comments**.

- ✅ **Marked Text**: When text is commented on, it is **highlighted with a special mark**, making it easy to spot.

- ✅ **Quick Access**: By clicking on the **marked text**, the comments panel on the right will open, with the focus directly on the comment, ensuring a smooth and intuitive interaction.




### Install

Install the plugin using your node package manager, e.g:

`pnpm install @shefing/comments`

### Setup

In the payload.config.ts add the following:

```javascript
CommentsPlugin({
  excludedCollections: ['posts', 'media'], //array of collections names to exclude
  excludedGlobals: ['aboutus'], //array of collections names to exclude
});
```

### Collection Configuration

#### 1. Enable Comments in Your Collection

In the target collection, add this under admin:

```javascript
admin: {
  custom: {
    comments: true,
  },
},
```

#### 2. Configure the Rich Text Field

For the rich text field, add this editor configuration:

```javascript
import { commentFeature } from '@shefing/comments/feature';
fields: [
  {
    name: 'richText',
    label: 'Rich Text',
    type: 'richText',
    editor: lexicalEditor({
      features: ({}) => [FixedToolbarFeature(), commentFeature()],
    }),
  },
];
```
