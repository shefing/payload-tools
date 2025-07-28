## 🚀 Payload CMS Plugins Collection

This repository contains a set of powerful plugins designed to enhance your [Payload CMS](https://payloadcms.com/) projects. Whether you're managing complex content structures or optimizing the authoring experience, these plugins will help streamline your workflow.

### 🔌 **Available Plugins** (Compatible with Payload 3.0)

1. **🔐 [Authorization](packages/authorization/)**  
   Implement flexible **role-based access control (RBAC)** for your content. Define roles based on **read/write/publish** permissions for collections and globals. Easily assign custom permissions to users for granular content security.

2. **👤 [Authors Info](packages/authors-info/)**  
Automatically display **author information** in the authoring interface, including details like **creator, updaters, publishers**, and the **last publish date**.

3. **💬 [Rich-text Comments](packages/comments/)**  
   Enable **inline comments and discussions** directly within the Payload authoring interface. This plugin supports **rich text commenting** using [Lexical](https://lexical.dev/), perfect for content collaboration.

4. **📋 [Right Panel](packages/right-panel/)**  
   Enhance the editing experience with a **custom right-side panel**. This view allows you to manage **related entities** side-by-side, improving productivity when working with complex data relationships.

5. **📝 [Custom Version View](packages/custom-version-view/)**  
Improve version control with a **custom version view** that displays "**Updated at**" and "**Updated by**" fields. This plugin integrates seamlessly with the [Authors Info](packages/authors-info/) plugin.

6. **🔗 [Cross-Collection Config](packages/cross-collection/)**  
   The **Cross-Collection Config Plugin** empowers you to modify the  view of components in Payload CMS,
   injecting **custom behaviors** and offering **global configuration capabilities** not natively supported.

7. **⚙️ [Field-type Component Override](packages/field-type-components-override/)**  
   Dynamically override all fields of a specific type in Payload CMS by replacing their default components with **custom ones—seamlessly** and **automatically**. This plugin allows you to define a field type once and apply your custom component globally across your collections.  

8. **🎨 [Color Picker Field](packages/color-picker/)**  
   Add a **custom color selection tool** to your Payload interface. Simplify content styling by allowing authors to choose colors effortlessly.
   You can choose between **font-color** and **background-color** for better preview of end results.

9. **✨ [Icon Select](packages/icon-select/)**  
   A handy **icon picker field** for selecting icons within the Payload UI from [flowbite-react-icons](https://flowbite.com/icons/), making it easy to enhance content with visually appealing icons.

10. **🚀 [Quick Filter](packages/quickfilter/)**  
   Transform your PayloadCMS admin experience with instant, intuitive filters that appear right where you need them. Say goodbye to clunky filter forms and hello to seamless data exploration!

11. **🔄 [Reset List View](packages/reset-list-view/)**  
   Add a "Reset Preferences" button to collection list views, allowing users to quickly reset their list view preferences (columns, filters, pagination, etc.) to the default state.

---

💡 **Tip:** Each plugin is modular and can be integrated independently based on your project needs. Check out the linked documentation for installation instructions and configuration details.

---

## 🛠️ Development Notes

### NPM Package Management

#### Publishing Packages to NPM

This repository includes a GitHub Action that allows you to publish any package to NPM:

1. Go to the "Actions" tab in the GitHub repository
2. Select the "Publish Package to NPM" workflow
3. Click "Run workflow"
4. Select the package you want to publish from the dropdown
5. Choose the version type (patch, minor, major) to determine how the version number will be incremented
6. Click "Run workflow" to start the publishing process

**Note:** This action requires an NPM access token stored as a GitHub secret named `NPM_TOKEN`.

#### Purging Packages from NPM

For maintenance purposes, you can purge all versions of a package from NPM using the "Purge Package from NPM" workflow:

1. Go to the "Actions" tab in the GitHub repository
2. Select the "Purge Package from NPM" workflow
3. Click "Run workflow"
4. Select the package you want to purge from the dropdown
5. Type "PURGE" in the confirmation field (this is required to prevent accidental purges)
6. Leave "Dry run" set to "true" to preview what would be unpublished without actually doing it
7. Click "Run workflow" to start the process

When you're ready to actually purge the package:
1. Follow the same steps, but set "Dry run" to "false"
2. The workflow will unpublish all versions of the package from NPM

**Warning:** Purging packages is irreversible and may affect users who depend on your package. Use with caution.

---
