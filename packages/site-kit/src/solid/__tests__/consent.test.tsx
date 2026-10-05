// @vitest-environment-options {"url": "https://example.test/ko/pricing?utm=1"}
import axe from "axe-core";
import { render } from "solid-js/web";
import { afterEach, beforeEach, expect, it } from "vitest";

import { CONSENT_MESSAGES_KO, createConsentManager, type ConsentManager, type ConsentRecord } from "../../core/consent.mjs";
import { ConsentBanner, SiteFooter } from "../index";
import { messages } from "./fixtures";

const GTM = "GTM-AB12CD3";
let dispose: (() => void) | undefined;
let records: ConsentRecord[];

const clearCookies = () => {
  for (const part of document.cookie.split(";")) {
    const name = part.split("=", 1)[0]?.trim();
    if (name) document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
};
beforeEach(() => { records = []; });
afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.replaceChildren();
  document.head.replaceChildren();
  clearCookies();
  delete (window as { dataLayer?: unknown }).dataLayer;
  delete (window as { __siteConsent?: unknown }).__siteConsent;
});

function mount(consent?: ConsentManager) {
  const controller = consent ?? createConsentManager({ policyVersion: "2026-10-05", gtm: GTM, onChange: (record) => { records.push(record); } });
  const host = document.body.appendChild(document.createElement("div"));
  dispose = render(() => <>
    <ConsentBanner controller={controller} messages={CONSENT_MESSAGES_KO} privacyHref="/privacy" />
    <main id="main-content"><h1>본문</h1></main>
    <SiteFooter
      brand={{ name: "AskLinq", href: "/" }}
      links={[{ href: "/privacy", label: "개인정보처리방침", emphasis: true }]}
      copyright="© DevsLab"
      messages={messages}
      consentSettings={{ controller, label: CONSENT_MESSAGES_KO.trigger }}
    />
  </>, host);
  return { controller, host };
}

const bar = () => document.querySelector<HTMLElement>(".site-consent");
const button = (scope: ParentNode, label: string) => [...scope.querySelectorAll("button")].find((element) => element.textContent === label)!;
const googleScripts = () => [...document.querySelectorAll("script")].filter((script) => script.src.includes("googletagmanager.com"));
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

it("asks with three equal choices and loads nothing before one is made", () => {
  mount();
  expect(bar()).not.toBeNull();
  expect(bar()!.getAttribute("aria-label")).toBe("쿠키 동의");
  const actions = [...bar()!.querySelectorAll(".site-consent__actions button")];
  expect(actions.map((element) => element.textContent)).toEqual(["모두 허용", "거부", "설정"]);
  // Equal weight: one class list for all three, so no choice is drawn heavier.
  expect(new Set(actions.map((element) => element.className)).size).toBe(1);
  expect(actions[0]!.className).toContain("dds-btn--secondary");
  expect(bar()!.querySelector('a[href="/privacy"]')?.textContent).toBe("개인정보처리방침");
  expect(googleScripts()).toEqual([]);
  expect(document.cookie).not.toContain("site_consent");
});

it("accepting hides the bar, sets the cookie, loads Tag Manager once and records a grant", async () => {
  mount();
  button(bar()!, "모두 허용").click();
  await flush();
  expect(bar()).toBeNull();
  expect(document.cookie).toMatch(/site_consent=v=2026-10-05&a=1&t=\d+&id=[0-9a-f]{32}/);
  expect(googleScripts()).toHaveLength(1);
  expect(records.map((record) => [record.action, record.analytics, record.path])).toEqual([["grant", true, "/ko/pricing"]]);
  expect(document.querySelector('[role="status"]')?.textContent).toBe("쿠키 설정을 저장했습니다.");
});

it("rejecting hides the bar and never loads Tag Manager", async () => {
  mount();
  button(bar()!, "거부").click();
  await flush();
  expect(bar()).toBeNull();
  expect(googleScripts()).toEqual([]);
  expect(records.map((record) => record.action)).toEqual(["deny"]);
});

it("Escape or ✕ closes the bar without a decision", () => {
  const { controller } = mount();
  bar()!.querySelector("button")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  expect(bar()).toBeNull();
  expect(controller.needsDecision()).toBe(true);
  expect(document.cookie).not.toContain("site_consent");
  expect(records).toEqual([]);
  dispose?.();
  document.body.replaceChildren();
  mount();
  (bar()!.querySelector(".site-consent__dismiss") as HTMLButtonElement).click();
  expect(bar()).toBeNull();
  expect(googleScripts()).toEqual([]);
});

it("the settings show necessary as information and analytics as an unticked switch, and save a choice", async () => {
  mount();
  button(bar()!, "설정").click();
  await flush();
  const panel = dialog()!;
  expect(panel.getAttribute("aria-modal")).toBe("true");
  const [necessary, analytics] = [...panel.querySelectorAll(".site-consent-category")];
  expect(necessary!.querySelector("input")).toBeNull();
  expect(necessary!.querySelector(".site-consent-category__status")?.textContent).toBe("항상 사용");
  const toggle = analytics!.querySelector<HTMLInputElement>('input[role="switch"]')!;
  expect(toggle.checked).toBe(false);
  expect(toggle.getAttribute("aria-describedby")).toBe("site-consent-analytics-body");
  expect(panel.querySelector(".site-consent-dialog__close")?.getAttribute("aria-label")).toBe("닫기");
  const footer = [...panel.querySelectorAll(".dds-dialog__actions button")];
  expect(footer.map((element) => element.textContent)).toEqual(["모두 허용", "거부", "선택 저장"]);
  expect(new Set(footer.map((element) => element.className)).size).toBe(1);
  toggle.click();
  button(panel, "선택 저장").click();
  await flush();
  expect(dialog()).toBeNull();
  expect(bar()).toBeNull();
  expect(records.map((record) => record.action)).toEqual(["grant"]);
  expect(googleScripts()).toHaveLength(1);
});

it("the footer's 쿠키 설정 re-opens the settings to withdraw", async () => {
  document.cookie = `site_consent=v=2026-10-05&a=1&t=${Math.floor(Date.now() / 1000)}&id=0123456789abcdef0123456789abcdef; Path=/; Secure`;
  document.cookie = "_ga=GA1.1.1.1; Path=/";
  mount();
  expect(bar()).toBeNull();
  expect(googleScripts()).toHaveLength(1);
  const trigger = document.querySelector<HTMLButtonElement>("footer .site-consent-trigger")!;
  expect(trigger.textContent).toBe("쿠키 설정");
  expect(trigger.closest("li")?.nextElementSibling?.textContent).toBe("© DevsLab");
  trigger.click();
  await flush();
  const toggle = dialog()!.querySelector<HTMLInputElement>('input[role="switch"]')!;
  expect(toggle.checked).toBe(true);
  toggle.click();
  button(dialog()!, "선택 저장").click();
  await flush();
  expect(records.map((record) => record.action)).toEqual(["withdraw"]);
  expect(document.cookie).toContain("a=0");
  expect(document.cookie).not.toContain("_ga=");
  expect(bar()).toBeNull();
});

it("Escape closes the settings without saving", async () => {
  mount();
  button(bar()!, "설정").click();
  await flush();
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await flush();
  expect(dialog()).toBeNull();
  expect(bar()).not.toBeNull();
  expect(records).toEqual([]);
});

it("the bar and the settings dialog have no detectable axe violations", async () => {
  const { host } = mount();
  let result = await axe.run(host, { rules: { "color-contrast": { enabled: false } } });
  expect(result.violations).toEqual([]);
  button(bar()!, "설정").click();
  await flush();
  result = await axe.run(host, { rules: { "color-contrast": { enabled: false } } });
  expect(result.violations).toEqual([]);
});
