import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, expect, it, vi } from "vitest";

// Wrapped, not replaced: the real dynamic import still runs, the wrapper only
// counts how often the menu asks for the bodies.
vi.mock("../flag-bodies", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../flag-bodies")>();
  return { ...actual, loadFlagBodies: vi.fn(actual.loadFlagBodies) };
});

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

/**
 * A render with no server HTML — this jsdom host — is the one case where the
 * browser fetches the flag bodies: the sprite starts empty and fills once the
 * chunk arrives. A hydrated page never takes that path (the server wrote the
 * sprite), which is why the bodies stay out of the main bundle at all.
 */
const spriteFilled = (host: HTMLElement) => vi.waitFor(() => {
  const sprite = host.querySelector(".site-flag-sprite")!;
  expect(sprite.querySelectorAll("symbol").length).toBeGreaterThan(0);
  return sprite;
});

it("client-only render draws every flag as a <use> of one symbol per country, filled after the bodies load", async () => {
  const koLocale = { ...locale, locale: "ko" as const };
  const host = mount(() => <LocaleMenu variant="flag" state={koLocale} messages={messages} />);
  // Before the chunk arrives the flags are already in the tree, pointing at symbols to come.
  expect(host.querySelectorAll(".site-locale-flag__svg use").length).toBe(15);
  expect(host.querySelector(".site-flag-sprite")!.children.length).toBe(0);

  const sprite = await spriteFilled(host);
  const symbols = [...sprite.querySelectorAll("symbol")];
  expect(symbols).toHaveLength(14); // one per country, although Korea is drawn twice (trigger + its own row)
  const symbolIds = new Set(symbols.map((symbol) => symbol.id));
  for (const use of host.querySelectorAll(".site-locale-flag__svg use")) {
    const href = use.getAttribute("href")!;
    expect(href.startsWith("#")).toBe(true);
    expect(symbolIds.has(href.slice(1))).toBe(true);
  }
  const koUses = [...host.querySelectorAll(".site-locale-flag__svg use")].filter((use) => use.getAttribute("href")!.startsWith("#site-flag-kr-"));
  expect(koUses).toHaveLength(2);
});

it("scopes the ids inside the flag artwork so a page with two menus cannot collide", async () => {
  const host = mount(() => <LocaleMenu variant="flag" state={locale} messages={messages} />);
  const sprite = await spriteFilled(host);
  const allIds = [...sprite.querySelectorAll("[id]")].map((el) => el.id);
  expect(new Set(allIds).size).toBe(allIds.length);
  const ids = new Set(allIds);
  for (const el of sprite.querySelectorAll("*")) {
    const href = el.getAttribute("href")
      ?? el.getAttribute("xlink:href")
      ?? el.getAttributeNS("http://www.w3.org/1999/xlink", "href");
    if (href?.startsWith("#")) expect(ids.has(href.slice(1))).toBe(true);
    for (const attribute of ["clip-path", "fill", "stroke", "mask", "filter"]) {
      const url = el.getAttribute(attribute)?.match(/^url\(#([^)]+)\)$/)?.[1];
      if (url) expect(ids.has(url)).toBe(true);
    }
  }
  // The artwork's own ids (kr-a, es-b…) are suffixed with the menu's uid, so a
  // second menu on the page — the footer, a dialog — cannot shadow the first.
  expect(allIds.every((id) => /-cl-\d+$/.test(id) || /^site-flag-/.test(id))).toBe(true);
});

it("a locale change on the client only swaps the trigger's href — the bodies load once", async () => {
  const { loadFlagBodies } = await import("../flag-bodies");
  const loads = vi.mocked(loadFlagBodies);
  loads.mockClear();
  const [current, setCurrent] = createSignal<"en" | "ko">("en");
  const state = { hrefForLocale: locale.hrefForLocale, get locale() { return current(); } };
  const host = mount(() => <LocaleMenu variant="flag" state={state} messages={messages} />);
  await spriteFilled(host);
  const trigger = () => host.querySelector(".site-locale-flag__trigger > .site-locale-flag__svg > use")!.getAttribute("href")!;
  expect(trigger()).toMatch(/^#site-flag-us-/);
  setCurrent("ko");
  expect(trigger()).toMatch(/^#site-flag-kr-/);
  expect(host.querySelector('.site-locale-flag__option[lang="ko"]')?.getAttribute("aria-current")).toBe("true");
  expect(host.querySelectorAll(".site-flag-sprite symbol")).toHaveLength(14);
  expect(loads).toHaveBeenCalledTimes(1);
});

it("a product's own locale borrows a vendored country and shares its symbol", async () => {
  const { defineLocaleRegistry } = await import("../../core/locales.mjs");
  const registry = defineLocaleRegistry({
    extra: [{ code: "ta", language: "Tamil", nativeName: "தமிழ்", dir: "ltr", flagCountry: "in" }],
  });
  const host = mount(() => <LocaleMenu variant="flag" state={locale} messages={messages} registry={registry} />);
  const sprite = await spriteFilled(host);
  expect(sprite.querySelectorAll("symbol")).toHaveLength(14); // fifteen locales, fourteen countries
  const india = [...host.querySelectorAll(".site-locale-flag__option")]
    .filter((option) => ["hi", "ta"].includes(option.getAttribute("lang")!))
    .map((option) => option.querySelector("use")!.getAttribute("href"));
  expect(india).toHaveLength(2);
  expect(new Set(india).size).toBe(1);
});
