# @devslab/site-kit

Public product-site infrastructure for DevsLab products. It provides strict 14-locale catalogs, locale negotiation, SEO/GEO document builders, and accessible SolidJS 2 site shells. Product names, claims, navigation, and translated copy always remain in the consuming application.

## Entry points

- `@devslab/site-kit` — runtime-neutral locale, catalog, SEO, sitemap, robots, and verified-fact utilities.
- `@devslab/site-kit/solid` — header, footer, locale/theme controls, marketing/legal/status/error layouts, and request-access form.
- `@devslab/site-kit/tanstack-start` — conversion of neutral metadata to TanStack Start head descriptors.
- `@devslab/site-kit/styles.css` — logical-property, RTL-aware shared site styles.

Catalog construction is intentionally strict: all 14 locales must have exactly the same keys and named placeholders. There is no runtime copy fallback.

Sitemaps emit 14 locale alternates plus `x-default`. `buildVerifiedJsonLd`
accepts only the reviewed schema-type and claim allowlists, and every claim leaf
still references the verified-fact registry. `buildRobots` keeps its legacy
environment-only output, while an optional `policies` object can independently
control search indexing, citation crawlers, and model-training crawlers.

## Locale menu variants

`LocaleMenu` renders a native `<select>` by default. `variant="flag"` renders a `<details>` disclosure whose trigger is the current locale's flag and whose rows are flag + native-name links — it works without JavaScript; Solid adds Escape-to-close and the `onLocaleChange(locale, href)` callback. `SiteHeader` forwards `localeVariant`. Flag data (`FLAG_COUNTRY`, `LOCALE_FLAGS`, `flagFor`) is exported from `@devslab/site-kit/flags`, a dedicated subpath — not the runtime-neutral `.` entry — because the vendored artwork is ~110 KB of SVG and most consumers never render a flag menu. The artwork is vendored from flag-icons (MIT, `flags/LICENSE-flag-icons.txt`). Flags are site-kit data, not `dds-icons` entries, because the icon set's contract requires single-colour `currentColor` strokes.
