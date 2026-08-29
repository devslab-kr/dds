import axe from "axe-core";
import { render } from "solid-js/web";
import { afterEach, expect, it } from "vitest";

import { MarketingShell } from "../index";
import { locale, messages } from "./fixtures";

let dispose: (() => void) | undefined;
afterEach(() => { dispose?.(); dispose = undefined; document.body.replaceChildren(); });

it("shared public-site chrome has no detectable axe violations", async () => {
  const host = document.body.appendChild(document.createElement("div"));
  dispose = render(() => <MarketingShell
    messages={messages}
    header={{ brand: { name: "VisionLinq", href: "/" }, navigation: [{ href: "/docs", label: "Docs" }], locale, messages }}
    footer={{ brand: { name: "VisionLinq", href: "/" }, links: [{ href: "/privacy", label: "Privacy" }], copyright: "2026 DevsLab", messages }}
  ><h1>Document intelligence</h1></MarketingShell>, host);
  const result = await axe.run(host, { rules: { "color-contrast": { enabled: false } } });
  expect(result.violations).toEqual([]);
});
