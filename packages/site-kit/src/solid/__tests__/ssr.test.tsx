import { hydrate, renderToString } from "@solidjs/web";
import { expect, it, vi } from "vitest";

import { MarketingShell } from "../index";
import { locale, messages } from "./fixtures";

const Fixture = () => <MarketingShell
    messages={messages}
    header={{ brand: { name: "VisionLinq", href: "/" }, navigation: [], locale, messages }}
    footer={{ brand: { name: "VisionLinq", href: "/" }, links: [], copyright: "2026 DevsLab", messages }}
  ><h1>Document intelligence</h1></MarketingShell>;

it("renders and hydrates shared chrome without diagnostics", async () => {
  const html = renderToString(() => <Fixture />);
  expect(html).toContain("VisionLinq");
  expect(html).toContain("Document intelligence");
  expect(html).toContain('id="main-content"');
  const host = document.body.appendChild(document.createElement("div"));
  host.innerHTML = html;
  const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const dispose = hydrate(() => <Fixture />, host);
  await Promise.resolve();
  expect(warning).not.toHaveBeenCalled();
  expect(error).not.toHaveBeenCalled();
  dispose();
  host.remove();
});
