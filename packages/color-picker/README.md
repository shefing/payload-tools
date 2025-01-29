## [Color Picker Field ](./src/index.ts)

Payload CMS does not include a built-in color picker, so we added a custom field that integrates Tailwind's color palette. Users can select a color, enter a hex code, or search by name directly within the CMS.

This integrates Tailwind design system with ShadCN's component library for a seamless experience.

![img1.png](./images/img1.png)

### Setup

Install the field using your node package manager, e.g:

    ` npm install @shefing/color-picker`

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
