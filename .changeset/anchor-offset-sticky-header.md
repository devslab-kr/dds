---
"@devslab/site-kit": patch
---

A link to an `id` on a page with the kit header (`/privacy#analytics` from the consent bar) now stops the target 16px below the sticky header instead of under it: `scroll-margin-block-start` = `--site-header-block-size` + 1px border + 16px, at zero specificity, on every `id` after `.site-header`. Sections and the hero keep their 8px offset; a product's own `scroll-margin` wins (D-035).
