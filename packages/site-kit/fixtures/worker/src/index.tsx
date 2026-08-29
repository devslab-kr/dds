import { renderToString } from "@solidjs/web";
import { createComponent } from "solid-js";

import { buildMetadata, type SiteLocale } from "@devslab/site-kit";
import { MarketingShell } from "@devslab/site-kit/solid";
import { toTanStackHead } from "@devslab/site-kit/tanstack-start";
import coreWorker from "./index.mjs";

const messages = {
  navigationLabel: "التنقل الرئيسي", localeLabel: "اللغة", themeLabel: "السمة",
  themeSystem: "النظام", themeLight: "فاتح", themeDark: "داكن",
  menuOpen: "فتح القائمة", menuClose: "إغلاق القائمة", footerLabel: "التذييل",
  skipToContent: "انتقل إلى المحتوى", updatedLabel: "محدث", notFoundTitle: "الصفحة غير موجودة",
  notFoundDescription: "الصفحة المطلوبة غير موجودة.", backHome: "العودة للرئيسية",
  errorTitle: "حدث خطأ", errorDescription: "يرجى المحاولة مرة أخرى.", retry: "إعادة المحاولة",
};

const escapeHtml = (value: unknown) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function renderFixture(origin: string) {
  const metadata = buildMetadata({ baseUrl: origin, path: "/", locale: "ar", defaultLocale: "ko", title: "موقع تجريبي", description: "اختبار الخادم والترطيب", siteName: "Fixture", image: "/social.png" });
  const head = toTanStackHead(metadata);
  const body = renderToString(() => createComponent(MarketingShell, {
    messages,
    header: {
      brand: { name: "Fixture", href: "/ar" },
      navigation: [{ href: "/ar/docs", label: "الوثائق" }],
      locale: { locale: "ar", hrefForLocale: (locale: SiteLocale) => locale === "ko" ? "/" : `/${locale}` },
      messages,
    },
    footer: { brand: { name: "Fixture", href: "/ar" }, links: [], copyright: "2026 DevsLab", messages },
    get children() { return "اختبار مكونات الموقع"; },
  }));
  const tags = [
    `<title>${escapeHtml(head.meta.find((entry) => "title" in entry)?.title ?? metadata.title)}</title>`,
    ...head.meta.filter((entry) => !("title" in entry)).map((entry) => `<meta ${Object.entries(entry).map(([key, value]) => `${key}="${escapeHtml(value)}"`).join(" ")}>`),
    ...head.links.map((entry) => `<link ${Object.entries(entry).map(([key, value]) => `${key}="${escapeHtml(value)}"`).join(" ")}>`),
  ].join("");
  const hydration = JSON.stringify({ locale: "ar", component: "MarketingShell" }).replaceAll("<", "\\u003c");
  return `<!doctype html><html lang="ar" dir="rtl" data-site-hydration="ssr"><head>${tags}</head><body><div id="site-hydration-root">${body}</div><script type="application/json" data-site-hydration-state>${hydration}</script></body></html>`;
}

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);
    if (url.pathname === "/") return new Response(renderFixture(url.origin), { headers: { "content-type": "text/html; charset=utf-8" } });
    return coreWorker.fetch(request);
  },
};
