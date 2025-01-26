## [Color picker Field ](./src/index.ts)

In the default Payload CMS, there was no built-in color picker field. We've added a custom Color Picker field that allows users to easily select colors directly within the CMS interface. This field uses the Flowbite color palette, bringing in all available colors from Flowbite. Users can search for a specific color by name or select it from the palette. To use it, simply select a color from the picker, enter a hex code, or search for the color name, and it will be applied to your content.

This implementation integrates Flowbite with ShadCN UI, combining Flowbite's extensive design system with ShadCN's modern component library for an effective experience 

![img1.png](./images/img1.png)

### Setup

In order to use this color-picker field  install it using your prefered node package manager, e.g:

` npm install @michalklor/color-picker`

In the collection  add the following:

```typescript
import  { createColorField } from "@michalklor/color-picker"

 fields: [ 
  createColorField({ name: 'color', label: 'font-color' }),
 ]
```

To use this package, you need to install Tailwind CSS in your project.

