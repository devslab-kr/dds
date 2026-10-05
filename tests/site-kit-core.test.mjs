import assert from "node:assert/strict";
import test from "node:test";

import {
  FAMILY_LOCALES,
  LOCALES,
  createTranslator,
  defineLocaleRegistry,
  localeAttributes,
  resolveLocale,
  validateCatalogs,
} from "../packages/site-kit/src/core/index.mjs";
import {
  BRAND_ICON_FILES,
  brandIconLinks,
  buildMetadata,
  buildRobots,
  buildSitemap,
} from "../packages/site-kit/src/core/seo.mjs";
import { gtmHeadEntry, toTanStackHead } from "../packages/site-kit/src/tanstack-start.mjs";
import {
  GTM_CONTAINER_ID_PATTERN,
  GTM_CSP_SOURCES,
  gtmHeadScript,
  gtmNoscriptIframe,
} from "../packages/site-kit/src/core/gtm.mjs";
import * as coreIndex from "../packages/site-kit/src/core/index.mjs";
import vm from "node:vm";
import {
  VerifiedFactRegistry,
  buildVerifiedJsonLd,
  renderLlmsTxt,
} from "../packages/site-kit/src/core/geo.mjs";
import { FLAGS_BY_COUNTRY, FLAG_COUNTRY, LOCALE_FLAGS, flagFor } from "../packages/site-kit/src/core/flags.mjs";

const localeCodes = ["ko", "en", "ja", "zh-HK", "zh-TW", "hi", "vi", "id", "th", "pt-BR", "fr", "de", "es", "ar"];

test("locale manifest is exact and Arabic is RTL", () => {
  assert.deepEqual(LOCALES.map(({ code }) => code), localeCodes);
  for (const locale of localeCodes) {
    const attrs = localeAttributes(locale);
    assert.equal(attrs.lang, locale);
    assert.equal(attrs.dir, locale === "ar" ? "rtl" : "ltr");
  }
});

test("locale resolver follows route, cookie, Accept-Language, default precedence", () => {
  assert.deepEqual(resolveLocale({ pathname: "/fr/pricing", cookie: "locale=ja", acceptLanguage: "de;q=1", defaultLocale: "ko" }), { locale: "fr", source: "route" });
  assert.deepEqual(resolveLocale({ pathname: "/pricing", cookie: "theme=dark; locale=ja", acceptLanguage: "de;q=1", defaultLocale: "ko" }), { locale: "ja", source: "cookie" });
  assert.deepEqual(resolveLocale({ pathname: "/pricing", cookie: "", acceptLanguage: "es-MX;q=.8, de;q=.9", defaultLocale: "ko" }), { locale: "de", source: "accept-language" });
  assert.deepEqual(resolveLocale({ pathname: "/pricing", cookie: "", acceptLanguage: "", defaultLocale: "ko" }), { locale: "ko", source: "default" });
  assert.deepEqual(resolveLocale({ pathname: "/pricing", cookie: "locale=%E0%A4%A", acceptLanguage: "vi", defaultLocale: "ko" }), { locale: "vi", source: "accept-language" });
});

test("strict catalogs reject missing, extra, and placeholder drift without fallback", () => {
  const valid = Object.fromEntries(localeCodes.map((locale) => [locale, { hello: "Hello {name}", submit: "Submit" }]));
  assert.doesNotThrow(() => validateCatalogs(valid, "en"));
  for (const [mutation, pattern] of [
    [(catalog) => { delete catalog.ko.submit; }, /missing.*submit/i],
    [(catalog) => { catalog.ja.extra = "Extra"; }, /extra.*extra/i],
    [(catalog) => { catalog.ar.hello = "مرحبا {user}"; }, /placeholder.*hello/i],
  ]) {
    const catalogs = structuredClone(valid);
    mutation(catalogs);
    assert.throws(() => validateCatalogs(catalogs, "en"), pattern);
  }
  const t = createTranslator({ hello: "Hello {name}" }, "en");
  assert.equal(t("hello", { name: "Linq" }), "Hello Linq");
  assert.throws(() => t("missing"), /missing translation/i);
  assert.throws(() => t("hello", {}), /missing placeholder/i);
});

test("metadata emits localized canonical, all hreflang entries, and x-default", () => {
  const metadata = buildMetadata({
    baseUrl: "https://example.com",
    path: "/pricing",
    locale: "ar",
    defaultLocale: "ko",
    title: "الأسعار",
    description: "وصف",
    siteName: "Example",
    image: "/og.png",
  });
  assert.equal(metadata.html.dir, "rtl");
  assert.equal(metadata.canonical, "https://example.com/ar/pricing");
  assert.equal(metadata.alternates.length, 15);
  assert.equal(metadata.alternates.find(({ hreflang }) => hreflang === "x-default").href, "https://example.com/pricing");
  assert.equal(metadata.openGraph.locale, "ar");
});

test("sitemap and robots distinguish public production from preview", () => {
  const sitemap = buildSitemap({ baseUrl: "https://example.com", routes: ["/", "/pricing"], defaultLocale: "ko" });
  assert.equal(sitemap.length, 28);
  assert.equal(sitemap[0].alternates.length, 15);
  assert.equal(sitemap[0].alternates.at(-1).hreflang, "x-default");
  assert.match(sitemap[0].loc, /^https:\/\/example\.com/);
  assert.match(buildRobots({ baseUrl: "https://example.com", environment: "production" }), /Sitemap: https:\/\/example\.com\/sitemap\.xml/);
  assert.match(buildRobots({ baseUrl: "https://preview.example.com", environment: "preview" }), /Disallow: \//);
});

test("robots can separate search, citation, and model-training policy", () => {
  const robots = buildRobots({
    baseUrl: "https://example.com",
    environment: "production",
    policies: { search: "allow", citation: "allow", modelTraining: "disallow" },
  });
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /User-agent: OAI-SearchBot[\s\S]*Allow: \//);
  assert.match(robots, /User-agent: GPTBot[\s\S]*Disallow: \//);
});

test("GEO output accepts only sourced, current facts", () => {
  const registry = new VerifiedFactRegistry([
    { id: "coverage", value: "14 locales", sourceUrl: "https://example.com/facts/coverage", verifiedAt: "2026-08-01" },
  ], { now: "2026-08-29" });
  const schema = buildVerifiedJsonLd({
    type: "SoftwareApplication",
    id: "https://example.com/#product",
    identity: { name: "Example", url: "https://example.com" },
    claims: { featureList: { factId: "coverage" } },
  }, registry);
  assert.equal(schema.featureList, "14 locales");
  assert.equal(schema["@context"], "https://schema.org");
  assert.match(renderLlmsTxt({ title: "Example", summary: "Product", canonicalUrl: "https://example.com", facts: registry }), /14 locales/);
  assert.throws(() => buildVerifiedJsonLd({ type: "SoftwareApplication", id: "x", identity: { name: "x", url: "https://example.com" }, claims: { description: { factId: "missing" } } }, registry), /unverified fact/i);
  assert.throws(() => buildVerifiedJsonLd({ type: "Thing", id: "x", identity: { name: "x", url: "https://example.com" }, claims: {} }, registry), /unsupported schema type/i);
  assert.throws(() => buildVerifiedJsonLd({ type: "toString", id: "x", identity: { name: "x", url: "https://example.com" }, claims: {} }, registry), /unsupported schema type/i);
  assert.throws(() => buildVerifiedJsonLd({ type: "SoftwareApplication", id: "x", identity: { name: "x", url: "https://example.com" }, claims: { aggregateRating: { factId: "coverage" } } }, registry), /unsupported claim/i);
});

test("every locale has exactly one flag and the flag data is renderable SVG", () => {
  assert.deepEqual(Object.keys(FLAG_COUNTRY).sort(), [...localeCodes].sort());
  assert.deepEqual(Object.keys(LOCALE_FLAGS).sort(), [...localeCodes].sort());
  for (const locale of localeCodes) {
    const flag = flagFor(locale);
    assert.equal(flag.country, FLAG_COUNTRY[locale]);
    assert.match(flag.viewBox, /^0 0 \d+ \d+$/);
    assert.ok(flag.body.length > 0, `${locale} body is empty`);
    assert.doesNotMatch(flag.body, /<svg\b/, `${locale} body must be inner markup only`);
    assert.doesNotMatch(flag.body, /<script|on[a-z]+=/i, `${locale} body must be inert`);
  }
  assert.throws(() => flagFor("xx"), RangeError);
});

// --- product locales -------------------------------------------------------
//
// The family list is what devslab.kr markets in. It is not every product's
// list: BookLinq sells to salons in India and its assistant already answers
// in Tamil, Telugu, Bengali, Marathi, Gujarati and Kannada. Those are not
// family languages, and a page that cannot render them is a page that lies
// about what the product does. So the family owns the mechanism and the
// product names its own nouns.

const BOOKLINQ_EXTRA = [
  { code: "ta", language: "Tamil", nativeName: "தமிழ்", dir: "ltr", flagCountry: "in" },
  { code: "kn", language: "Kannada", nativeName: "ಕನ್ನಡ", dir: "ltr", flagCountry: "in" },
  { code: "bn", language: "Bengali", nativeName: "বাংলা", dir: "ltr", flagCountry: "in" },
];

test("a registry is the family list plus the product's own, in that order", () => {
  const registry = defineLocaleRegistry({ extra: BOOKLINQ_EXTRA });
  assert.deepEqual(registry.LOCALES.map(({ code }) => code), [...localeCodes, "ta", "kn", "bn"]);
  // The bare exports stay the family's — a consumer that never calls
  // defineLocaleRegistry sees exactly what it saw before.
  assert.deepEqual(LOCALES.map(({ code }) => code), localeCodes);
});

test("a product locale resolves everywhere the family's does", () => {
  const registry = defineLocaleRegistry({ extra: BOOKLINQ_EXTRA });
  assert.equal(registry.canonicalLocale("ta"), "ta");
  assert.equal(registry.canonicalLocale("TA"), "ta");
  assert.equal(registry.canonicalLocale("ta-IN"), "ta");
  assert.deepEqual(registry.localeAttributes("bn"), { lang: "bn", dir: "ltr" });
  assert.deepEqual(registry.resolveLocale({ pathname: "/kn/book", defaultLocale: "en" }), { locale: "kn", source: "route" });
  assert.deepEqual(registry.resolveLocale({ pathname: "/book", acceptLanguage: "ta-IN,ta;q=0.9", defaultLocale: "en" }), { locale: "ta", source: "accept-language" });
  // And the family registry still refuses it, so nothing leaks sideways.
  assert.throws(() => localeAttributes("ta"), RangeError);
});

test("direction comes from the definition, not from a test for Arabic", () => {
  // The old form read `canonical === "ar" ? "rtl" : "ltr"`. That was right
  // only while Arabic was the family's one RTL language: a product adding
  // Urdu or Hebrew would have had it rendered left-to-right with every
  // test still green.
  const registry = defineLocaleRegistry({
    extra: [{ code: "ur", language: "Urdu", nativeName: "اردو", dir: "rtl", flagCountry: "in" }],
  });
  assert.deepEqual(registry.localeAttributes("ur"), { lang: "ur", dir: "rtl" });
  assert.deepEqual(registry.localeAttributes("ar"), { lang: "ar", dir: "rtl" });
  assert.deepEqual(registry.localeAttributes("en"), { lang: "en", dir: "ltr" });
});

test("a registry refuses a definition that would render wrong", () => {
  assert.throws(() => defineLocaleRegistry({ extra: [{ code: "en", language: "English", nativeName: "English", dir: "ltr", flagCountry: "gb" }] }), /already a family locale/);
  assert.throws(() => defineLocaleRegistry({ extra: [{ code: "ta", language: "Tamil", dir: "ltr", flagCountry: "in" }] }), /nativeName/);
  assert.throws(() => defineLocaleRegistry({ extra: [{ code: "ta", language: "Tamil", nativeName: "தமிழ்", dir: "sideways", flagCountry: "in" }] }), /dir/);
  const ta = { code: "ta", language: "Tamil", nativeName: "தமிழ்", dir: "ltr", flagCountry: "in" };
  assert.throws(() => defineLocaleRegistry({ extra: [ta, ta] }), /appears twice/);
});

test("product locales reuse a vendored flag rather than shipping a second copy", () => {
  const registry = defineLocaleRegistry({ extra: BOOKLINQ_EXTRA });
  // Seven locales legitimately share one flag: a flag names a country, and
  // India speaks more than one language.
  for (const code of ["ta", "kn", "bn"]) {
    assert.equal(flagFor(code, registry), FLAGS_BY_COUNTRY.in);
    assert.equal(flagFor(code, registry), flagFor("hi"));
  }
  assert.throws(() => flagFor("ta"), /No flag for locale/);
  const noSuchCountry = defineLocaleRegistry({ extra: [{ code: "cy", language: "Welsh", nativeName: "Cymraeg", dir: "ltr", flagCountry: "wa" }] });
  assert.throws(() => flagFor("cy", noSuchCountry), /No vendored flag for country/);
});

test("catalogs and metadata cover the product's languages, not just the family's", () => {
  const registry = defineLocaleRegistry({ extra: BOOKLINQ_EXTRA });
  const catalogs = Object.fromEntries(registry.LOCALES.map(({ code }) => [code, { hello: "hi" }]));

  // Validating against the family registry would pass a catalog that is
  // missing every product language — the failure mode this argument exists
  // to prevent.
  delete catalogs.ta;
  assert.equal(validateCatalogs(catalogs, "en"), true);
  assert.throws(() => validateCatalogs(catalogs, "en", { registry }), /missing locale ta/);
  catalogs.ta = { hello: "வணக்கம்" };
  assert.equal(validateCatalogs(catalogs, "en", { registry }), true);

  const metadata = buildMetadata({
    baseUrl: "https://getbooklinq.app", path: "/", locale: "ta", defaultLocale: "en",
    title: "t", description: "d", siteName: "BookLinq", image: "/og.png", registry,
  });
  assert.deepEqual(metadata.html, { lang: "ta", dir: "ltr" });
  assert.equal(metadata.canonical, "https://getbooklinq.app/ta");
  assert.ok(metadata.alternates.some(({ hreflang }) => hreflang === "ta"), "a page that renders in Tamil must say so in hreflang");
  assert.equal(metadata.alternates.length, registry.LOCALES.length + 1);

  const sitemap = buildSitemap({ baseUrl: "https://getbooklinq.app", routes: ["/"], defaultLocale: "en", registry });
  assert.equal(sitemap.length, registry.LOCALES.length);
});

test("a subset registry keeps only the named family locales, in family order, before any extra", () => {
  const registry = defineLocaleRegistry({ only: ["en", "ko", "ja"] });
  assert.deepEqual(registry.LOCALES.map(({ code }) => code), ["ko", "en", "ja"]);
  assert.equal(registry.canonicalLocale("ar"), undefined);
  assert.equal(registry.resolveLocale({ acceptLanguage: "ar,de;q=0.8", defaultLocale: "ko" }).locale, "ko");
  assert.equal(registry.resolveLocale({ acceptLanguage: "ja-JP,en;q=0.5", defaultLocale: "ko" }).locale, "ja");
  const withExtra = defineLocaleRegistry({ only: ["ko"], extra: [{ code: "ta", language: "Tamil", nativeName: "தமிழ்", dir: "ltr", flagCountry: "in" }] });
  assert.deepEqual(withExtra.LOCALES.map(({ code }) => code), ["ko", "ta"]);
});

test("a subset registry refuses unknown codes and an empty list", () => {
  assert.throws(() => defineLocaleRegistry({ only: ["ko", "xx"] }), /xx is not a family locale/);
  assert.throws(() => defineLocaleRegistry({ only: [] }), /at least one locale/);
});

test("the family registry is untouched by the subset option", () => {
  assert.equal(FAMILY_LOCALES.LOCALES.length, 14);
  assert.equal(defineLocaleRegistry().LOCALES.length, 14);
});

test("brand icon links name the linq-brand files a product serves, in one fixed order", () => {
  const links = brandIconLinks();
  assert.deepEqual(links, [
    { rel: "icon", type: "image/svg+xml", href: "/brand/favicon.svg" },
    { rel: "icon", type: "image/png", sizes: "48x48", href: "/brand/mark-48.png" },
    { rel: "icon", sizes: "16x16 32x32 48x48", href: "/brand/favicon.ico" },
    { rel: "apple-touch-icon", sizes: "180x180", href: "/brand/apple-touch-icon.png" },
  ]);
  // Every href is a file @devslab/linq-brand ships under dist/<product>/, so a
  // product that serves that directory as-is at basePath serves all of them.
  for (const { href } of links) assert.ok(BRAND_ICON_FILES.includes(href.slice("/brand/".length)), href);
  assert.deepEqual(new Set(BRAND_ICON_FILES), new Set(links.map(({ href }) => href.slice("/brand/".length))));
  // Search engines need one raster of at least 48px (Google: "at least 8x8px, preferably >48x48px").
  assert.ok(links.some(({ sizes }) => /^(?:48|96|144|192)x(?:48|96|144|192)$/.test(sizes ?? "")));
  // The SVG comes first so browsers that understand it never fetch the raster.
  assert.equal(links[0].type, "image/svg+xml");
});

test("brand icon links follow the base path a product serves the files at", () => {
  assert.deepEqual(brandIconLinks({ basePath: "/" }).map(({ href }) => href), ["/favicon.svg", "/mark-48.png", "/favicon.ico", "/apple-touch-icon.png"]);
  assert.equal(brandIconLinks({ basePath: "assets/brand/" })[0].href, "/assets/brand/favicon.svg");
  assert.equal(brandIconLinks({ basePath: "/brand" })[0].href, "/brand/favicon.svg");
  assert.throws(() => brandIconLinks({ basePath: "https://cdn.example.com/brand" }), RangeError);
});

test("the TanStack adapter appends the icon links only when asked, after canonical and alternates", () => {
  const metadata = buildMetadata({
    baseUrl: "https://example.com",
    path: "/",
    locale: "ko",
    defaultLocale: "ko",
    title: "Example",
    description: "Example site",
    siteName: "Example",
    image: "/og.png",
  });
  const bare = toTanStackHead(metadata);
  assert.ok(!bare.links.some(({ rel }) => rel === "icon" || rel === "apple-touch-icon"));
  const withIcons = toTanStackHead(metadata, { icons: true });
  const rels = withIcons.links.map(({ rel }) => rel);
  assert.equal(rels.filter((rel) => rel === "icon").length, 3);
  assert.ok(rels.indexOf("icon") > rels.lastIndexOf("alternate"));
  assert.deepEqual(withIcons.links.slice(0, bare.links.length), bare.links);
  assert.equal(toTanStackHead(metadata, { icons: { basePath: "/" } }).links.at(-1).href, "/apple-touch-icon.png");
  assert.deepEqual(toTanStackHead(metadata, { icons: false }), bare);
});

// Google's nonce-aware container snippet, as published in "Use Tag Manager
// with a Content Security Policy"
// (https://developers.google.com/tag-platform/security/guides/csp), with the
// placeholder id. Pinned here so an edit to gtm.mjs that drifts from Google's
// text fails, not just one that breaks the id.
const GOOGLE_NONCE_AWARE_SNIPPET = `<script nonce='{SERVER-GENERATED-NONCE}'>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;var n=d.querySelector('[nonce]');
n&&j.setAttribute('nonce',n.nonce||n.getAttribute('nonce'));f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXX');</script>`;
const GOOGLE_NOSCRIPT = `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;

test("gtmHeadScript is Google's nonce-aware loader byte for byte, with only the container id substituted", () => {
  const body = GOOGLE_NONCE_AWARE_SNIPPET.replace(/^<script nonce='\{SERVER-GENERATED-NONCE\}'>/, "").replace(/<\/script>$/, "");
  assert.equal(gtmHeadScript("GTM-XXXXXX"), body);
  assert.equal(gtmHeadScript("GTM-5VC3HXL4"), body.replace("'GTM-XXXXXX'", "'GTM-5VC3HXL4'"));
  assert.doesNotMatch(gtmHeadScript("GTM-ABC"), /<\/?script|nonce=/, "the renderer owns the element and its nonce");
});

test("gtmNoscriptIframe is Google's noscript iframe for the id", () => {
  const iframe = GOOGLE_NOSCRIPT.replace(/^<noscript>/, "").replace(/<\/noscript>$/, "").replace("\n", " ");
  assert.equal(gtmNoscriptIframe("GTM-XXXXXX"), iframe);
  assert.equal(gtmNoscriptIframe("GTM-AB12CD3"), '<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-AB12CD3" height="0" width="0" style="display:none;visibility:hidden"></iframe>');
});

test("a malformed container id never reaches a script string", () => {
  for (const bad of [
    "", "GTM-", "gtm-abc123", "GTM-abc123", "UA-12345-1", "G-ABC123", " GTM-ABC123", "GTM-ABC123 ",
    "GTM-ABC123\n", "GTM-ABC'); alert(1); ('", "GTM-ABC</script><script>alert(1)</script>", "GTM-ABC\"", "GTM-A_B",
    undefined, null, 123, ["GTM-ABC123"], { toString: () => "GTM-ABC123" },
  ]) {
    assert.throws(() => gtmHeadScript(bad), RangeError, `head script must refuse ${JSON.stringify(bad)}`);
    assert.throws(() => gtmNoscriptIframe(bad), RangeError, `noscript must refuse ${JSON.stringify(bad)}`);
    assert.throws(() => gtmHeadEntry(bad), RangeError);
    // `gtm: undefined` is "no Tag Manager on this route", not a malformed id.
    if (bad !== undefined) assert.throws(() => toTanStackHead(buildMetadata({ baseUrl: "https://example.com", path: "/", locale: "ko", defaultLocale: "ko", title: "t", description: "d", siteName: "s", image: "/og.png" }), { gtm: bad }), RangeError);
  }
  assert.equal(GTM_CONTAINER_ID_PATTERN.test("GTM-5VC3HXL4"), true);
});

// Runs the loader in a node:vm context against a minimal fake document —
// only Node built-ins, because this file runs in the source-contracts CI job,
// which installs no packages. The fake models what the snippet touches:
// getElementsByTagName, createElement, querySelector('[nonce]') and
// insertBefore. The nonced element hides its attribute the way a browser does
// under a header CSP (getAttribute returns ""), so the test proves the loader
// reads the `nonce` property, not the attribute.
function runLoader(id, { nonce } = {}) {
  const inserted = [];
  const element = (tag) => {
    const attributes = {};
    return { tagName: tag.toUpperCase(), attributes, setAttribute: (name, value) => { attributes[name] = String(value); }, getAttribute: (name) => attributes[name] ?? null };
  };
  const firstScript = { ...element("script"), src: "/app.js", parentNode: { insertBefore: (node, before) => inserted.push({ node, before }) } };
  const nonced = nonce === undefined ? null : { nonce, getAttribute: (name) => (name === "nonce" ? "" : null) };
  const queries = [];
  const document = {
    getElementsByTagName: (tag) => (tag === "script" ? [firstScript] : []),
    createElement: element,
    querySelector: (selector) => { queries.push(selector); return selector === "[nonce]" ? nonced : null; },
  };
  const window = {};
  vm.runInNewContext(gtmHeadScript(id), { window, document });
  return { window, inserted, firstScript, queries };
}

test("the loader queues gtm.js before the page's first script and hands it the page nonce", () => {
  const { window, inserted, firstScript, queries } = runLoader("GTM-AB12CD3", { nonce: "r4nd0m" });
  assert.equal(window.dataLayer.length, 1);
  assert.equal(window.dataLayer[0].event, "gtm.js");
  assert.equal(typeof window.dataLayer[0]["gtm.start"], "number");
  assert.equal(inserted.length, 1);
  const [{ node, before }] = inserted;
  assert.equal(node.tagName, "SCRIPT");
  assert.equal(node.src, "https://www.googletagmanager.com/gtm.js?id=GTM-AB12CD3");
  assert.equal(node.async, true);
  assert.equal(before, firstScript, "inserted before the page's first script");
  assert.deepEqual(queries, ["[nonce]"]);
  assert.equal(node.getAttribute("nonce"), "r4nd0m", "copied from the nonce property, which survives the browser hiding the attribute");
});

test("the loader on a page without nonces loads gtm.js and sets no nonce", () => {
  const { window, inserted } = runLoader("GTM-AB12CD3");
  assert.equal(window.dataLayer[0].event, "gtm.js");
  assert.equal(inserted.length, 1);
  assert.equal(inserted[0].node.src, "https://www.googletagmanager.com/gtm.js?id=GTM-AB12CD3");
  assert.equal(inserted[0].node.getAttribute("nonce"), null);
});

test("the loader keeps an existing dataLayer and appends to it", () => {
  const inserted = [];
  const window = { dataLayer: [{ event: "consent" }] };
  const document = {
    getElementsByTagName: () => [{ parentNode: { insertBefore: (node) => inserted.push(node) } }],
    createElement: () => ({ setAttribute() {} }),
    querySelector: () => null,
  };
  vm.runInNewContext(gtmHeadScript("GTM-AB12CD3"), { window, document });
  assert.equal(window.dataLayer.length, 2);
  assert.equal(window.dataLayer[0].event, "consent");
  assert.equal(window.dataLayer[1].event, "gtm.js");
});

test("the CSP sources are Google's Tag Manager + GA4-without-Ads lists, plus frame-src for the noscript iframe", () => {
  assert.deepEqual(GTM_CSP_SOURCES, {
    "script-src": ["https://www.googletagmanager.com"],
    "connect-src": ["https://www.googletagmanager.com", "https://*.google-analytics.com", "https://*.google.com"],
    "img-src": ["https://www.googletagmanager.com", "https://*.google-analytics.com"],
    "frame-src": ["https://www.googletagmanager.com"],
  });
  assert.ok(Object.isFrozen(GTM_CSP_SOURCES) && Object.values(GTM_CSP_SOURCES).every(Object.isFrozen));
  const all = Object.values(GTM_CSP_SOURCES).flat().join(" ");
  assert.doesNotMatch(all, /unsafe-|doubleclick|googlesyndication|googleadservices|tagmanager\.google\.com/, "preview mode, Custom JavaScript variables and Ads stay opt-in per product");
  const iframeOrigin = new URL(gtmNoscriptIframe("GTM-ABC").match(/src="([^"]+)"/)[1]).origin;
  assert.ok(GTM_CSP_SOURCES["frame-src"].includes(iframeOrigin), "frame-src admits the noscript iframe");
  const loaderOrigin = new URL(gtmHeadScript("GTM-ABC").match(/'(https:[^']+)'/)[1]).origin;
  assert.ok(GTM_CSP_SOURCES["script-src"].includes(loaderOrigin), "script-src admits gtm.js");
});

test("the core index exports the Tag Manager helpers", () => {
  for (const name of ["GTM_CONTAINER_ID_PATTERN", "GTM_CSP_SOURCES", "gtmHeadScript", "gtmNoscriptIframe"]) assert.ok(name in coreIndex, name);
});

test("the TanStack adapter adds the Tag Manager loader as a head script only when asked, without a nonce of its own", () => {
  const metadata = buildMetadata({ baseUrl: "https://example.com", path: "/", locale: "ko", defaultLocale: "ko", title: "Example", description: "Example site", siteName: "Example", image: "/og.png" });
  const bare = toTanStackHead(metadata);
  assert.equal("scripts" in bare, false, "no gtm, no scripts key — routes that spread the head keep their own");
  const withGtm = toTanStackHead(metadata, { gtm: "GTM-AB12CD3", icons: true });
  assert.deepEqual(withGtm.scripts, [{ children: gtmHeadScript("GTM-AB12CD3") }]);
  assert.deepEqual(withGtm.scripts[0], gtmHeadEntry("GTM-AB12CD3"));
  assert.equal("nonce" in withGtm.scripts[0], false, "the router stamps ssr.nonce on head scripts; the entry must not carry one");
  assert.deepEqual(withGtm.meta, bare.meta);
  assert.deepEqual(withGtm.links, toTanStackHead(metadata, { icons: true }).links);
});
