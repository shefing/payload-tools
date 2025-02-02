## 🎨 [Color Picker Field](./src/index.ts)

Payload CMS doesn’t come with a built-in color picker, so we’ve created a **custom color field** that integrates seamlessly with **Tailwind’s dynamic color palette**. Now, you can effortlessly **select colors, enter HEX codes, or search by color names**—all within the CMS.

🌈 **Tailwind + ShadCN Integration**  
This color picker is powered by **Tailwind’s design system** combined with **ShadCN’s sleek component library**, ensuring a beautiful and consistent user experience.

https://github.com/user-attachments/assets/a8bae019-ac61-4e64-a2b3-221f24324f3a

---

### ⚙️ **Setup Instructions**

1️⃣ **Install the Color Picker** using your preferred package manager:

```bash
pnpm install @shefing/color-picker
```

2️⃣ **Add the Field to Your Collection:**

```typescript
import { createColorField } from '@shefing/color-picker';

fields: [
  createColorField({
    name: 'color',       // 🏷️ The name of the field
    label: 'Font Color', // 🎯 The label displayed in the UI
  }),
];
```

3️⃣ **Prerequisite:** Ensure **Tailwind CSS** is installed in your project to take full advantage of the dynamic color palette.

---

💡 **Pro Tip:** The colors you select are directly sourced from your **Tailwind configuration**, ensuring consistency with your design system. Say goodbye to mismatched colors and hello to effortless branding!

