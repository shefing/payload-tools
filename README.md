This repo is containing a set of plugins for the [Payload CMS](https://payloadcms.com/) that can be useful for content projects using it.
Here is the list of the plugins:
Payload 3.0 plugins

1. [Authors-info](packages/authors-info/): a pluging that will automatically add authors information to the authoring interface: creator, updators, publishers and last publish date.

2. [Authorization](packages/authorization/):a plugin implementing a flexible role-based access control of the contents, defining roles based on the read/write/publish primitives per collections and globals, enabling roles assignment to users defining roles with custom permissions.

21. [Comments](packages/comments/)- Plugin to enable comments within the Payload authoring interface, so users with access can comment and reply on rich text fields based on Lexical.

3. [Color-picker-field](packages/color-picker/): a custom field to add color selection within the authoring interface.

4. [Icon-select](packages/icon-select/): a custom field for selecting icons within the Payload authoring interface

5. [Cross-collection-config](packages/CrossCollection/)- Custom component to change the default component of the authoring interface accross all collections and globals, enabling behavior based on metadata, and with the ability to exclude some collections or globals.

6. [Custom-version-view](packages/CustomVersionView/)- Custom component to add "Updated at" and "Updated by" fields to the default version view, enabling better version control. It relies on the [Authors-info](packages/authors-info/) package for displaying the author information.

7.[Right-panel](packages/RightPanel/)- Custom view of the edit UI to display relationship fields side-by-side within a right panel making it easier to edit two related entities
