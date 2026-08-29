import { render } from "@solidjs/web";
import { afterEach, expect, it, vi } from "vitest";

import { MarketingShell, NotFoundLayout, RequestAccessForm } from "../index";
import { locale, messages } from "./fixtures";

let dispose: (() => void) | undefined;
afterEach(() => { dispose?.(); dispose = undefined; document.body.replaceChildren(); });

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
