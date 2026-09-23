import { render } from "solid-js/web";
import { afterEach, expect, it, vi } from "vitest";

import { SiteFooter, SiteHeader } from "../index";
import { locale, messages } from "./fixtures";

// D-029: what a single-language landing (FM덴탈서비스) needs from the chrome —
// no picker, a named wordmark link, a menu that closes like a menu, and a
// footer that carries business details.

let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

function mount(node: () => any) {
  const host = document.body.appendChild(document.createElement("div"));
  dispose = render(node, host);
  return host;
}

const navigation = [{ href: "#how", label: "How it works" }, { href: "#contact", label: "Contact" }];

function header(extra: Record<string, unknown> = {}) {
  return mount(() => <SiteHeader
    brand={{ name: "Acme", href: "/" }}
    navigation={navigation}
    messages={messages}
    actions={<a class="cta" href="#contact">Get in touch</a>}
    {...extra}
  />);
}

const press = (target: Element, key: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));

it("renders no language picker when no locale is passed, and keeps the actions", () => {
  const host = header();
  expect(host.querySelector(".site-locale, .site-locale-flag, select")).toBeNull();
  expect(host.querySelector(".site-header__controls .cta")?.textContent).toBe("Get in touch");
});

it("still renders the picker when a locale is passed", () => {
  const host = header({ locale });
  expect(host.querySelector(".site-header__controls select, .site-header__controls .site-locale-flag")).not.toBeNull();
});

it("names the brand link and prints a wordmark logo once when the name is empty", () => {
  const host = header({ brand: { name: "", href: "/", label: "Acme home", logo: <span class="mark"><b>Ac</b>me</span> } });
  const brand = host.querySelector(".site-brand")!;
  expect(brand.getAttribute("aria-label")).toBe("Acme home");
  expect(brand.textContent).toBe("Acme");
});

it("leaves the brand link unlabelled when no label is given", () => {
  const host = header();
  expect(host.querySelector(".site-brand")?.hasAttribute("aria-label")).toBe(false);
});

it("closes the open menu on Escape and returns focus to the menu button", () => {
  const host = header();
  const button = host.querySelector<HTMLButtonElement>(".site-menu-button")!;
  button.click();
  expect(button.getAttribute("aria-expanded")).toBe("true");
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
  button.click();
  const link = host.querySelector<HTMLAnchorElement>(".site-nav__list a")!;
  // A nested disclosure (the flag menu) closes itself first and marks the event handled.
  link.addEventListener("keydown", (event) => event.preventDefault());
  press(link, "Escape");
  expect(button.getAttribute("aria-expanded")).toBe("true");
});

it("ignores other keys", () => {
  const host = header();
  const button = host.querySelector<HTMLButtonElement>(".site-menu-button")!;
  button.click();
  press(button, "Enter");
  expect(button.getAttribute("aria-expanded")).toBe("true");
});

it("closes the menu when a navigation link or an action link is followed", () => {
  const host = header();
  const button = host.querySelector<HTMLButtonElement>(".site-menu-button")!;
  button.click();
  host.querySelector<HTMLAnchorElement>(".site-nav__list a")!.click();
  expect(button.getAttribute("aria-expanded")).toBe("false");

  button.click();
  host.querySelector<HTMLAnchorElement>(".site-header__controls .cta")!.click();
  expect(button.getAttribute("aria-expanded")).toBe("false");
  expect(host.querySelector<HTMLElement>(".site-header__controls")!.dataset.open).toBe("false");
});

it("keeps the menu open when a link opens a new tab or window", () => {
  const host = header({ navigation: [...navigation, { href: "https://example.com", label: "Elsewhere", external: true }] });
  const button = host.querySelector<HTMLButtonElement>(".site-menu-button")!;
  button.click();
  const external = host.querySelector<HTMLAnchorElement>('.site-nav__list a[target="_blank"]')!;
  // A new tab leaves this document where it was — the same rule as a button.
  external.addEventListener("click", (event) => event.preventDefault());
  external.click();
  expect(button.getAttribute("aria-expanded")).toBe("true");
  const sameTab = host.querySelector<HTMLAnchorElement>('.site-nav__list a[href="#how"]')!;
  sameTab.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true }));
  expect(button.getAttribute("aria-expanded")).toBe("true");
});

it("leaves an Escape from inside a modal in the header to the modal", () => {
  const host = header({ actions: <div role="dialog" aria-modal="true"><button type="button" class="in-dialog">OK</button></div> });
  const button = host.querySelector<HTMLButtonElement>(".site-menu-button")!;
  button.click();
  press(host.querySelector(".in-dialog")!, "Escape");
  expect(button.getAttribute("aria-expanded")).toBe("true");
});

it("keeps the menu open when a button inside it is pressed", () => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
  const host = header({ theme: { storageKey: "landing-chrome-theme" } });
  const button = host.querySelector<HTMLButtonElement>(".site-menu-button")!;
  button.click();
  host.querySelector<HTMLButtonElement>(".site-theme-toggle")!.click();
  expect(button.getAttribute("aria-expanded")).toBe("true");
});

it("marks an emphasised link in the header and the footer", () => {
  const host = mount(() => <>
    <SiteHeader brand={{ name: "Acme", href: "/" }} navigation={[{ href: "/pricing", label: "Pricing", emphasis: true }]} messages={messages} />
    <SiteFooter brand={{ name: "Acme", href: "/" }} links={[{ href: "/terms", label: "Terms" }, { href: "/privacy", label: "Privacy", emphasis: true }]} copyright="© Acme" messages={messages} />
  </>);
  expect([...host.querySelectorAll("a.site-link--emphasis")].map((a) => a.textContent)).toEqual(["Pricing", "Privacy"]);
  expect(host.querySelector('.site-footer__links a[href="/terms"]')?.hasAttribute("class")).toBe(false);
});

const footerBase = { brand: { name: "Acme", href: "/" }, links: [{ href: "/privacy", label: "Privacy" }], copyright: "© Acme", messages };

it("puts details in a block under the brand line", () => {
  const host = mount(() => <SiteFooter {...footerBase} details={<><p class="biz">Acme Ltd · Reg. 000-00-00000</p><address>1 Main St</address></>} />);
  const identity = host.querySelector(".site-footer__row > .site-footer__identity")!;
  expect(identity.querySelector(":scope > .site-footer__brand strong")?.textContent).toBe("Acme");
  expect(identity.querySelector(".site-footer__details .biz")?.textContent).toBe("Acme Ltd · Reg. 000-00-00000");
  expect(identity.querySelector(".site-footer__details address")?.textContent).toBe("1 Main St");
  expect(host.querySelectorAll(".site-footer__details address")).toHaveLength(1);
});

it("keeps the original footer row when there are no details and no links label", () => {
  const host = mount(() => <SiteFooter {...footerBase} />);
  expect(host.querySelector(".site-footer__identity")).toBeNull();
  expect(host.querySelector(".site-footer__row > .site-footer__brand")).not.toBeNull();
  expect(host.querySelector(".site-footer__row > ul.site-footer__links")).not.toBeNull();
  expect(host.querySelector("footer nav")).toBeNull();
});

it("names the footer links as their own landmark when a label is given", () => {
  const host = mount(() => <SiteFooter {...footerBase} linksLabel="Legal" />);
  const nav = host.querySelector(".site-footer__row > nav.site-footer__nav")!;
  expect(nav.getAttribute("aria-label")).toBe("Legal");
  expect(nav.querySelector(":scope > ul.site-footer__links a")?.textContent).toBe("Privacy");
});

it("renders no empty <strong> for a wordmark footer brand", () => {
  const host = mount(() => <SiteFooter {...footerBase} brand={{ name: "", href: "/", logo: <span class="mark">Acme</span> }} />);
  expect(host.querySelector(".site-footer__brand strong")).toBeNull();
  expect(host.querySelector(".site-footer__brand .mark")?.textContent).toBe("Acme");
});
