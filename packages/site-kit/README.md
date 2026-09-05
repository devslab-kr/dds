# @devslab/site-kit

Public product-site infrastructure for DevsLab products. It provides strict catalogs over the family locales (extensible per product), locale negotiation, SEO/GEO document builders, and accessible SolidJS 2 site shells. Product names, claims, navigation, and translated copy always remain in the consuming application.

## Entry points

- `@devslab/site-kit` — runtime-neutral locale, catalog, SEO, sitemap, robots, and verified-fact utilities.
- `@devslab/site-kit/solid` — header, footer, locale/theme controls, marketing/legal/status/error layouts, and request-access form.
- `@devslab/site-kit/tanstack-start` — conversion of neutral metadata to TanStack Start head descriptors.
- `@devslab/site-kit/styles.css` — logical-property, RTL-aware shared site styles.

Catalog construction is intentionally strict: every locale in the registry must have exactly the same keys and named placeholders. There is no runtime copy fallback.

Sitemaps emit one alternate per registry locale plus `x-default`. `buildVerifiedJsonLd`
accepts only the reviewed schema-type and claim allowlists, and every claim leaf
still references the verified-fact registry. `buildRobots` keeps its legacy
environment-only output, while an optional `policies` object can independently
control search indexing, citation crawlers, and model-training crawlers.

## Sections

Six stateless primitives for a family landing page, extracted from VisionLinq. Import from `@devslab/site-kit/solid`; the stylesheet ships inside `styles.css`. The primitives are full-bleed — each carries its own inner width — so a page built from them should render inside `<MarketingShell mainWidth="bleed">`; the shell's default `<main>` inset would otherwise double-inset them and turn `tone="band"` into a boxed rectangle.

| Primitive | Renders |
|---|---|
| `SectionBlock` | `<section>` + content shell; `tone="band"` steps the background down one token |
| `SectionHead` | mono zero-padded `index` (decorative), `h2`, optional lede |
| `HeroSplit` | copy 6 / aside 5; the aside `figure` has no height rule — fix it in your scene |
| `StepFlow` | `<ol>` of steps with **ring numerals 1 2 3** — a different glyph system from the section index |
| `FeatureRows` | hairline rows with an optional `dds-badge`; never a card grid |
| `PricingNote` | one paragraph block + one action |

```tsx
<SectionBlock id="how" labelledBy="how-title">
  <SectionHead index="01" titleId="how-title" title={t("how.title")} lede={t("how.lede")} />
  <StepFlow label={t("how.title")} steps={[{ title: t("how.1.title"), body: t("how.1.body") }, …]} />
</SectionBlock>
```

### Locale subsets

`defineLocaleRegistry({ only: ["ko", "en", "ja"] })` keeps only those family locales (family order, before any `extra`). Pass the registry to `SiteHeader localeRegistry` and to `validateCatalogs(…, { registry })`; a visitor asking for a locale outside the subset resolves to your `defaultLocale`. `defaultLocale` must itself be inside `only`; an alias whose target falls outside the subset (e.g. `zh` → `zh-TW` when only `zh-HK` is kept) resolves to `undefined` and so falls through to `defaultLocale`, never to another script.

## Product locales

`LOCALES` is the family list — the fourteen languages devslab.kr markets in,
and the floor every product gets. It is not every product's list. A product
that sells in languages the family does not carry builds a registry:

```js
import { defineLocaleRegistry } from "@devslab/site-kit";

export const locales = defineLocaleRegistry({
  extra: [
    { code: "ta", language: "Tamil", nativeName: "தமிழ்", dir: "ltr", flagCountry: "in" },
  ],
});
```

Every locale-aware helper takes one: `validateCatalogs(catalogs, "en", { registry })`,
`buildMetadata({ …, registry })`, `buildSitemap({ …, registry })`,
`localizedPath(path, locale, defaultLocale, registry)`, and
`<SiteHeader localeRegistry={…}>`. Omit it and you get the family registry, so
a consumer that never calls `defineLocaleRegistry` is unaffected.

`flagCountry` must name a country this package already vendors — see
`FLAG_COUNTRY` for the list. Products do not ship flag artwork: it is
licensed, generated and scanned here, and a flag names a country, not a
language, so seven Indian locales legitimately share `in`.

Pass the registry everywhere or nowhere. A page built with the registry but
metadata built without it renders in Tamil while telling search engines Tamil
does not exist.

## Locale menu variants

`LocaleMenu` renders a native `<select>` by default. `variant="flag"` renders a `<details>` disclosure whose trigger is the current locale's flag and whose rows are flag + native-name links — it works without JavaScript; Solid adds Escape-to-close and the `onLocaleChange(locale, href)` callback. `SiteHeader` forwards `localeVariant`. Flag data (`FLAG_COUNTRY`, `LOCALE_FLAGS`, `flagFor`) is exported from `@devslab/site-kit/flags`, a dedicated subpath — not the runtime-neutral `.` entry — because the vendored artwork is ~110 KB of SVG and most consumers never render a flag menu. The artwork is vendored from flag-icons (MIT, `flags/LICENSE-flag-icons.txt`). Flags are site-kit data, not `dds-icons` entries, because the icon set's contract requires single-colour `currentColor` strokes.
