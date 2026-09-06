import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "solid-js/web";
import { afterEach, expect, it } from "vitest";

import * as kit from "../index";
import { FAMILY_LOCALES, defineLocaleRegistry } from "../../core/locales.mjs";

let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.replaceChildren();
});

function mount(node: () => any) {
  const host = document.body.appendChild(document.createElement("div"));
  dispose = render(node, host);
  return host;
}

const STYLES = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../../../styles.css"),
  "utf8",
);

const messages = {
  navigationLabel: "Navigation",
  localeLabel: "Language",
  themeLabel: "Theme",
  themeSystem: "System",
  themeLight: "Light",
  themeDark: "Dark",
  menuOpen: "Open menu",
  menuClose: "Close menu",
  footerLabel: "Footer",
  skipToContent: "Skip to content",
  updatedLabel: "Updated",
  notFoundTitle: "Not found",
  notFoundDescription: "No such page",
  backHome: "Home",
  errorTitle: "Error",
  errorDescription: "Something failed",
  retry: "Retry",
};

const base = {
  brand: { name: "AskLinq", href: "/" },
  links: [{ href: "/privacy", label: "Privacy" }],
  copyright: "© 2026 DevsLab",
  messages,
};

it("renders one row when no language row is asked for", () => {
  const { SiteFooter } = kit;
  const host = mount(() => <SiteFooter {...base} />);
  // A product whose header already offers every language does not want a
  // second copy of the list, so the row appears only when `locale` is passed.
  expect(host.querySelector(".site-footer__langs")).toBeNull();
  expect(host.querySelector(".site-footer__brand strong")?.textContent).toBe("AskLinq");
  expect([...host.querySelectorAll(".site-footer__links a")].map((a) => a.textContent)).toEqual(["Privacy"]);
});

it("renders the brand mark the caller passes", () => {
  const { SiteFooter } = kit;
  // The kit used to accept `brand.logo` and drop it, which is why AskLinq's
  // footer shipped without the family mark while every other product drew one.
  const host = mount(() => <SiteFooter {...base} brand={{ ...base.brand, logo: <svg data-testid="mark" /> }} />);
  expect(host.querySelector(".site-footer__brand [data-testid='mark']")).not.toBeNull();
});

it("lists every family language, marking the current one, and reports the pick", () => {
  const { SiteFooter } = kit;
  const picked: string[] = [];
  const host = mount(() => <SiteFooter
    {...base}
    locale={{ locale: "ko", hrefForLocale: (code: string) => `/${code}` }}
    onLocaleSelect={(code) => picked.push(code)}
  />);
  const links = [...host.querySelectorAll<HTMLAnchorElement>(".site-footer__langs a")];
  expect(links).toHaveLength(FAMILY_LOCALES.LOCALES.length);

  const korean = links.find((a) => a.getAttribute("hreflang") === "ko")!;
  expect(korean.getAttribute("aria-current")).toBe("page");
  expect(korean.getAttribute("href")).toBe("/ko");

  const arabic = links.find((a) => a.getAttribute("hreflang") === "ar");
  // Each link is written in its own language, so it carries its own direction.
  if (arabic) expect(arabic.getAttribute("dir")).toBe("rtl");
  expect(links.filter((a) => a.getAttribute("aria-current") === "page")).toHaveLength(1);

  korean.click();
  expect(picked).toEqual(["ko"]);
});

it("honours a locale subset registry", () => {
  const { SiteFooter } = kit;
  const registry = defineLocaleRegistry({ only: ["ko", "en", "ja"] });
  const host = mount(() => <SiteFooter
    {...base}
    locale={{ locale: "en", hrefForLocale: (code: string) => `/${code}` }}
    localeRegistry={registry}
  />);
  expect([...host.querySelectorAll(".site-footer__langs a")].map((a) => a.getAttribute("hreflang"))).toEqual(["ko", "en", "ja"]);
});

it("puts the family links after the brand, separated for sighted readers only", () => {
  const { SiteFooter } = kit;
  const host = mount(() => <SiteFooter
    {...base}
    family={[{ href: "https://devslab.kr/#products", label: "Linq family" }, { href: "https://devslab.kr/", label: "DevsLab" }]}
  />);
  const brand = host.querySelector(".site-footer__brand")!;
  expect([...brand.querySelectorAll("a")].map((a) => a.textContent)).toEqual(["Linq family", "DevsLab"]);
  // The middots are decoration between names; a screen reader should read the
  // names, not "dot".
  expect([...brand.querySelectorAll("span")].every((s) => s.getAttribute("aria-hidden") === "true")).toBe(true);
});

it("isolates the copyright so an RTL page does not reorder it, with or without a link", () => {
  const { SiteFooter } = kit;
  const plain = mount(() => <SiteFooter {...base} />);
  expect(plain.querySelector(".site-footer__links bdi")?.textContent).toBe("© 2026 DevsLab");
  expect(plain.querySelector(".site-footer__links li:last-child a")).toBeNull();

  dispose?.();
  dispose = undefined;
  document.body.replaceChildren();

  const linked = mount(() => <SiteFooter {...base} copyrightHref="https://devslab.kr/" />);
  const anchor = linked.querySelector<HTMLAnchorElement>(".site-footer__links li:last-child a")!;
  expect(anchor.getAttribute("href")).toBe("https://devslab.kr/");
  expect(anchor.querySelector("bdi")?.textContent).toBe("© 2026 DevsLab");
});

it("ships the rules the three rows need, so no consumer has to keep its own copy", () => {
  for (const rule of [
    ".site-footer__langs",
    ".site-footer__langs a[aria-current=\"page\"]",
    ".site-footer__row",
    ".site-footer__brand",
  ]) {
    expect(STYLES).toContain(rule);
  }
});
