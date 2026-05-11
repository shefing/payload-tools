## [Author Info plugin](./src/index.ts)

Take the guesswork out of tracking **who created, edited, and published content(and when)** across your **collections and globals**—**automatically**.

https://github.com/user-attachments/assets/3a23a502-2867-41a8-bd35-506f911c8b41

### Usage
🔹 **Seamless Author Tracking** – This plugin **automatically captures and stores** key authoring details, so you always know **who created, modified, and published** each document.  
🔹 **Enhanced Metadata** – While Payload CMS tracks creation and modification dates, it **doesn’t store publication dates**—but this plugin does! Now, you’ll have a clear **record of the most recent publish date** for every entry.  
🔹 **Integrated Author Data** – A new **"Author Data" tab** is added to the authoring interface, providing a centralized place for all user activity related to the document.

With this **fully automated** tracking system, you'll always have complete visibility into **who did what and when**—**without any extra effort**. 

### Install

Install the plugin using your node package manager, e.g:

`pnpm add @shefing/authors-info`

### Setup

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




## Roadmap

See the consolidated [`ROADMAP.md`](../../ROADMAP.md#authors-info) at the repo root and the live [`RoadMap` issues for Authors Info](https://github.com/shefing/payload-tools/labels/plugin%3Aauthors-info).

### P0

- **Activity timeline** tab reusing `custom-version-view` data (created → edited → published → reverted).
- **Configurable display fields** — choose which author attributes show in the tab and list columns.
- **Surface in list views** — opt-in column adapter for `Updated By` / `Published By` in any collection list.

### P1

- Editor presence ("currently being edited by …") with stale-lock cleanup.
- Email author on publish hook (configurable template).

### P2

- CSV / JSON export of activity for compliance.
