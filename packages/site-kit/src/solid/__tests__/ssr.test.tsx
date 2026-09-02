import { renderToString } from "solid-js/web";
import { expect, it } from "vitest";

import { LocaleMenu, MarketingShell } from "../index";
import { LOCALE_FLAGS } from "../../core/flags.mjs";
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
