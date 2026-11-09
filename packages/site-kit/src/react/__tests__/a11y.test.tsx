import axe from "axe-core";
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { MarketingShell, SectionBlock, SectionHead, StepFlow } from "../index";
import { defineLocaleRegistry } from "../../core/locales.mjs";
import { locale, messages } from "./fixtures";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const rules = { rules: { "color-contrast": { enabled: false } } };

it("shared public-site chrome has no detectable axe violations", async () => {
  const { container } = render(<MarketingShell
    messages={messages}
    header={{ brand: { name: "VisionLinq", href: "/" }, navigation: [{ href: "/docs", label: "Docs" }], locale, messages }}
    footer={{ brand: { name: "VisionLinq", href: "/" }, links: [{ href: "/privacy", label: "Privacy" }], copyright: "2026 DevsLab", messages }}
  ><h1>Document intelligence</h1></MarketingShell>);
  expect((await axe.run(container, rules)).violations).toEqual([]);
});

it("the flag menu, the footer language row and the section primitives have no detectable axe violations", async () => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
  const registry = defineLocaleRegistry({ only: ["ko", "en", "ja", "zh-TW"] });
  const state = { locale: "ko" as const, hrefForLocale: (code: string) => `/${code}` };
  const { container } = render(<MarketingShell
    messages={messages}
    mainWidth="bleed"
    header={{
      brand: { name: "", href: "/ko", label: "쿠루 홈", logo: <><svg aria-hidden="true" /><span>쿠루</span></> },
      navigation: [{ href: "#how", label: "How" }],
      locale: state, localeVariant: "flag", localeRegistry: registry, messages,
      theme: { storageKey: "a11y-theme" },
    }}
    footer={{ brand: { name: "Qooroo", href: "/" }, links: [{ href: "/privacy", label: "Privacy", emphasis: true }], linksLabel: "Legal", locale: state, localeRegistry: registry, copyright: "© 2026 DevsLab", messages }}
  >
    <SectionBlock id="how" labelledBy="how-title">
      <SectionHead index="01" title="How it works" titleId="how-title" />
      <StepFlow label="How it works" steps={[{ title: "Make", body: "Make a card." }, { title: "Share", body: "Share the QR." }]} />
    </SectionBlock>
  </MarketingShell>);
  for (const details of container.querySelectorAll("details")) details.open = true;
  expect((await axe.run(container, rules)).violations).toEqual([]);
});
