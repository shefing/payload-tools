### 🚀 **Comments Plugin**  

This plugin allows users to **add comments on text** within a **RichText field** using **Lexical**.  

https://github.com/user-attachments/assets/3e1e594e-5ee3-43d1-957d-3293424a405f

---

### ✨ **Usage**  

Users can seamlessly **add comments to selected text**, enabling thoughtful discussions on the content.  

- ✅ **Comments Section**: Located on the **right side** of the screen, allowing users to easily **reply** or **delete comments**.  
- ✅ **Marked Text**: Commented text is **highlighted**, making it easy to spot.  
- ✅ **Quick Access**: Clicking on **marked text** **opens the comments panel** with focus directly on the comment for an intuitive experience.  

---

### 📦 **Install**  

Install the plugin using your node package manager:  

```sh
pnpm install @shefing/comments
```

---

### ⚙️ **Setup**  

In `payload.config.ts`, add the following:  

```javascript
CommentsPlugin({
  excludedCollections: ['posts', 'media'], // Collections to exclude
  excludedGlobals: ['aboutus'], // Globals to exclude
});
```

---

### 🛠 **Collection Configuration**  

#### **1️⃣ Enable Comments in Your Collection**  

In the target **collection**, add this under `admin`:  

```javascript
admin: {
  custom: {
    comments: true,
  },
},
```

#### **2️⃣ Configure the Rich Text Field**  

For the **rich text field**, add this **editor configuration**:  

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

🚀 **Now your users can add, reply to, and manage comments directly within the RichText field!** 🎉
