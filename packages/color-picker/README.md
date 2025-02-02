## [Color Picker Field ](./src/index.ts)

Payload CMS does not include a built-in color picker, so we added a custom field that integrates Tailwind's color palette. Users can select a color, enter a hex code, or search by name directly within the CMS.

This integrates Tailwind design system with ShadCN's component library for a seamless experience.

https://github.com/user-attachments/assets/19b898d4-49b4-43d9-8d4e-d3bbb3c6bf8e

### Setup

Install the field using your node package manager, e.g:

    ` pnpm install @shefing/color-picker`

In the target collection add the following:

```typescript
import { createColorField } from '@shefing/color-picker';

fields: [
  createColorField({
    name: 'color', //The name of the field.
    label: 'font-color', //The label of the field.
  }),
];
```

To use this package, make sure Tailwind CSS is installed in your project.
