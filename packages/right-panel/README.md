# 🎯 **Right-Panel Plugin for Payload CMS**  

🚀 **Upgrade your relationship fields with a powerful right-side panel!**  

🔹 **No more context switching!** Edit related entities **side-by-side**  
🔹 **Effortless navigation** between records without losing progress  
🔹 **Fully integrated into the edit view** for a **seamless** workflow  

This plugin **extends the default edit view** with a sleek right-panel interface, making it easier than ever to manage related content **without disrupting your workflow**.  

https://github.com/user-attachments/assets/cfc0b69d-94f7-424a-9514-17cf9e2fd7c7
 

---

## 📦 **Installation**  

Install the plugin using your preferred package manager:  

```sh
pnpm add @shefing/right-panel
```

---

## ⚙️ **Setup**  

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

## 🛠️ **Collection Configuration**  

Enable the **Right Panel** in a collection by adding this to its `admin` configuration:  

```javascript
admin: {
  custom: {
    rightPanel: true,
  },
},
```

---

## 🏗️ **Fields Configuration**  

Activate the **Right Panel** in the **Relationship field** by adding:  

```javascript
admin: {
  components: {
    Field: '@shefing/right-panel/components/RelationInRightPanelField'
  }
},
```

💡 **Now you can edit relationships smoothly, without interruptions!** ✨
