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
  buildMetadata,
  buildRobots,
  buildSitemap,
} from "../packages/site-kit/src/core/seo.mjs";
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
