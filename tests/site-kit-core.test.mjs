import assert from "node:assert/strict";
import test from "node:test";

import {
  LOCALES,
  createTranslator,
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
