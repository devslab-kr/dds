---
"@devslab/dds-css": patch
---

`.dds-btn` sets `text-decoration: none`, so a link styled as a button (`<a class="dds-btn">`) no longer renders the browser's anchor underline. Consumers can drop any `a.dds-btn { text-decoration: none }` shim.
