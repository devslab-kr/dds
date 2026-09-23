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

## Hydration

`MarketingShell` reads `header` and `footer` once (a memo) before it renders anything. `header={{ … }}` compiles to a getter; if the shell re-read it per prop, any JSX built eagerly inside the literal (an `actions` anchor, a logo) would be built again on each read and consume hydration keys — a different number of times on the server than in the browser — and the client would rebuild the header from templates. A product that mounts `SiteHeader` or `SiteFooter` directly, outside the shell, has to read its own props once the same way. The flag sprite loads its bodies whenever it reaches the client empty, whatever the reason.

The header and footer read `brand` (and the footer its `details`) once themselves, so a logo or details block built inline stays one build per side even outside the shell (D-029).

## Header and footer options

For a single-language product, and for a footer that has to print business details (D-029). The props are optional; a product that passes none of them gets the same markup. A few defaults apply to every product (listed after the options).

```tsx
<MarketingShell
  mainWidth="bleed"
  header={{
    brand: { name: "", href: "/", label: "Acme home", logo: <Wordmark /> }, // the wordmark is the logo; name "" so it does not print twice
    navigation: [{ href: "#how", label: "How it works" }, { href: "#contact", label: "Contact" }],
    messages,
    get actions() { return <a class="dds-btn dds-btn--primary" href="#contact">Get in touch</a>; },
    // no `locale`: no language picker
  }}
  footer={{
    brand: { name: "", href: "/", logo: <Wordmark /> },
    get details() { return <><p>Acme Ltd · Reg. 000-00-00000</p><address>1 Main St</address></>; },
    linksLabel: "Footer links",
    links: [{ href: "/terms", label: "Terms" }, { href: "/privacy", label: "Privacy policy", emphasis: true }],
    copyright: "© Acme",
    messages,
  }}
  messages={messages}
>…</MarketingShell>
```

- `SiteHeader` `locale` is optional. Omit it and no language picker renders — a picker with one language reads as broken. The footer's `locale` already worked this way.
- `SiteBrand.label` names the header brand link (`aria-label`). Start it with the visible name. With a wordmark as `logo`, pass `name: ""`; the footer then renders no empty `<strong>`.
- The narrow-screen menu closes on Escape (focus returns to the menu button) and when a link inside it is followed — including a same-page anchor, which would otherwise leave the open menu covering the section. Buttons inside it (the theme toggle) and links that open a new tab or window leave it open. An Escape that a control inside the header already handled (the flag menu), or that comes from inside an `aria-modal` element, is left to that control.
- Touch (`pointer: coarse`): the brand link, navigation, footer and footer-language links are 44px targets, as buttons already are. At 720px and below the open menu's links are 44px rows, and the closed header's first row keeps its 64px height.
- `SiteFooter` `details`: a block under the brand line (business registration, an `<address>`), its lines 4px apart with no paragraph margins. `linksLabel` wraps the links in `<nav aria-label>`; name it differently from the header's navigation. A footer wordmark passed as `logo` (with `name: ""`) keeps its own size — the 16px size is for an icon mark beside a printed name — and carries its own accessible text (`<img alt>`, or text), because `label` names only the header link.
- `SiteLink.emphasis` draws a link heavier (header navigation, footer links, family links) — for a Korean site's privacy policy, which the law asks to stand out.
- Sections (and the hero) stop below the sticky header when an in-page link targets them: `scroll-margin-block-start` is the header height plus 8px. The header height is `--site-header-block-size` (default 64px); set it on `:root` or `.site-shell` — an ancestor of both the header and `<main>` — not on `.site-header`, or the sections keep the 64px offset.
- `--site-hero-eyebrow-tracking` (default `.18em`) and `--site-hero-eyebrow-weight` (default `normal`) tune the hero eyebrow. Wide mono tracking suits Latin capitals; a product whose eyebrow is Korean sets the tracking to `0` on its landing root.

Defaults that apply to every product, with or without the new props: the 44px touch targets above; the narrow header's first row is `--site-header-block-size` (64px) with no block padding — a product without a global `box-sizing: border-box` reset loses 24px of phone header height (it was 64px plus 12px padding each side), and one whose menu button is 44px loses 4px; the open menu's links are 44px rows with no gap and its controls row has 12px below it; sections and the hero get the scroll offset; the menu closes on Escape and on following a link; footer links are baseline-aligned, and a row with details aligns on the first line.

Type note: `SiteHeaderProps["locale"]` is now `LocaleState | undefined`. Code that reads it from a `SiteHeaderProps` value (`header.locale.locale`) must narrow it — for example type the value as `SiteHeaderProps & { locale: LocaleState }` where the product always sets it.

## Brand icons

Every product's icon files come from `@devslab/linq-brand` (`dist/<product>/`); `brandIconLinks()` is the one place that says which of them a page head links, and in what order:

| Link | File | Why |
|---|---|---|
| `icon` `image/svg+xml` | `favicon.svg` | the tab icon, first so a browser that understands SVG never fetches a raster |
| `icon` `48x48` | `mark-48.png` | search engines want a `<link>`-declared square of at least 48px (Google: "at least 8x8px, preferably >48x48px") |
| `icon` `16x16 32x32 48x48` | `favicon.ico` | the bare-URL convention, three sizes in one container |
| `apple-touch-icon` `180x180` | `apple-touch-icon.png` | iOS home screen |

`BRAND_ICON_FILES` lists the same four names, so a product can serve them from one directory. The default `basePath` is `/brand`; a product that serves the files elsewhere passes its own path. Only same-origin paths are accepted — a product serves its own icons.

```ts
toTanStackHead(metadata, { icons: true });               // …/brand/favicon.svg, …
toTanStackHead(metadata, { icons: { basePath: "/" } }); // /favicon.svg, /mark-48.png, …
```

Omitted, the adapter emits no icon links: it cannot know where a product serves the files, and a head that links icons the server 404s is worse than one that links none.

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

## Publisher attribution

The root entry provides framework-neutral `definePublisher`, `buildPublisher`,
`serializeJsonLd`, and `renderPublisherHtml`. DevsLab products and OSS sites use
one identity preset from the separate `@devslab/site-kit/devslab` entry:

```js
import { buildPublisher, renderPublisherHtml } from "@devslab/site-kit";
import { DEVSLAB_PUBLISHER } from "@devslab/site-kit/devslab";

const publisher = buildPublisher(DEVSLAB_PUBLISHER, { locale: "ko" });
// Render publisher.link.href / .label in the footer.
// Put publisher.organization in the JSON-LD graph and use
// publisher.reference as the product/WebSite publisher.
const html = renderPublisherHtml(DEVSLAB_PUBLISHER);
// Insert html into a static page during its build: visible link + Organization.
```

`PublisherIdentity` requires `id`, `name`, and `url`; optional `alternateName`,
`sameAs`, `labels`, and `defaultLabel` describe identity, not product capabilities.
URLs must be absolute HTTP(S) without credentials. Configuration is copied and
frozen. Labels use exact locale, lowercase/base language, then `defaultLabel`
(or `name`). The DevsLab default is `데브스랩(DevsLab)`; `en` uses `DevsLab`.
The preset owns the official homepage, Korean alias and official `sameAs` links.

`renderPublisherHtml` escapes the anchor and JSON-LD and accepts an optional
`nonce` for CSP. It returns a string without reading the DOM or importing Solid;
Node build scripts, MkDocs preparation, and SSR can use the same output.
For an existing graph, use `serializeJsonLd` when inserting JSON into a script.
Render the Organization once per page. Other publishers call `definePublisher`
with their own configuration. Capability claims still use `VerifiedFactRegistry`;
this API does not change robots rules, consent, analytics or training policy.

## Product locale registries

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

`LocaleMenu` renders a native `<select>` by default. `variant="flag"` renders a `<details>` disclosure whose trigger is the current locale's flag and whose rows are flag + native-name links — it works without JavaScript; Solid adds Escape-to-close and the `onLocaleChange(locale, href)` callback. `SiteHeader` forwards `localeVariant`. Flag data (`FLAG_COUNTRY`, `LOCALE_FLAGS`, `flagFor`, `flagCountryFor`) is exported from `@devslab/site-kit/flags`, a dedicated subpath — not the runtime-neutral `.` entry — because the vendored artwork is ~110 KB of SVG and most consumers never render a flag menu.

The flag menu keeps that artwork out of the browser bundle too. Each menu renders one `<symbol>` sprite (one body per country) and every flag is an `<svg><use href="#…">` of it, so a locale change on the client only swaps an `href`. The sprite's markup is written by the server build; hydration adopts it, and the browser build reaches the bodies only through a dynamic `import()` — its own chunk, `dist/flag-bodies.js` — taken when a flag menu renders with no server HTML (a client-only app, a jsdom test). A consumer that imports `SiteHeader` therefore ships ~40 KB of client JS for the whole kit rather than ~150 KB; `pnpm check` builds a minimal consumer (`fixtures/bundle-probe`) and fails if a flag body ever returns to the main chunk. The bodies still sit in the server-rendered HTML — moving them to fetched files is a separate decision. The artwork is vendored from flag-icons (MIT, `flags/LICENSE-flag-icons.txt`). Flags are site-kit data, not `dds-icons` entries, because the icon set's contract requires single-colour `currentColor` strokes.
