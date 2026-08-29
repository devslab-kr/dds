import { renderToString } from "@solidjs/web";
import { expect, it } from "vitest";

import { MarketingShell } from "../index";
import { locale, messages } from "./fixtures";

it("renders shared chrome without browser globals during SSR", () => {
  const html = renderToString(() => <MarketingShell
    messages={messages}
    header={{ brand: { name: "VisionLinq", href: "/" }, navigation: [], locale, messages, theme: {} }}
    footer={{ brand: { name: "VisionLinq", href: "/" }, links: [], copyright: "2026 DevsLab", messages }}
  ><h1>Document intelligence</h1></MarketingShell>);
  expect(html).toContain("VisionLinq");
  expect(html).toContain("Document intelligence");
  expect(html).toContain('id="main-content"');
});
