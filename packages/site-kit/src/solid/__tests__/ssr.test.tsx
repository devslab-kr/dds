import { renderToString } from "solid-js/web";
import { expect, it } from "vitest";

import { LocaleMenu, MarketingShell } from "../index";
import { LOCALE_FLAGS } from "../../core/flags.mjs";
import { defineLocaleRegistry } from "../../core/locales.mjs";
import { locale, messages } from "./fixtures";

const Fixture = () => <MarketingShell
    messages={messages}
    header={{ brand: { name: "VisionLinq", href: "/" }, navigation: [], locale, messages }}
    footer={{ brand: { name: "VisionLinq", href: "/" }, links: [], copyright: "2026 DevsLab", messages }}
  ><h1>Document intelligence</h1></MarketingShell>;

it("server-renders shared chrome", () => {
  const html = renderToString(() => <Fixture />);
  expect(html).toContain("VisionLinq");
  expect(html).toContain("Document intelligence");
  expect(html).toContain('id="main-content"');
});

it("server-renders the flag variant as a working disclosure without JavaScript", () => {
  const html = renderToString(() => <LocaleMenu variant="flag" state={locale} messages={messages} />);
  expect(html).toContain("<details");
  expect(html).toContain('class="site-locale-flag__trigger"');
  expect((html.match(/class="site-locale-flag__option"/g) ?? []).length).toBe(14);
  expect(html).toContain('href="/ar"');
  expect(html).toContain('viewBox="0 0 640 480"');
  const koPath = LOCALE_FLAGS.ko.body.match(/d="[^"]{20,}"/)?.[0];
  if (!koPath) throw new Error("expected a d=\"…\" path fragment in LOCALE_FLAGS.ko.body");
  expect(html).toContain(koPath);
});

it("marks the current option selected — a <select> has no value attribute", () => {
  // The bug this pins: `value={props.state.locale}` on the <select>.
  // In a browser Solid assigns the DOM property and it works; under SSR the
  // markup is a string, `value` is not a content attribute on <select>, the
  // browser ignores it and picks option[0]. Every visitor, in every
  // language, saw the first locale as their current one — and touching the
  // control switched them to it. Found on a deployed worker, not here.
  const html = renderToString(() => <LocaleMenu state={locale} messages={messages} />);
  // Solid stamps a data-hk between the tag name and our attributes, so the
  // assertion matches on the option carrying value="en", not on byte order.
  expect(html).toMatch(/<option[^>]*\svalue="en"[^>]*\sselected[^>]*>/);
  expect((html.match(/\sselected/g) ?? []).length).toBe(1);
  expect(html).not.toMatch(/<select[^>]*\svalue=/);
});

it("server-renders a product's own languages alongside the family's", () => {
  const registry = defineLocaleRegistry({
    extra: [{ code: "ta", language: "Tamil", nativeName: "தமிழ்", dir: "ltr", flagCountry: "in" }],
  });
  const html = renderToString(() => (
    <LocaleMenu variant="flag" state={locale} messages={messages} registry={registry} />
  ));
  expect((html.match(/class="site-locale-flag__option"/g) ?? []).length).toBe(15);
  expect(html).toContain("தமிழ்");
  expect(html).toContain('href="/ta"');
  // Tamil borrows India's vendored flag rather than shipping a second copy.
  const indiaPath = LOCALE_FLAGS.hi.body.match(/d="[^"]{20,}"/)?.[0];
  if (!indiaPath) throw new Error('expected a d="…" path fragment in LOCALE_FLAGS.hi.body');
  expect(html).toContain(indiaPath);
});
