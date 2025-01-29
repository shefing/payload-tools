## [Author Info plugin](./src/index.ts)

Take the guesswork out of tracking **who created, edited, and published content** across your **collections and globals**—**automatically**.  

https://github.com/user-attachments/assets/923aa231-71df-4ac6-bf1e-0f6d0f3623ed

### Usage
🔹 **Seamless Author Tracking** – This plugin **automatically captures and stores** key authoring details, so you always know **who created, modified, and published** each document.  
🔹 **Enhanced Metadata** – While Payload CMS tracks creation and modification dates, it **doesn’t store publication dates**—but this plugin does! Now, you’ll have a clear **record of the most recent publish date** for every entry.  
🔹 **Integrated Author Data** – A new **"Author Data" tab** is added to the authoring interface, providing a centralized place for all user activity related to the document.  

With this **fully automated** tracking system, you'll always have complete visibility into **who did what and when**—**without any extra effort**.  

### Setup

Install the plugin using your node package manager, e.g:

`npm add @shefing/authors-info`

In the payload.config.ts add the following:

```typescript
plugins: [
    ...plugins,
    addAuthorsFields({
      excludedCollections: [],//array of collections names to exclude
      excludedGlobals:[], // array of globals names to exclude
      usernameField: 'fullName', //name field to use from Users collection, 'user' by default
    }),
```

The dates are presented relatively using moment.js anywhere using CreatedAtCell type.
