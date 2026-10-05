# @devslab/site-kit

Public product-site infrastructure for DevsLab products. It provides strict catalogs over the family locales (extensible per product), locale negotiation, SEO/GEO document builders, and accessible SolidJS 2 site shells. Product names, claims, navigation, and translated copy always remain in the consuming application.

## Entry points

- `@devslab/site-kit` — runtime-neutral locale, catalog, SEO, sitemap, robots, verified-fact, Google Tag Manager and analytics-consent utilities.
- `@devslab/site-kit/solid` — header, footer, locale/theme controls, marketing/legal/status/error layouts, request-access form, and the consent bar.
- `@devslab/site-kit/tanstack-start` — conversion of neutral metadata to TanStack Start head descriptors (with opt-in brand icons and the consent-gated Tag Manager loader).
- `@devslab/site-kit/styles.css` — logical-property, RTL-aware shared site styles. It also gives the page root the family face (`:where(html) { font-family: var(--dds-font-family-sans) }`), so bare headings and paragraphs are not left in the browser's serif. The rule has zero specificity: a product's own rule on `html`, `:root`, `body` or `:lang()` wins.
- `@devslab/site-kit/fonts.css` — the family font (Geist, Geist Mono, Pretendard) as self-hosted woff2 under the token's family names; see [Family font](#family-font).

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
- `SiteFooter` `consentSettings: { controller, label }` adds a "쿠키 설정" button after the links, before the copyright, that reopens the consent settings (D-034). It reads as one of the links and is a 44px target on touch; see [Consent](#consent-opt-in-analytics).
- Sections (and the hero) stop below the sticky header when an in-page link targets them: `scroll-margin-block-start` is the header height plus 8px. The header height is `--site-header-block-size` (default 64px); set it on `:root` or `.site-shell` — an ancestor of both the header and `<main>` — not on `.site-header`, or the sections keep the 64px offset.
- `--site-hero-eyebrow-tracking` (default `.18em`) and `--site-hero-eyebrow-weight` (default `normal`) tune the hero eyebrow. Wide mono tracking suits Latin capitals; a product whose eyebrow is Korean sets the tracking to `0` on its landing root.

Defaults that apply to every product, with or without the new props: the 44px touch targets above; the narrow header's first row is `--site-header-block-size` (64px) with no block padding — a product without a global `box-sizing: border-box` reset loses 24px of phone header height (it was 64px plus 12px padding each side), and one whose menu button is 44px loses 4px; the open menu's links are 44px rows with no gap and its controls row has 12px below it; sections and the hero get the scroll offset; the menu closes on Escape and on following a link; footer links are baseline-aligned, and a row with details aligns on the first line.

Type note: `SiteHeaderProps["locale"]` is now `LocaleState | undefined`. Code that reads it from a `SiteHeaderProps` value (`header.locale.locale`) must narrow it — for example type the value as `SiteHeaderProps & { locale: LocaleState }` where the product always sets it.

## Family font

The family face — Geist for Latin and digits, Geist Mono for code and labels, Pretendard for Korean — ships here once, as woff2 files plus one stylesheet (D-033). Every product serves the same files from its own origin, so a CSP of `font-src 'self'` holds and no font request leaves the product's domain.

| Family | Files | Upstream | License |
|---|---|---|---|
| `Geist` | 5 subsets by script (latin 29 KB, latin-ext, vietnamese, cyrillic, cyrillic-ext), variable 100–900 | `@fontsource-variable/geist` 5.3.0 | SIL OFL 1.1 — `fonts/geist/LICENSE.txt` |
| `Geist Mono` | 6 subsets (latin 23 KB, …, symbols2), variable 100–900 | `@fontsource-variable/geist-mono` 5.3.0 | SIL OFL 1.1 — `fonts/geist-mono/LICENSE.txt` |
| `Pretendard` | 92 dynamic subsets (8–44 KB each, 2.9 MB in all), variable 45–920 | `pretendard` 1.3.9 | SIL OFL 1.1 — `fonts/pretendard/LICENSE.txt` |

**The family names are the token's names.** `--dds-font-family-sans` is `Geist, Pretendard, …` and `--dds-font-family-mono` is `'Geist Mono', …`, and `fonts.css` registers exactly `"Geist"`, `"Pretendard"` and `"Geist Mono"`. Load the stylesheet and the tokens (and the page-root rule in `styles.css`) resolve to these files with nothing renamed. Not `"Geist Variable"` / `"Pretendard Variable"`: those are what the upstream packages call their own copies, and a stack naming them would not pick these files up.

**A page fetches only what it draws.** Every face has a `unicode-range`, so the browser downloads a file only when the page contains a character in its range. An English page fetches Geist latin (29 KB). A Korean landing page also fetches 12–16 Pretendard subsets — 305 KB for getasklinq.app, 347 KB for gettracelinq.app/ko, 424 KB for getbooklinq.app in Korean (measured in Chromium) — instead of the 2 MB single `PretendardVariable.woff2`. All faces use `font-display: swap`: text paints at once in the fallback and switches when the face arrives.

### Adopting it (Vite, TanStack Start on Workers)

Import the stylesheet once, from the CSS (or the entry) every page loads:

```css
/* src/styles/app.css */
@import "@devslab/site-kit/fonts.css";
```

Vite follows each relative `url()` into `node_modules/@devslab/site-kit/fonts/`, copies the faces it finds into the build's `assets/` with hashed names and rewrites the stylesheet to `/assets/…woff2`. The Worker serves them as static assets from the product's own origin. Every face is larger than Vite's 4 KB inlining limit, so none becomes a `data:` URI (which `font-src 'self'` would block) — if a product raises `build.assetsInlineLimit`, exclude fonts: `assetsInlineLimit: (file) => (file.endsWith(".woff2") ? false : undefined)`.

Optionally preload the Latin face, which every page uses. Import it with `?url` — the same hashed URL the stylesheet ends up with — and pass it to the head:

```ts
import geistLatin from "@devslab/site-kit/fonts/geist/geist-latin-wght-normal.woff2?url";

head: () => toTanStackHead(metadata, { icons: true, fontPreload: geistLatin }),
```

`fontPreload` appends `fontPreloadLinks(geistLatin)` — `{ rel: "preload", as: "font", type: "font/woff2", crossorigin: "anonymous" }`. The `crossorigin` is required even on the same origin: fonts are fetched in CORS mode, and a preload without it is downloaded a second time. Only same-origin paths ending in `.woff2` are accepted. `FAMILY_FONT_PRELOAD_FILE` names the file's path inside the package. Preload nothing else: which Pretendard subsets a page needs depends on its text.

### Without a bundler

Copy `fonts.css` and `fonts/` next to each other into the directory the site serves, keeping the layout, and link the stylesheet:

```js
// scripts/copy-fonts.mjs
import { cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const kit = dirname(createRequire(import.meta.url).resolve("@devslab/site-kit/fonts.css"));
cpSync(join(kit, "fonts.css"), "public/site-kit/fonts.css");
cpSync(join(kit, "fonts"), "public/site-kit/fonts", { recursive: true });
```

```html
<link rel="stylesheet" href="/site-kit/fonts.css">
```

The `url()`s are relative to `fonts.css`, so they resolve to `/site-kit/fonts/…` wherever the pair is copied. `fonts/manifest.json` (copied along) records each file's upstream package, version, size and sha256.

### Moving off a product's own copy

1. Delete the product's `@font-face` rules for Geist, Geist Mono and Pretendard, the script that copies woff2 into `public/fonts/` (and its `.gitignore` lines), any `@fontsource-variable/*` imports, and the `@fontsource-variable/geist`, `@fontsource-variable/geist-mono` and `pretendard` dependencies.
2. Import `@devslab/site-kit/fonts.css` as above.
3. In the product's own stacks, rename `"Geist Variable"` → `Geist`, `"Geist Mono Variable"` → `"Geist Mono"`, `"Pretendard Variable"` → `Pretendard` — or drop a root rule that only restated the token stack: `styles.css` already sets `:where(html) { font-family: var(--dds-font-family-sans) }` (D-032). A Korean-first order such as `:lang(ko) { font-family: Pretendard, Geist, … }` stays the product's choice and works with these faces.
4. Replace a hand-written `<link rel="preload" href="/fonts/geist.woff2">` with `fontPreload`, and update tests that load or check fonts by the old names (`document.fonts.check('1rem "Pretendard Variable"')` → `"Pretendard"`).

### Licenses

All three families are under the SIL Open Font License 1.1; each directory under `fonts/` carries its license text, and the package redistributes the files unmodified. Pretendard reserves its font name, so a modified version (a subset cut by someone else, for example) may not be called Pretendard: these are the author's own subsets, and `scripts/build-fonts.mjs` copies them byte for byte from the published package, never re-cuts them. `node scripts/build-fonts.mjs --check` (part of `check`) fails if a file differs from the manifest; `--vendor` refetches the pinned upstream tarballs (verifying their npm integrity) when a version is bumped.

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

## Google Tag Manager

Each product site loads Tag Manager on its public marketing and legal pages with its own container id; consoles, dashboards and the chat widget stay out. The snippet lives here once (D-031).

**Analytics is opt-in (D-034).** `toTanStackHead(…, { gtm })` and `gtmHeadEntry` below load Tag Manager on every page load without asking. They stay for compatibility; family products switch to the consent-gated path in [Consent](#consent-opt-in-analytics), which emits the same loader only after a grant.

| Export | Entry | What it is |
|---|---|---|
| `gtmHeadScript(id)` | `@devslab/site-kit` | the head loader's script body, no `<script>` tag, no nonce |
| `gtmNoscriptIframe(id)` | `@devslab/site-kit` | the `<iframe>` HTML that goes inside `<noscript>` right after `<body>` opens |
| `GTM_CSP_SOURCES` | `@devslab/site-kit` | the CSP sources Tag Manager + GA4 need, by directive |
| `GTM_CONTAINER_ID_PATTERN` | `@devslab/site-kit` | `/^GTM-[A-Z0-9]+$/` |
| `toTanStackHead(metadata, { gtm })` | `@devslab/site-kit/tanstack-start` | the route head with the loader as `scripts[0]` |
| `gtmHeadEntry(id)` | `@devslab/site-kit/tanstack-start` | the same `scripts` entry, for a route that builds its own head |

The loader is Google's nonce-aware snippet from [Use Tag Manager with a Content Security Policy](https://developers.google.com/tag-platform/security/guides/csp), byte for byte: the standard snippet plus one statement that copies the page's nonce onto the `gtm.js` element, so Tag Manager can pass it on to the scripts it adds. An id that does not match `GTM_CONTAINER_ID_PATTERN` throws `RangeError` before it can reach the script string. That includes `""`, so pass `undefined` (not an empty env var) for "no Tag Manager here".

**Head, per route.** Opt in on the routes that should carry it:

```ts
// a public route
head: () => toTanStackHead(metadata, { icons: true, gtm: GTM_ID }),
```

The entry carries no nonce of its own. `HeadContent` stamps `router.options.ssr.nonce` on every head script it renders, so the loader gets the request's nonce the same way the meta and link tags do. That puts two requirements on the router, both set when it is created (asklinq#427):

- **server:** `ssr.nonce` is the request's nonce. Without it the loader renders with no nonce and the CSP blocks it.
- **client:** `ssr.nonce` is `""`. Browsers hide a nonce from `getAttribute` once the page is under a header CSP, so the server-rendered loader reads back as `nonce=""`; the router's hydration check compares that with the client's `ssr.nonce` and, if they differ, appends a second copy. With `""` it finds the original and adds nothing; with anything else the copy is blocked by the CSP and logs a violation on every page load.

The loader runs on a full page load of a route that has it. Client-side navigation away from such a page keeps Tag Manager loaded (use a History Change trigger for page views). Navigating client-side *into* one from a route without it does not load it: the copy the router appends then is blocked by the CSP, which also keeps Tag Manager from loading twice.

**Body.** The shells render inside `<body>`, not `<body>` itself, so the product's root document renders the noscript as the first child of `<body>`, behind the same per-route condition:

```tsx
<body>
  <Show when={gtmIdForThisRoute()}>{(id) => <noscript innerHTML={gtmNoscriptIframe(id())} />}</Show>
  {props.children}
</body>
```

`tests/site-kit-gtm-noscript-hydration.test.mjs` compiles exactly this with Solid's compiler and hydrates it under the development build: no mismatch, no lost key, and with JavaScript on the noscript stays text.

**CSP.** Add each list in `GTM_CSP_SOURCES` to the directive of the same name:

| Directive | Sources |
|---|---|
| `script-src` | `https://www.googletagmanager.com` |
| `connect-src` | `https://www.googletagmanager.com https://*.google-analytics.com https://*.google.com` |
| `img-src` | `https://www.googletagmanager.com https://*.google-analytics.com` |
| `frame-src` | `https://www.googletagmanager.com` |

These are Google's lists for the Tag Manager container and for "Google Analytics without any Ads features", plus `frame-src` for the noscript iframe. Google names `script-src-elem`; a policy without it falls back to `script-src`. `*.google.com` also covers `www.google.com` and GA4's `*.analytics.google.com` hosts. Not included (add them from the same guide if a container needs them): preview mode (`tagmanager.google.com`, `gstatic`, Google Fonts), Custom JavaScript variables (`'unsafe-eval'`), and Ads or Google signals hosts (`*.g.doubleclick.net`, `pagead2.googlesyndication.com`, `www.googleadservices.com`, `*.google.<TLD>`).

## Consent (opt-in analytics)

Analytics is opt-in for the family (D-034). Until a visitor grants analytics for the current policy version, nothing that contacts Google runs: no Tag Manager loader, no gtag, no GA cookies. The page only pushes Consent Mode v2 defaults (all four signals denied) into its own `dataLayer`. No decision, "거부", a dismissed bar and a decision made under an older policy version all mean the same: nothing loads. Every feature works without consent.

| Export | Entry | What it is |
|---|---|---|
| `createConsentManager(options)` | `@devslab/site-kit` | the browser side: reads and writes the consent cookie, Consent Mode, loads Tag Manager on a grant, withdraws |
| `readConsentCookie(cookie, { policyVersion })` / `consentCookieGrantsAnalytics(…)` | `@devslab/site-kit` | the current, unexpired decision in a Cookie header or `document.cookie` (server or browser) |
| `consentHeadScript({ granted, gtm })` | `@devslab/site-kit` | the head script body: defaults only, or defaults + grant + Google's loader |
| `toTanStackHead(metadata, { consent })` / `consentHeadEntry(…)` | `@devslab/site-kit/tanstack-start` | the same script as a route `scripts` entry, decided from the request's cookie |
| `CONSENT_RESPONSE_HEADERS` | both | `Cache-Control: private, no-store` and `Vary: Cookie` for every response whose head was decided from the cookie |
| `ConsentBanner`, `ConsentSettingsButton` | `@devslab/site-kit/solid` | the bar, its settings dialog, and a "쿠키 설정" button for anywhere else |
| `SiteFooter consentSettings` | `@devslab/site-kit/solid` | the same button at the end of the footer's links |
| `postConsentRecord(path)`, `parseConsentRecord(body, …)`, `isSameOriginRequest(…)` | `@devslab/site-kit` | the record: send it, validate it on the server, refuse cross-site writes |
| `CONSENT_MESSAGES_KO`, `CONSENT_MESSAGES_EN` | `@devslab/site-kit` | default strings; pass your own with the same keys |

**The contract.**

- Categories: *necessary* (always on, shown as information, never a control) and *analytics* (Google Analytics 4 through Tag Manager; off until switched on, never pre-ticked). No advertising category: `ad_storage`, `ad_user_data` and `ad_personalization` stay denied.
- The cookie: `site_consent=v=<policy>&a=<0|1>&t=<unix seconds>&id=<32 hex>`, first-party, `Path=/`, `SameSite=Lax`, `Secure`, 12 months, not `HttpOnly` (the banner reads it). `id` is random, not derived from the visitor. The parser takes exactly those four keys.
- The policy version is one string per product (`"2026-10-05"`). Change it when what the privacy policy says about analytics changes: every visitor is asked again, and nothing loads until they answer. The anonymous id carries over, so the records link.
- Granting pushes `gtag('consent','update',{analytics_storage:'granted'})` and loads Tag Manager once, with the page's nonce (a `csp-nonce` meta, else the first `[nonce]` element, else `options.nonce`).
- Withdrawing pushes the update back to `denied`, sets `ga-disable-<id>` for every id in `measurementIds` (required whenever `gtm` is given — it is the only switch that stops the GA4 tag Tag Manager already initialised, whose own listeners for history page views, scrolls and outbound clicks would otherwise keep sending cookieless pings until the page reloads; `createConsentManager` throws without it), deletes `_ga`, `_ga_*`, `_gid` and `_gat*` on the host and every parent domain, and closes the `dataLayer`: while analytics is not granted, the page's `dataLayer` keeps consent commands and drops everything else, so events pushed before consent are not queued for a Tag Manager that loads later, and events after a withdrawal never reach the one already loaded. Tag Manager itself stays in memory until the next page load.
- Actions in the record: `grant` (analytics becomes granted under this version), `deny` (first decision, refused), `withdraw` (granted → refused), `update` (the same choice saved again).

**TanStack Start.** One module owns the manager:

```ts
// src/consent.ts
import { createConsentManager, postConsentRecord } from "@devslab/site-kit";

export const CONSENT_POLICY_VERSION = "2026-10-05"; // bump with the privacy policy's analytics terms
export const GTM_ID = "GTM-XXXXXXX";
export const consent = createConsentManager({
  policyVersion: CONSENT_POLICY_VERSION,
  gtm: GTM_ID,
  measurementIds: ["G-XXXXXXXXXX"], // every GA4 stream the container sends to; required with gtm
  onChange: postConsentRecord("/api/consent"),
});
```

Each public route decides its head from the request's cookie. The same cookie is read on both sides of hydration, so both render the same script:

```ts
import { createIsomorphicFn } from "@tanstack/solid-start";
import { getRequestHeader } from "@tanstack/solid-start/server";

export const requestCookie = createIsomorphicFn()
  .server(() => getRequestHeader("cookie"))
  .client(() => document.cookie);

head: () => toTanStackHead(metadata, {
  icons: true,
  consent: { policyVersion: CONSENT_POLICY_VERSION, gtm: GTM_ID, cookie: requestCookie() },
}),
```

Without a current grant the entry is the defaults only and nothing in the head names a Google host; with one it adds Google's nonce-aware loader, skipped if `gtm.js` is already on the page. The router stamps `ssr.nonce` on it exactly as on the plain loader (the nonce requirements in [Google Tag Manager](#google-tag-manager) apply unchanged). Passing both `gtm` and `consent` throws: `gtm` alone loads Tag Manager without asking. Render the noscript iframe only when `consentCookieGrantsAnalytics(requestCookie(), { policyVersion })` is true; a visitor without JavaScript has no way to grant, so they never get it.

**Never let a shared cache store these pages.** The head now depends on the visitor's cookie: a granted visitor's HTML carries the Tag Manager loader. If a CDN or edge cache stored it, visitors who never consented would get the loader — Google contact before a grant. Every route that uses `consent` sends `CONSENT_RESPONSE_HEADERS` (`Cache-Control: private, no-store` and `Vary: Cookie`):

```ts
import { CONSENT_RESPONSE_HEADERS } from "@devslab/site-kit/tanstack-start";

export const Route = createRootRoute({
  headers: () => ({ ...CONSENT_RESPONSE_HEADERS }),
  head: () => toTanStackHead(metadata, { consent: { … } }),
});
```

A route that must stay cacheable renders the denied head for everyone (`consentHeadScript()` with no grant) and lets the manager load Tag Manager after hydration, as the static export below does.

Mount the banner once, as the first element in `<body>`, so it is the first thing keyboard users reach, and put the trigger in the footer:

```tsx
<body>
  <ConsentBanner controller={consent} messages={lang() === "ko" ? CONSENT_MESSAGES_KO : CONSENT_MESSAGES_EN} learnMoreHref={`/${lang()}/privacy#analytics`} privacyHref={`/${lang()}/privacy`} />
  <MarketingShell
    footer={{ …, consentSettings: { controller: consent, label: t("cookieSettings") } }}
    …
  />
</body>
```

The banner renders nothing on the server and nothing during hydration; the bar comes in after mount, from the browser's own cookie (`tests/site-kit-consent-hydration.test.mjs` hydrates exactly this under the development build). Its text is short — a title, one or two sentences on what is collected, why, and that it is optional — and its *자세히 보기* (`learnMore`) is a plain link to `learnMoreHref`, **your privacy policy's section on analytics and its overseas transfer, with the anchor** (required; without a `#fragment` the banner throws `RangeError`). The kit's default strings name no recipient, country or retention period: that section must carry the full disclosure — Google Analytics 4, the recipient Google LLC, the transfer to the United States, the retention period, that it is not used for advertising, and how to withdraw (the footer's 쿠키 설정). Its three choices — 모두 허용, 거부, 설정 — are the same button at the same size. Your own labels may be longer than these: the bar follows its own width — one row on a wide screen, the copy above a row of three below 60rem, and at 36rem and below the three stacked full width at equal height (the settings dialog likewise) — and a label wraps only at a space, never inside a word (Korean keeps whole words). ✕ and Escape close it without a decision. The settings dialog traps focus, closes on Escape without saving, and shows *necessary* as text and *analytics* as an unticked switch, one line each, then a link to `privacyHref` and two equal buttons: 취소 (close without saving, like ✕) and 선택 저장. The footer button (or `ConsentSettingsButton`, or `consent.openSettings()`) reopens it to change or withdraw at any time.

A path that carries a secret goes into the record redacted: `createConsentManager({ …, recordPath: (path) => path.replace(/\/k\/[^/]+/, "/k/:key") })`.

**Recording consent (server).** Every decision POSTs a record to the product's own backend:

```json
{ "policyVersion": "2026-10-05", "analytics": true, "action": "grant", "anonymousId": "<32 hex>", "decidedAt": 1759650000, "source": "web", "path": "/ko/pricing" }
```

The endpoint must not become a tracking vector: same origin only, the exact payload, rate-limited.

```ts
import { CONSENT_RECORD_MAX_BYTES, isSameOriginRequest, parseConsentRecord } from "@devslab/site-kit";

if (request.method !== "POST") return new Response(null, { status: 405 });
if (!isSameOriginRequest(request, "https://getasklinq.app")) return new Response(null, { status: 403 });
if (Number(request.headers.get("content-length") ?? 0) > CONSENT_RECORD_MAX_BYTES) return new Response(null, { status: 413 });
const ip = request.headers.get("cf-connecting-ip") ?? "";
if (!(await env.CONSENT_RATE_LIMIT.limit({ key: ip })).success) return new Response(null, { status: 429 });
const record = parseConsentRecord(await request.text(), { policyVersion: CONSENT_POLICY_VERSION });
if (!record) return new Response(null, { status: 400 });
await insertConsentRecord(env, { ...record, receivedAt: new Date().toISOString(), ip, userAgent: (request.headers.get("user-agent") ?? "").slice(0, 256) });
return new Response(null, { status: 204 });
```

`parseConsentRecord` takes the exact seven keys, a known policy version (pass a list while records made under the previous one may still arrive), an action that agrees with `analytics`, a path with no query, and a `decidedAt` neither in the future nor older than 31 days. A failed POST (network, 429, 5xx) is kept in `localStorage` and sent again on the next page; a 4xx is dropped. A reference table, append-only for the application:

```sql
CREATE TABLE consent_records (
  id             TEXT PRIMARY KEY,                -- server-generated
  received_at    TEXT NOT NULL,                   -- server clock, UTC
  decided_at     INTEGER NOT NULL,                -- the record's decidedAt (the cookie's t)
  subject_type   TEXT NOT NULL CHECK (subject_type IN ('user', 'anonymous')),
  subject_id     TEXT NOT NULL,                   -- internal user id when logged in, else the anonymous id
  login_id       TEXT,                            -- login id snapshot when logged in
  anonymous_id   TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  analytics      INTEGER NOT NULL CHECK (analytics IN (0, 1)),
  action         TEXT NOT NULL CHECK (action IN ('grant', 'deny', 'withdraw', 'update')),
  source         TEXT NOT NULL CHECK (source IN ('web', 'app')),
  path           TEXT NOT NULL,
  ip             TEXT,
  user_agent     TEXT                             -- first 256 characters
);
CREATE INDEX consent_records_by_visitor ON consent_records (anonymous_id, decided_at);
CREATE TRIGGER consent_records_append_only BEFORE UPDATE ON consent_records
BEGIN SELECT RAISE(ABORT, 'consent records are append-only'); END;
```

Keep each record while its consent is in effect and for a retention period after it ends (3 years by default — make it a setting, and say it in the privacy policy). A consent ends when the same visitor decides again or when it expires 12 months after `decided_at`, whichever is first. The retention sweep is the only `DELETE`:

```sql
DELETE FROM consent_records AS r
WHERE MIN(
  COALESCE((SELECT MIN(n.decided_at) FROM consent_records AS n
            WHERE n.anonymous_id = r.anonymous_id AND n.decided_at > r.decided_at), r.decided_at + 31536000),
  r.decided_at + 31536000
) + :retention_seconds < :now_seconds;
```

In Postgres, write the two-argument `MIN` as `LEAST`, and keep the table append-only by granting the application role `SELECT, INSERT` only (the sweep runs as a separate role).

**Without Solid (devslab.kr, Next.js static export).** A static page cannot read the cookie when it is built, so its head carries only the defaults and the manager loads Tag Manager after hydration when the cookie grants:

```tsx
// pages/_document.tsx — replaces the Tag Manager loader and the noscript iframe
<Head>
  <script dangerouslySetInnerHTML={{ __html: consentHeadScript() }} />
</Head>
```

```tsx
// src/consent.ts
import { createConsentManager } from "@devslab/site-kit";
export const consent = createConsentManager({ policyVersion: "2026-10-05", gtm: "GTM-XXXXXXX", measurementIds: ["G-XXXXXXXXXX"] });

// src/components/ConsentBar.tsx — the product's own markup, the kit's behaviour and strings
import { useEffect, useState } from "react";
import { CONSENT_MESSAGES_KO as m } from "@devslab/site-kit";
import { consent } from "../consent";

export function ConsentBar() {
  const [ask, setAsk] = useState(false);
  const [settings, setSettings] = useState(false);
  useEffect(() => {
    consent.start(); // applies a stored grant: loads Tag Manager, once
    const sync = () => setAsk(consent.needsDecision() && !consent.dismissed());
    sync();
    const off = consent.subscribe((event) => (event.type === "open-settings" ? setSettings(true) : sync()));
    const unbind = consent.bindTriggers(); // any [data-consent-settings] opens the settings
    return () => { off(); unbind(); };
  }, []);
  // Render the bar while `ask`: m.title, m.body, an m.learnMore link to /privacy#analytics, and three equal buttons —
  // consent.acceptAll(), consent.rejectAll(), setSettings(true). Escape → consent.dismiss().
  // The settings dialog: m.necessaryTitle as text, an unticked switch for m.analyticsSwitch,
  // a link to /privacy, and two equal buttons: m.cancel (close) and m.save → consent.save({ analytics }).
  return null;
}

// In the footer:
// <a href="#cookie-settings" data-consent-settings>{m.trigger}</a>
```

The cookie is per host and `Path=/`, so plain HTML pages on the same host that load no React only need `consent.start()` from a module script: a decision made on any page of the host applies to them.

**Console steps the code cannot do.** In Tag Manager, set each GA4 tag's consent settings to *Require additional consent for tag to fire: `analytics_storage`*, so a tag never fires on a denied page even if Tag Manager is still in memory after a withdrawal. In GA4, keep data retention at what your policy section says (14 months on the family sites) and Google signals and ads personalisation off (there is no advertising category).

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
