# @devslab-kr/site-kit

Restricted internal public-site infrastructure for DevsLab products. It provides strict 14-locale catalogs, locale negotiation, SEO/GEO document builders, and accessible SolidJS 2 site shells. Product names, claims, navigation, and translated copy always remain in the consuming application.

## Entry points

- `@devslab-kr/site-kit` — runtime-neutral locale, catalog, SEO, sitemap, robots, and verified-fact utilities.
- `@devslab-kr/site-kit/solid` — header, footer, locale/theme controls, marketing/legal/status/error layouts, and request-access form.
- `@devslab-kr/site-kit/tanstack-start` — conversion of neutral metadata to TanStack Start head descriptors.
- `@devslab-kr/site-kit/styles.css` — logical-property, RTL-aware shared site styles.

Catalog construction is intentionally strict: all 14 locales must have exactly the same keys and named placeholders. There is no runtime copy fallback.

Sitemaps emit 14 locale alternates plus `x-default`. `buildVerifiedJsonLd`
accepts only the reviewed schema-type and claim allowlists, and every claim leaf
still references the verified-fact registry. `buildRobots` keeps its legacy
environment-only output, while an optional `policies` object can independently
control search indexing, citation crawlers, and model-training crawlers.
