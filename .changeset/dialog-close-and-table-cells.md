---
"@devslab/dds-css": minor
"@devslab/dds-react": minor
"@devslab/dds-solid": minor
"@devslab/dds-vue": minor
"@devslab/dds-table-react": minor
"@devslab/dds-table-vue": minor
---

Dialog takes an optional `closeLabel`: a close (X) icon button in the top inline-end corner, named by that label (React and Solid also pass it to `frame` as `parts.close`). Dialog actions now keep one step of space from free content above them; after a description the gap is unchanged. Data grids (React, Vue) center every cell on the row's middle line, including cells that render badges or buttons, and export `actionColumn(label, column?)` for a trailing row-actions column pinned to the end edge.
