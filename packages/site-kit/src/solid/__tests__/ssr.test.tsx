import { renderToString } from "solid-js/web";
import { expect, it } from "vitest";

import { MarketingShell } from "../index";
import { locale, messages } from "./fixtures";

const Fixture = () => <MarketingShell
    messages={messages}
    header={{ brand: { name: "VisionLinq", href: "/" }, navigation: [], locale, messages }}
    footer={{ brand: { name: "VisionLinq", href: "/" }, links: [], copyright: "2026 DevsLab", messages }}
  ><h1>Document intelligence</h1></MarketingShell>;

it("server-renders shared chrome", () => {
  const html = renderToString(() => <Fixture />);
  expect(html).toContain("VisionLinq");
  expect(html).toContain("Document intelligence");
  expect(html).toContain('id="main-content"');
});
