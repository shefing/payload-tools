## [Author Info plugin](./src/index.ts)

Automatic adding authors info to collections and globals : creator, updator, publisher and publish-date

Payload is storing the modification and creation date of each document's collections.

We have the need to store also the:

1. User who created or updated the document.
2. The user who publish the document and publish date (For publishable content)

All this data is computed and rendered for each collection under Author Data Tab

![img_1.png](./images/img_1.png)

In addition, on list views dates are presented in moment.js relation format like:

![img_2.png](./images/img_2.png)
