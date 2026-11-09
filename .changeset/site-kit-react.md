---
"@devslab/site-kit": minor
---

Add `@devslab/site-kit/react`: the Solid marketing chrome for React and Next.js
— flag and select `LocaleMenu`, `SiteHeader`, `SiteFooter`, `ThemeToggle`,
`MarketingShell`, the legal/status/not-found/error layouts, the six section
primitives, `OssProductMark` and `ConsentSettingsButton`, rendering the same
markup and classes as `./solid`. The entry is a `"use client"` module; flag
artwork resolves through `@devslab/site-kit/react/flag-bodies` per export
condition, so the server writes the sprite and browser bundles carry no flag
bodies. Adds `localeHrefs` to the core entry for Server Components, the opt-in
`.site-brand__lockup` style for a mark beside a wordmark, `react` as an optional
peer, and makes the `solid-js` peer optional (D-045).
