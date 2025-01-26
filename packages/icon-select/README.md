## [Icon select field ](./src/index.ts)

In the default Payload CMS, there was no built-in Icon Select field. We've added a custom Icon Select field that allows users to easily choose icons directly within the CMS interface.
This field uses the Flowbite icon library, bringing in a wide variety of icons for selection.
Users can search for a specific icon by name or select it from the dropdown menu. To use it, simply search for an icon or scroll through the list, and the selected icon will be applied to your content. This implementation integrates Flowbite with ShadCN UI, combining Flowbite's extensive design system with ShadCN's modern component library for an effective experience

![img1.png](./images/img1.png)

### Setup

In order to use this color-picker field  install it using your prefered node package manager, e.g:

` npm install @michalklor/icon-select`

In the collection  add the following:

```typescript
import   { createIconSelectField }  from "@michalklor/icon-select"

 fields: [ 
 createIconSelectField({ name: 'iconType', label: 'Select Icon' }),
 ]
```

To use this package, you need to install Tailwind CSS in your project.

