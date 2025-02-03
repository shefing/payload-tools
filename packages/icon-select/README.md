### 🌟 **Icon Select Field for Payload CMS**  

🚀 **Effortlessly choose icons with an intuitive dropdown!**  

This plugin enhances **Payload CMS** by adding a **custom Icon Select field**, powered by **Tailwind Icons**.  
✅ **Search & Scroll** through icons with ease  
✅ **ShadCN UI Integration** for a sleek, modern experience  

https://github.com/user-attachments/assets/7d61db28-6351-4314-b191-e304c5850962 

---

### 📦 **Installation**  
Install the plugin using your preferred package manager:  
```sh
pnpm install @shefing/icon-select
```

---

### ⚙️ **Setup**  

Add the field to your **collection**:  

```typescript
import { createIconSelectField } from "@shefing/icon-select";

fields: [ 
  createIconSelectField({ name: 'iconType', label: 'Select Icon' }),
];
```

🖌️ **Requires Tailwind CSS** in your project for styling.  

💡 Now you can easily browse and select icons with a **smooth, user-friendly experience**! 🎨
