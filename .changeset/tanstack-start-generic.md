---
"@devslab/site-kit": patch
---

`toTanStackHead` and `toHtmlAttributes` are generic over the locale code, matching the builders that feed them. Metadata built with a product registry (`SiteMetadata<string>`) no longer needs a cast or a module augmentation to reach the TanStack head.
