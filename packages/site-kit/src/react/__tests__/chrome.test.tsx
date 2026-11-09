import { act, cleanup, fireEvent, render } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, expect, it, vi } from "vitest";

import { ErrorLayout, MarketingShell, NotFoundLayout, SiteFooter, SiteHeader, StatusBanner, ThemeToggle } from "../index";
import { FAMILY_LOCALES, defineLocaleRegistry } from "../../core/locales.mjs";
import { locale, messages } from "./fixtures";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

const mount = (node: ReactElement) => render(node).container;
const press = (target: Element, key: string) => fireEvent.keyDown(target, { key });
const click = (target: Element) => act(() => { (target as HTMLElement).click(); });

// ── Theme ────────────────────────────────────────────────────────────────

it("renders an icon-only two-state theme action with an accessible name", () => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
  const host = mount(<ThemeToggle messages={messages} storageKey="test-theme" />);
  const toggle = host.querySelector<HTMLButtonElement>(".site-theme-toggle")!;
  expect(toggle.className).toBe("dds-iconbtn site-theme-toggle");
  expect(toggle.textContent).toBe("");
  expect(toggle.getAttribute("aria-label")).toBe("Theme: Dark");
  expect(toggle.querySelector("svg")?.getAttribute("data-icon")).toBe("site-moon");

  click(toggle);
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(document.documentElement.dataset.themePreference).toBe("dark");
  expect(localStorage.getItem("test-theme")).toBe("dark");
  expect(toggle.getAttribute("aria-label")).toBe("Theme: Light");
  expect(toggle.querySelector("svg")?.getAttribute("data-icon")).toBe("site-sun");

  click(toggle);
  expect(document.documentElement.dataset.theme).toBe("light");
});

it("applies a stored preference after mount", () => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
  localStorage.setItem("stored-theme", "dark");
  const host = mount(<ThemeToggle messages={messages} storageKey="stored-theme" />);
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(host.querySelector(".site-theme-toggle")?.getAttribute("aria-label")).toBe("Theme: Light");
});

// ── Shell ────────────────────────────────────────────────────────────────

it("renders shared chrome and opens the mobile navigation", () => {
  const host = mount(<MarketingShell
    messages={messages}
    header={{ brand: { name: "VisionLinq", href: "/" }, navigation: [{ href: "/docs", label: "Docs" }], locale, messages }}
    footer={{ brand: { name: "VisionLinq", href: "/" }, links: [{ href: "/privacy", label: "Privacy" }], copyright: "2026 DevsLab", messages }}
  ><h1>Document intelligence</h1></MarketingShell>);
  const toggle = host.querySelector<HTMLButtonElement>(".site-menu-button")!;
  const navigation = host.querySelector<HTMLElement>("#site-navigation")!;
  const controls = host.querySelector<HTMLElement>(".site-header__controls")!;
  expect(toggle.className).toBe("dds-btn dds-btn--ghost site-menu-button");
  expect(navigation.contains(controls)).toBe(false);
  expect(controls.parentElement).toBe(navigation.parentElement);
  expect(controls.dataset.open).toBe("false");
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  click(toggle);
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  expect(controls.dataset.open).toBe("true");
  expect(host.querySelector("#main-content h1")?.textContent).toBe("Document intelligence");
});

it("defaults main to the shell width and opts into a full-bleed main for section pages", () => {
  const props = {
    messages,
    header: { brand: { name: "VisionLinq", href: "/" }, navigation: [], locale, messages },
    footer: { brand: { name: "VisionLinq", href: "/" }, links: [], copyright: "2026 DevsLab", messages },
  };
  expect(mount(<MarketingShell {...props}><p>Default</p></MarketingShell>).querySelector("#main-content")?.className).toBe("site-main");
  cleanup();
  expect(mount(<MarketingShell {...props} mainWidth="bleed"><p>Bleed</p></MarketingShell>).querySelector("#main-content")?.classList.contains("site-main--bleed")).toBe(true);
});

it("uses a crawlable home link on the not-found page and a retry button on the error page", () => {
  expect(mount(<NotFoundLayout messages={messages} homeHref="/" />).querySelector<HTMLAnchorElement>('a[href="/"]')?.textContent).toBe("Back home");
  cleanup();
  const onRetry = vi.fn();
  const host = mount(<ErrorLayout messages={messages} onRetry={onRetry} errorId="req_1" />);
  expect(host.querySelector("code")?.textContent).toBe("req_1");
  click(host.querySelector("button.dds-btn--primary")!);
  expect(onRetry).toHaveBeenCalledOnce();
});

it("status banner speaks assertively only for danger", () => {
  const host = mount(<>
    <StatusBanner tone="danger" title="Down" />
    <StatusBanner tone="info" title="Note">More</StatusBanner>
  </>);
  const [danger, info] = [...host.querySelectorAll("section")];
  expect(danger!.getAttribute("role")).toBe("alert");
  expect(danger!.querySelector("div")).toBeNull();
  expect(info!.getAttribute("aria-live")).toBe("polite");
  expect(info!.querySelector("div")?.textContent).toBe("More");
});

// ── Header behaviour (D-029) ─────────────────────────────────────────────

const navigation = [{ href: "#how", label: "How it works" }, { href: "#contact", label: "Contact" }];
const header = (extra: Record<string, unknown> = {}) => mount(<SiteHeader
  brand={{ name: "Acme", href: "/" }}
  navigation={navigation}
  messages={messages}
  actions={<a className="cta" href="#contact">Get in touch</a>}
  {...extra}
/>);

it("renders no language picker when no locale is passed, and keeps the actions", () => {
  const host = header();
  expect(host.querySelector(".site-locale, .site-locale-flag, select")).toBeNull();
  expect(host.querySelector(".site-header__controls .cta")?.textContent).toBe("Get in touch");
});

it("names the brand link and prints a wordmark logo once when the name is empty", () => {
  const host = header({ brand: { name: "", href: "/", label: "Acme home", logo: <span className="mark"><b>Ac</b>me</span> } });
  const brand = host.querySelector(".site-brand")!;
  expect(brand.getAttribute("aria-label")).toBe("Acme home");
  expect(brand.textContent).toBe("Acme");
});

it("puts a localized wordmark beside the mark in the brand slot", () => {
  // Qooroo's header: the mark, then 쿠루 / クル / nothing extra in English.
  const host = header({ brand: { name: "", href: "/ko", label: "쿠루 홈", logo: <><svg className="mark" aria-hidden="true" /><span className="wordmark">쿠루</span></> } });
  const brand = host.querySelector(".site-brand")!;
  expect([...brand.children].map((child) => child.getAttribute("class"))).toEqual(["mark", "wordmark"]);
  expect(brand.textContent).toBe("쿠루");
});

it("leaves the brand link unlabelled when no label is given", () => {
  expect(header().querySelector(".site-brand")?.hasAttribute("aria-label")).toBe(false);
});

it("closes the open menu on Escape and returns focus to the menu button", () => {
  const host = header();
  const button = host.querySelector<HTMLButtonElement>(".site-menu-button")!;
  click(button);
  const link = host.querySelector<HTMLAnchorElement>(".site-nav__list a")!;
  link.focus();
  press(link, "Escape");
  expect(button.getAttribute("aria-expanded")).toBe("false");
  expect(host.querySelector<HTMLElement>(".site-nav")!.dataset.open).toBe("false");
  expect(document.activeElement).toBe(button);
});

it("leaves the menu open when a control inside already handled that Escape", () => {
  const host = header();
  const button = host.querySelector<HTMLButtonElement>(".site-menu-button")!;
  click(button);
  const link = host.querySelector<HTMLAnchorElement>(".site-nav__list a")!;
  link.addEventListener("keydown", (event) => event.preventDefault());
  press(link, "Escape");
  expect(button.getAttribute("aria-expanded")).toBe("true");
});

it("one Escape closes the flag menu, the next closes the header menu", () => {
  const host = header({ locale, localeVariant: "flag" });
  const button = host.querySelector<HTMLButtonElement>(".site-menu-button")!;
  click(button);
  const details = host.querySelector<HTMLDetailsElement>(".site-locale-flag")!;
  details.open = true;
  const option = details.querySelector<HTMLAnchorElement>(".site-locale-flag__option")!;
  press(option, "Escape");
  expect(details.open).toBe(false);
  expect(button.getAttribute("aria-expanded")).toBe("true");
  press(details.querySelector("summary")!, "Escape");
  expect(button.getAttribute("aria-expanded")).toBe("false");
});

it("ignores other keys", () => {
  const host = header();
  const button = host.querySelector<HTMLButtonElement>(".site-menu-button")!;
  click(button);
  press(button, "Enter");
  expect(button.getAttribute("aria-expanded")).toBe("true");
});

it("closes the menu when a navigation link or an action link is followed", () => {
  const host = header();
  const button = host.querySelector<HTMLButtonElement>(".site-menu-button")!;
  click(button);
  click(host.querySelector(".site-nav__list a")!);
  expect(button.getAttribute("aria-expanded")).toBe("false");
  click(button);
  click(host.querySelector(".site-header__controls .cta")!);
  expect(button.getAttribute("aria-expanded")).toBe("false");
  expect(host.querySelector<HTMLElement>(".site-header__controls")!.dataset.open).toBe("false");
});

it("keeps the menu open when a link opens a new tab or is clicked with a modifier", () => {
  const host = header({ navigation: [...navigation, { href: "https://example.com", label: "Elsewhere", external: true }] });
  const button = host.querySelector<HTMLButtonElement>(".site-menu-button")!;
  click(button);
  const external = host.querySelector<HTMLAnchorElement>('.site-nav__list a[target="_blank"]')!;
  expect(external.rel).toBe("noreferrer");
  external.addEventListener("click", (event) => event.preventDefault());
  click(external);
  expect(button.getAttribute("aria-expanded")).toBe("true");
  act(() => { host.querySelector('.site-nav__list a[href="#how"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true })); });
  expect(button.getAttribute("aria-expanded")).toBe("true");
});

it("leaves an Escape from inside a modal in the header to the modal", () => {
  const host = header({ actions: <div role="dialog" aria-modal="true"><button type="button" className="in-dialog">OK</button></div> });
  const button = host.querySelector<HTMLButtonElement>(".site-menu-button")!;
  click(button);
  press(host.querySelector(".in-dialog")!, "Escape");
  expect(button.getAttribute("aria-expanded")).toBe("true");
});

it("keeps the menu open when a button inside it is pressed", () => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
  const host = header({ theme: { storageKey: "landing-chrome-theme" } });
  const button = host.querySelector<HTMLButtonElement>(".site-menu-button")!;
  click(button);
  click(host.querySelector(".site-theme-toggle")!);
  expect(button.getAttribute("aria-expanded")).toBe("true");
});

it("marks an emphasised link in the header and the footer", () => {
  const host = mount(<>
    <SiteHeader brand={{ name: "Acme", href: "/" }} navigation={[{ href: "/pricing", label: "Pricing", emphasis: true }]} messages={messages} />
    <SiteFooter brand={{ name: "Acme", href: "/" }} links={[{ href: "/terms", label: "Terms" }, { href: "/privacy", label: "Privacy", emphasis: true }]} copyright="© Acme" messages={messages} />
  </>);
  expect([...host.querySelectorAll("a.site-link--emphasis")].map((a) => a.textContent)).toEqual(["Pricing", "Privacy"]);
  expect(host.querySelector('.site-footer__links a[href="/terms"]')?.hasAttribute("class")).toBe(false);
});

// ── Footer ───────────────────────────────────────────────────────────────

const base = { brand: { name: "AskLinq", href: "/" }, links: [{ href: "/privacy", label: "Privacy" }], copyright: "© 2026 DevsLab", messages };

it("renders one row when no language row is asked for, with the brand mark", () => {
  const host = mount(<SiteFooter {...base} brand={{ ...base.brand, logo: <svg data-testid="mark" /> }} />);
  expect(host.querySelector(".site-footer__langs")).toBeNull();
  expect(host.querySelector(".site-footer__brand strong")?.textContent).toBe("AskLinq");
  expect(host.querySelector(".site-footer__brand [data-testid='mark']")).not.toBeNull();
  expect(host.querySelector(".site-footer__row > ul.site-footer__links")).not.toBeNull();
  expect(host.querySelector("footer nav")).toBeNull();
});

it("lists every family language, marking the current one, and reports the pick", () => {
  const picked: string[] = [];
  const host = mount(<SiteFooter {...base} locale={{ locale: "ko", hrefForLocale: (code) => `/${code}` }} onLocaleSelect={(code) => picked.push(code)} />);
  const links = [...host.querySelectorAll<HTMLAnchorElement>(".site-footer__langs-list a")];
  expect(links).toHaveLength(FAMILY_LOCALES.LOCALES.length);
  const korean = links.find((a) => a.getAttribute("hreflang") === "ko")!;
  expect(korean.getAttribute("aria-current")).toBe("page");
  expect(korean.getAttribute("href")).toBe("/ko");
  expect(links.find((a) => a.getAttribute("hreflang") === "ar")?.getAttribute("dir")).toBe("rtl");
  expect(links.filter((a) => a.getAttribute("aria-current") === "page")).toHaveLength(1);
  korean.addEventListener("click", (event) => event.preventDefault());
  click(korean);
  expect(picked).toEqual(["ko"]);
});

it("honours a locale subset registry", () => {
  const registry = defineLocaleRegistry({ only: ["ko", "en", "ja"] });
  const host = mount(<SiteFooter {...base} locale={{ locale: "en", hrefForLocale: (code) => `/${code}` }} localeRegistry={registry} />);
  expect([...host.querySelectorAll(".site-footer__langs-list a")].map((a) => a.getAttribute("hreflang"))).toEqual(["ko", "en", "ja"]);
});

it("collapses the language row behind the current language's own name and closes on Escape", () => {
  const host = mount(<SiteFooter {...base} locale={{ locale: "ko", hrefForLocale: (code) => `/${code}` }} />);
  const details = host.querySelector<HTMLDetailsElement>(".site-footer__langs-menu")!;
  expect(details.open).toBe(false);
  const trigger = details.querySelector<HTMLElement>("summary")!;
  expect(trigger.textContent).toBe("한국어");
  expect(trigger.getAttribute("aria-label")).toBe("Language: 한국어");
  const nav = host.querySelector(".site-footer__langs")!;
  expect(nav.tagName).toBe("NAV");
  expect(nav.getAttribute("aria-label")).toBe("Language");
  details.open = true;
  press(details, "Escape");
  expect(details.open).toBe(false);
  expect(document.activeElement).toBe(trigger);
});

it("puts the family links after the brand, separated for sighted readers only", () => {
  const host = mount(<SiteFooter {...base} family={[{ href: "https://devslab.kr/#products", label: "Linq family" }, { href: "https://devslab.kr/", label: "DevsLab" }]} />);
  const brand = host.querySelector(".site-footer__brand")!;
  expect([...brand.querySelectorAll("a")].map((a) => a.textContent)).toEqual(["Linq family", "DevsLab"]);
  expect([...brand.querySelectorAll("span")].every((s) => s.getAttribute("aria-hidden") === "true")).toBe(true);
});

it("isolates the copyright so an RTL page does not reorder it, with or without a link", () => {
  const plain = mount(<SiteFooter {...base} />);
  expect(plain.querySelector(".site-footer__links bdi")?.textContent).toBe("© 2026 DevsLab");
  expect(plain.querySelector(".site-footer__links li:last-child a")).toBeNull();
  cleanup();
  const linked = mount(<SiteFooter {...base} copyrightHref="https://devslab.kr/" />);
  const anchor = linked.querySelector<HTMLAnchorElement>(".site-footer__links li:last-child a")!;
  expect(anchor.getAttribute("href")).toBe("https://devslab.kr/");
  expect(anchor.querySelector("bdi")?.textContent).toBe("© 2026 DevsLab");
});

it("puts details in a block under the brand line and names the links when asked", () => {
  const host = mount(<SiteFooter {...base} linksLabel="Legal" details={<><p className="biz">Acme Ltd · Reg. 000-00-00000</p><address>1 Main St</address></>} />);
  const identity = host.querySelector(".site-footer__row > .site-footer__identity")!;
  expect(identity.querySelector(":scope > .site-footer__brand strong")?.textContent).toBe("AskLinq");
  expect(identity.querySelector(".site-footer__details .biz")?.textContent).toBe("Acme Ltd · Reg. 000-00-00000");
  expect(host.querySelectorAll(".site-footer__details address")).toHaveLength(1);
  const nav = host.querySelector(".site-footer__row > nav.site-footer__nav")!;
  expect(nav.getAttribute("aria-label")).toBe("Legal");
  expect(nav.querySelector(":scope > ul.site-footer__links a")?.textContent).toBe("Privacy");
});

it("renders no empty <strong> for a wordmark footer brand", () => {
  const host = mount(<SiteFooter {...base} brand={{ name: "", href: "/", logo: <span className="mark">Acme</span> }} />);
  expect(host.querySelector(".site-footer__brand strong")).toBeNull();
  expect(host.querySelector(".site-footer__brand .mark")?.textContent).toBe("Acme");
});

it("the consent settings entry asks the controller to open the settings", () => {
  const openSettings = vi.fn();
  const controller = { openSettings } as unknown as import("@devslab/site-kit").ConsentManager;
  const host = mount(<SiteFooter {...base} consentSettings={{ controller, label: "쿠키 설정" }} />);
  const button = host.querySelector<HTMLButtonElement>(".site-footer__links .site-consent-trigger")!;
  expect(button.getAttribute("aria-haspopup")).toBe("dialog");
  click(button);
  expect(openSettings).toHaveBeenCalledOnce();
});

it("ships the opt-in lockup that centres a mark beside a wordmark, in the styles both frameworks share", async () => {
  const { readFileSync } = await import("node:fs");
  const { resolve } = await import("node:path");
  const styles = readFileSync(resolve(process.cwd(), "styles.css"), "utf8");
  expect(styles).toMatch(/\.site-brand__lockup \{ display: inline-flex; align-items: center;[^}]*\}/);
  // The brand link itself stays inline, so the logos products already ship keep their geometry.
  expect(styles).toMatch(/\.site-brand \{ justify-self: start; color: var\(--dds-color-text-primary\); font-weight: 700; text-decoration: none; \}/);
});
