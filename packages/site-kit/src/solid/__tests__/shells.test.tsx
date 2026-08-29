import { render } from "solid-js/web";
import { afterEach, expect, it, vi } from "vitest";

import { MarketingShell, NotFoundLayout, RequestAccessForm, ThemeToggle } from "../index";
import { locale, messages } from "./fixtures";

let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.replaceChildren();
  localStorage.clear();
  vi.unstubAllGlobals();
});

it("renders an icon-only two-state theme action with an accessible name", () => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
  const host = document.body.appendChild(document.createElement("div"));
  dispose = render(() => <ThemeToggle messages={messages} storageKey="test-theme" />, host);

  const toggle = host.querySelector<HTMLButtonElement>(".site-theme-toggle")!;
  expect(toggle.textContent).toBe("");
  expect(toggle.getAttribute("aria-label")).toBe("Theme: Dark");
  expect(toggle.querySelector("svg")?.getAttribute("data-icon")).toBe("site-moon");

  toggle.click();
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(document.documentElement.dataset.themePreference).toBe("dark");
  expect(localStorage.getItem("test-theme")).toBe("dark");
  expect(toggle.getAttribute("aria-label")).toBe("Theme: Light");
  expect(toggle.querySelector("svg")?.getAttribute("data-icon")).toBe("site-sun");

  toggle.click();
  expect(document.documentElement.dataset.theme).toBe("light");
  expect(document.documentElement.dataset.themePreference).toBe("light");
});

it("renders shared chrome and opens the mobile navigation", () => {
  const host = document.body.appendChild(document.createElement("div"));
  dispose = render(() => <MarketingShell
    messages={messages}
    header={{ brand: { name: "VisionLinq", href: "/" }, navigation: [{ href: "/docs", label: "Docs" }], locale, messages }}
    footer={{ brand: { name: "VisionLinq", href: "/" }, links: [{ href: "/privacy", label: "Privacy" }], copyright: "2026 DevsLab", messages }}
  ><h1>Document intelligence</h1></MarketingShell>, host);
  const toggle = host.querySelector<HTMLButtonElement>(".site-menu-button")!;
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  toggle.click();
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  expect(host.querySelector("#main-content h1")?.textContent).toBe("Document intelligence");
});

it("submits request-access data once and announces success", async () => {
  const submit = vi.fn(async () => undefined);
  const host = document.body.appendChild(document.createElement("div"));
  dispose = render(() => <RequestAccessForm messages={{
    nameLabel: "Name", emailLabel: "Email", organizationLabel: "Organization", useCaseLabel: "Use case",
    submit: "Request access", submitting: "Submitting", success: "Received", error: "Try again",
  }} onSubmit={submit} />, host);
  const form = host.querySelector("form")!;
  (host.querySelector('[name="name"]') as HTMLInputElement).value = "Ada";
  (host.querySelector('[name="email"]') as HTMLInputElement).value = "ada@example.com";
  form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
  await Promise.resolve();
  await Promise.resolve();
  expect(submit).toHaveBeenCalledTimes(1);
  expect(host.querySelector('[aria-live="polite"]')?.textContent).toBe("Received");
});

it("uses a crawlable home link on the not-found page", () => {
  const host = document.body.appendChild(document.createElement("div"));
  dispose = render(() => <NotFoundLayout messages={messages} homeHref="/" />, host);
  expect(host.querySelector<HTMLAnchorElement>('a[href="/"]')?.textContent).toBe("Back home");
});
