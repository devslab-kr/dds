import { describe, it, expect } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteFooter, SiteHeader } from "./index";
import { devslabCopyright } from "../core/devslab.mjs";
import { buildMetadata, metadataHead, BRAND_ICON_FILES } from "../core/seo.mjs";
import { toTanStackHead } from "../tanstack-start.mjs";
import { defineLocaleRegistry } from "../core/locales.mjs";

describe("shared React site chrome", () => {
  it("uses the same bilingual publisher for products and the corporate site", () => {
    const product = renderToStaticMarkup(h(SiteFooter, { year: 2026, links: [{ href: "/privacy", label: "개인정보처리방침" }] }));
    const corporate = renderToStaticMarkup(h(SiteFooter, { year: 2026, showPublisherLink: false }));
    expect(product).toContain("© 2026 데브스랩 DevsLab");
    expect(corporate).toContain("© 2026 데브스랩 DevsLab");
    expect(product).toContain('href="https://devslab.kr/"');
    expect(corporate).not.toContain("by DevsLab");
    expect(product).not.toContain("이태리에프에스");
    expect(product).not.toContain("dds-site-link--emphasis");
    expect(devslabCopyright({ year: 2026, locale: "en" })).toBe("© 2026 DevsLab");
  });
  it("preserves product-home links and caller actions without rebuilding chrome", () => {
    const markup = renderToStaticMarkup(h(SiteHeader, { product: "Contract", actions: h("button", { type: "button" }, "테마") }));
    expect(markup).toContain('aria-label="DevsLab Contract 홈"');
    expect(markup).toContain('href="/"');
    expect(markup).toContain("dds-site-container");
    expect(markup).toContain("테마");
  });
  it("emits complete icon/social metadata with a safe private-app option", () => {
    const metadata = buildMetadata({ baseUrl: "https://contract.devslab.kr", path: "/", locale: "ko", defaultLocale: "ko", title: "Contract", description: "계약 관리", siteName: "DevsLab Contract", image: "/brand/og-image.png", registry: defineLocaleRegistry({ only: ["ko"] }) });
    expect(toTanStackHead(metadata).meta).toEqual(metadataHead(metadata, { icons: false }).meta);
    expect(toTanStackHead(metadata).links.some((link) => link.rel === "icon")).toBe(false);
    expect(toTanStackHead(metadata, { icons: true }).links.filter((link) => link.rel === "icon")).toHaveLength(3);
    const head = metadataHead(metadata, { canonical: false, robots: "noindex, nofollow" });
    for (const file of BRAND_ICON_FILES) expect(head.links.some((link) => link.href === `/brand/${file}`)).toBe(true);
    expect(head.links.some((link) => link.rel === "canonical")).toBe(false);
    expect(head.meta).toContainEqual({ name: "robots", content: "noindex, nofollow" });
    expect(head.meta).toContainEqual({ property: "og:locale", content: "ko_KR" });
    expect(head.meta).toContainEqual({ name: "twitter:image", content: "https://contract.devslab.kr/brand/og-image.png" });
  });
});
