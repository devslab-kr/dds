---
"@devslab/dds-css": patch
---

Give each toast its own content width. Ark places toasts absolutely inside a region that has no width, so toasts shrink-wrapped to a few characters per line. Toasts now take the width of their text up to the 360px cap, stay pinned to the region's end edge (RTL included), and wrap a long unbroken string inside the box.
