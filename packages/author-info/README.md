## [Author Info plugin](./src/index.ts)

Payload is storing the modification and creation date of each document's collections.

We have the need to store also the:

1. User who created or updated the document.
2. The publish date of the document (For publishable content)
   All this data is computed and rendered for each collection under Author Data Tab

![img_2.png](img_2.png)

On list views dates are presented in moment.js relation format like:

![img_3.png](img_3.png)
