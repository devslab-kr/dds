import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";

import { LocaleMenu, MarketingShell, SiteFooter, SiteHeader } from "../index";
import { CONSENT_MESSAGES_KO, createConsentManager } from "../../core/consent.mjs";
import { LOCALE_FLAGS } from "../../core/flags.mjs";
import { defineLocaleRegistry, localeHrefs } from "../../core/locales.mjs";
import { locale, messages } from "./fixtures";

const Fixture = () => <MarketingShell
  messages={messages}
  header={{ brand: { name: "VisionLinq", href: "/" }, navigation: [], locale, messages }}
  footer={{ brand: { name: "VisionLinq", href: "/" }, links: [], copyright: "2026 DevsLab", messages }}
><h1>Document intelligence</h1></MarketingShell>;

it("server-renders shared chrome", () => {
  const html = renderToString(<Fixture />);
  expect(html).toContain("VisionLinq");
  expect(html).toContain("Document intelligence");
  expect(html).toContain('id="main-content"');
});

it("server-renders the flag variant as a working disclosure without JavaScript", () => {
  const html = renderToString(<LocaleMenu variant="flag" state={locale} messages={messages} />);
  expect(html).toContain("<details");
  expect(html).toContain('class="site-locale-flag__trigger"');
  expect((html.match(/class="site-locale-flag__option"/g) ?? []).length).toBe(14);
  expect(html).toContain('href="/ar"');
  expect(html).toContain('viewBox="0 0 640 480"');
  const koPath = LOCALE_FLAGS.ko.body.match(/d="[^"]{20,}"/)?.[0];
  if (!koPath) throw new Error("expected a d=\"…\" path fragment in LOCALE_FLAGS.ko.body");
  expect(html).toContain(koPath);
});

it("server-writes each flag body once, in a sprite the trigger and rows <use>", () => {
  const html = renderToString(<LocaleMenu variant="flag" state={{ ...locale, locale: "ko" }} messages={messages} />);
  expect((html.match(/<svg[^>]*class="site-flag-sprite"/g) ?? []).length).toBe(1);
  expect((html.match(/<symbol /g) ?? []).length).toBe(14);
  const koPath = LOCALE_FLAGS.ko.body.match(/d="[^"]{20,}"/)?.[0]!;
  expect(html.split(koPath).length - 1).toBe(1);
  const koSymbol = html.match(/<symbol id="(site-flag-kr-[^"]+)"/)?.[1];
  expect(koSymbol).toBeDefined();
  expect((html.match(new RegExp(`<use href="#${koSymbol}"`, "g")) ?? []).length).toBe(2);
  const symbolIds = new Set([...html.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]));
  const uses = [...html.matchAll(/<use href="#([^"]+)"/g)].map((m) => m[1]);
  expect(uses).toHaveLength(15);
  for (const id of uses) expect(symbolIds.has(id)).toBe(true);
  // The sprite carries the menu's uid, so the browser can find the markup it adopts.
  const uid = html.match(/class="site-flag-sprite"[^>]*data-flag-sprite="([^"]+)"/)?.[1];
  expect(koSymbol!.endsWith(`-${uid}`)).toBe(true);
});

it("marks the current option selected — a <select> has no value attribute", () => {
  const html = renderToString(<LocaleMenu state={locale} messages={messages} />);
  expect(html).toMatch(/<option[^>]*\svalue="en"[^>]*\sselected=""[^>]*>/);
  expect((html.match(/\sselected=""/g) ?? []).length).toBe(1);
  expect(html).not.toMatch(/<select[^>]*\svalue=/);
});

it("server-renders a subset registry from data hrefs — what a Next.js Server Component passes", () => {
  const registry = defineLocaleRegistry({ only: ["ko", "en", "ja", "zh-TW"] });
  // Everything a Server Component hands the client chrome must survive
  // serialisation — structuredClone throws on a function, as RSC does.
  const data = {
    navigation: [],
    messages,
    locale: { locale: "ko" as const, hrefs: localeHrefs(registry, (code) => `/${code}`) },
    localeRegistry: { LOCALES: registry.LOCALES },
    localeVariant: "flag" as const,
  };
  expect(() => structuredClone(data)).not.toThrow();
  expect(() => structuredClone({ localeRegistry: registry })).toThrow();
  const html = renderToString(<SiteHeader
    brand={{ name: "", href: "/ko", label: "Qooroo home", logo: <><img src="/logo.svg" alt="" /><span>쿠루</span></> }}
    {...data}
  />);
  expect((html.match(/class="site-locale-flag__option"/g) ?? []).length).toBe(4);
  expect((html.match(/<symbol /g) ?? []).length).toBe(4);
  expect(html).toContain('href="/zh-TW"');
  expect(html).toMatch(/<a class="site-brand" href="\/ko" aria-label="Qooroo home"><img[^>]*\/><span>쿠루<\/span><\/a>/);
});

it("server-renders a product's own languages alongside the family's", () => {
  const registry = defineLocaleRegistry({
    extra: [{ code: "ta", language: "Tamil", nativeName: "தமிழ்", dir: "ltr", flagCountry: "in" }],
  });
  const html = renderToString(<LocaleMenu variant="flag" state={locale} messages={messages} registry={registry} />);
  expect((html.match(/class="site-locale-flag__option"/g) ?? []).length).toBe(15);
  expect(html).toContain("தமிழ்");
  expect(html).toContain('href="/ta"');
});

it("server-renders the consent settings entry as a plain button, and loads nothing (D-034)", () => {
  const controller = createConsentManager({ policyVersion: "2026-10-05", gtm: "GTM-AB12CD3", measurementIds: ["G-ABC123"] });
  const html = renderToString(<SiteFooter brand={{ name: "AskLinq", href: "/" }} links={[]} copyright="© DevsLab" messages={messages} consentSettings={{ controller, label: CONSENT_MESSAGES_KO.settings }} />);
  expect(html).not.toContain("googletagmanager");
  expect(html).toMatch(/<button[^>]*class="site-consent-trigger"[^>]*>[^<]+<\/button>/);
});
