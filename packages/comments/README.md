### Comments plugin

We created a plugin that gives the ability to add comments between users over text in a RichText field, using Lexical

The user can add a comment on selected text to start a discussion about this content:

![img1.png](./images/img1.png)

Comments section is available on the right side of the screen and users can reply or delete comments

![img2.png](./images/img2.png)

In addition, commented text has a mark

when clicking on the mark, it open the comments panel on the right side with focus on the current comment

![img3.png](./images/img3.png)

# Plugin Installation and Usage

Follow these steps to install and use the plugin in your Payload CMS project.

## 1. Enable Comments in Your Collection

In the collection where you want to use the plugin, add the following configuration under the `admin` section:

```javascript
admin: {
  custom: {
    comments: true,
  },
},
```

## 2. Configure the Rich Text Field

For the rich text field where you want the plugin features, include the following editor configuration:

```javascript
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
