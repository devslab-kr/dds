import { render } from "solid-js/web";
import { afterEach, expect, it, vi } from "vitest";

import { LocaleMenu, SiteHeader } from "../index";
import { locale, messages } from "./fixtures";

let dispose: (() => void) | undefined;
afterEach(() => { dispose?.(); dispose = undefined; document.body.replaceChildren(); });

const mount = (node: () => any) => {
  const host = document.body.appendChild(document.createElement("div"));
  dispose = render(node, host);
  return host;
};

it("keeps the select variant as the default", () => {
  const host = mount(() => <LocaleMenu state={locale} messages={messages} />);
  expect(host.querySelector("select.dds-select__input")).not.toBeNull();
  expect(host.querySelector(".site-locale-flag")).toBeNull();
});

it("flag variant renders a flag-only trigger named after the current language", () => {
  const host = mount(() => <LocaleMenu variant="flag" state={locale} messages={messages} />);
  const trigger = host.querySelector<HTMLElement>(".site-locale-flag__trigger")!;
  expect(trigger.tagName).toBe("SUMMARY");
  expect(trigger.textContent?.trim()).toBe("");
  expect(trigger.getAttribute("aria-label")).toBe("Language: English");
  expect(trigger.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
});

it("flag variant lists fourteen flag + native-name links with the current one marked", () => {
  const host = mount(() => <LocaleMenu variant="flag" state={locale} messages={messages} />);
  const options = [...host.querySelectorAll<HTMLAnchorElement>(".site-locale-flag__option")];
  expect(options).toHaveLength(14);
  for (const option of options) {
    expect(option.querySelector("svg")).not.toBeNull();
    expect(option.querySelector("span")?.textContent?.length).toBeGreaterThan(0);
    expect(option.getAttribute("hreflang")).toBe(option.getAttribute("lang"));
  }
  const arabic = options.find((o) => o.lang === "ar")!;
  expect(arabic.getAttribute("dir")).toBe("rtl");
  expect(arabic.getAttribute("href")).toBe("/ar");
  expect(options.find((o) => o.lang === "en")?.getAttribute("aria-current")).toBe("true");
  expect(arabic.getAttribute("aria-current")).toBeNull();
});

it("flag variant calls onLocaleChange with the locale and href, then closes", () => {
  const onLocaleChange = vi.fn();
  const host = mount(() => <LocaleMenu variant="flag" state={locale} messages={messages} onLocaleChange={onLocaleChange} />);
  const details = host.querySelector<HTMLDetailsElement>("details")!;
  details.open = true;
  const japanese = host.querySelector<HTMLAnchorElement>('.site-locale-flag__option[lang="ja"]')!;
  const event = new MouseEvent("click", { bubbles: true, cancelable: true });
  japanese.dispatchEvent(event);
  expect(onLocaleChange).toHaveBeenCalledWith("ja", "/ja");
  expect(event.defaultPrevented).toBe(true);
  expect(details.open).toBe(false);
});

it("flag variant leaves navigation to the link when no handler is given", () => {
  const host = mount(() => <LocaleMenu variant="flag" state={locale} messages={messages} />);
  const japanese = host.querySelector<HTMLAnchorElement>('.site-locale-flag__option[lang="ja"]')!;
  const event = new MouseEvent("click", { bubbles: true, cancelable: true });
  japanese.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(false);
});

it("Escape closes an open flag menu and returns focus to the trigger", () => {
  const host = mount(() => <LocaleMenu variant="flag" state={locale} messages={messages} />);
  const details = host.querySelector<HTMLDetailsElement>("details")!;
  const trigger = host.querySelector<HTMLElement>("summary")!;
  details.open = true;
  host.querySelector<HTMLAnchorElement>('.site-locale-flag__option[lang="fr"]')!.focus();
  details.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  expect(details.open).toBe(false);
  expect(document.activeElement).toBe(trigger);
});

it("SiteHeader passes localeVariant through", () => {
  const host = mount(() => <SiteHeader
    brand={{ name: "Fixture", href: "/" }} navigation={[]} locale={locale} messages={messages} localeVariant="flag"
  />);
  expect(host.querySelector(".site-header__controls .site-locale-flag")).not.toBeNull();
  expect(host.querySelector(".site-header__controls select")).toBeNull();
});

it("scopes flag svg ids uniquely when the current locale's flag renders twice (trigger + its own row)", () => {
  const koLocale = { ...locale, locale: "ko" as const };
  const host = mount(() => <LocaleMenu variant="flag" state={koLocale} messages={messages} />);
  const svgs = [...host.querySelectorAll("svg")];
  const allIds = svgs.flatMap((svg) => [...svg.querySelectorAll("[id]")].map((el) => el.id));
  expect(new Set(allIds).size).toBe(allIds.length);
  for (const svg of svgs) {
    const svgIds = new Set([...svg.querySelectorAll("[id]")].map((el) => el.id));
    for (const el of svg.querySelectorAll("*")) {
      const href = el.getAttribute("href")
        ?? el.getAttribute("xlink:href")
        ?? el.getAttributeNS("http://www.w3.org/1999/xlink", "href");
      if (!href?.startsWith("#")) continue;
      expect(svgIds.has(href.slice(1))).toBe(true);
    }
  }
});
