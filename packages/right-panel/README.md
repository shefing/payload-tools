#  **Right-Panel Plugin for Payload CMS**  

 **Upgrade your relationship fields with a powerful right-side panel!**  

🔹 **No more context switching!** Edit related entities **side-by-side**  
🔹 **Effortless navigation** between records without losing progress  
🔹 **Fully integrated into the edit view** for a **seamless** workflow  

This plugin **extends the default edit view** with a sleek right-panel interface, making it easier than ever to manage related content **without disrupting your workflow**.  

https://github.com/user-attachments/assets/cfc0b69d-94f7-424a-9514-17cf9e2fd7c7
 

---

##  **Installation**  

Install the plugin using your preferred package manager:  

```sh
pnpm add @shefing/right-panel
```

---

##  **Setup**  

Add the plugin to your `payload.config.ts`:  

```javascript
plugins: [
  ...plugins,
  RightPanelPlugin({
    excludedCollections: [] // Add collections to exclude if needed
  })
];
```

---

##  **Collection Configuration**  

Enable the **Right Panel** in a collection by adding this to its `admin` configuration:  

```javascript
admin: {
  custom: {
    rightPanel: true,
  },
},
```

---

##  **Fields Configuration**  

Activate the **Right Panel** in the **Relationship field** by adding:  

```javascript
admin: {
  components: {
    Field: '@shefing/right-panel/components/RelationInRightPanelField'
  }
},
```

💡 **Now you can edit relationships smoothly, without interruptions!** ✨

## Roadmap

See the consolidated [`ROADMAP.md`](../../ROADMAP.md#right-panel) at the repo root and the live [`RoadMap` issues for Right Panel](https://github.com/shefing/payload-tools/labels/plugin%3Aright-panel).

### P0 — user-requested

- **Bottom panel mode** — `position: 'right' | 'bottom' | 'left'` (collection-level override). Reuse the existing drawer container.
- **Enable on more views** — explicit support for `listView` and `versionsView`, not only edit view.

### P1

- Pinned / resizable / collapsible panel with size persisted to user preferences.
- Multi-tab panel — stack several related collections as tabs in one drawer.
- Custom panel content slot — `admin.custom.rightPanel.component` accepting a React component (useful for embedding `Changes`, `Comments`, or `Authors Info`).
- Deep-link — encode the open record id in the URL hash.

### P2

- Keyboard shortcuts (`⌘\` toggle, `Esc` close).
- Mobile fallback (full-screen sheet).
