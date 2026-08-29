import { LOCALES, canonicalLocale, localeAttributes } from "./locales.mjs";

const cleanBase = (baseUrl) => String(baseUrl).replace(/\/+$/, "");
const cleanPath = (path) => {
  const value = `/${String(path || "/").replace(/^\/+|\/+$/g, "")}`;
  return value === "/" ? "/" : value;
};

export function localizedPath(path, locale, defaultLocale) {
  const canonical = canonicalLocale(locale);
  const fallback = canonicalLocale(defaultLocale);
  if (!canonical || !fallback) throw new RangeError("localizedPath received an unsupported locale");
  const normalized = cleanPath(path);
  return canonical === fallback ? normalized : `/${canonical}${normalized === "/" ? "" : normalized}`;
}

export function localizedUrl(baseUrl, path, locale, defaultLocale) {
  return `${cleanBase(baseUrl)}${localizedPath(path, locale, defaultLocale)}`;
}

export function buildMetadata({ baseUrl, path, locale, defaultLocale, title, description, siteName, image }) {
  const canonicalLocaleCode = canonicalLocale(locale);
  if (!canonicalLocaleCode) throw new RangeError(`Unsupported locale: ${locale}`);
  const canonical = localizedUrl(baseUrl, path, canonicalLocaleCode, defaultLocale);
  const alternates = LOCALES.map(({ code }) => ({ hreflang: code, href: localizedUrl(baseUrl, path, code, defaultLocale) }));
  alternates.push({ hreflang: "x-default", href: localizedUrl(baseUrl, path, defaultLocale, defaultLocale) });
  const imageUrl = new URL(image, `${cleanBase(baseUrl)}/`).href;
  return {
    html: localeAttributes(canonicalLocaleCode),
    title,
    description,
    canonical,
    alternates,
    openGraph: {
      type: "website",
      locale: canonicalLocaleCode,
      url: canonical,
      siteName,
      title,
      description,
      images: [{ url: imageUrl }],
    },
    twitter: { card: "summary_large_image", title, description, image: imageUrl },
  };
}

export function buildSitemap({ baseUrl, routes, defaultLocale, lastModified }) {
  return routes.flatMap((path) => LOCALES.map(({ code }) => ({
    loc: localizedUrl(baseUrl, path, code, defaultLocale),
    locale: code,
    alternates: [
      ...LOCALES.map(({ code: alternate }) => ({ hreflang: alternate, href: localizedUrl(baseUrl, path, alternate, defaultLocale) })),
      { hreflang: "x-default", href: localizedUrl(baseUrl, path, defaultLocale, defaultLocale) },
    ],
    ...(lastModified ? { lastmod: lastModified } : {}),
  })));
}

export function renderSitemapXml(entries) {
  const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const urls = entries.map((entry) => `  <url>\n    <loc>${escape(entry.loc)}</loc>${entry.lastmod ? `\n    <lastmod>${escape(entry.lastmod)}</lastmod>` : ""}${entry.alternates.map((alternate) => `\n    <xhtml:link rel="alternate" hreflang="${escape(alternate.hreflang)}" href="${escape(alternate.href)}" />`).join("")}\n  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
}

export const ROBOTS_USER_AGENTS = Object.freeze({
  citation: Object.freeze(["OAI-SearchBot", "PerplexityBot"]),
  modelTraining: Object.freeze(["GPTBot", "Google-Extended", "ClaudeBot"]),
});

const robotsDirective = (policy) => {
  if (policy === "allow") return "Allow: /";
  if (policy === "disallow") return "Disallow: /";
  throw new RangeError(`Unsupported robots policy: ${policy}`);
};

export function buildRobots({ baseUrl, environment, policies }) {
  if (policies) {
    const groups = [
      `User-agent: *\n${robotsDirective(policies.search)}`,
      `${ROBOTS_USER_AGENTS.citation.map((agent) => `User-agent: ${agent}`).join("\n")}\n${robotsDirective(policies.citation)}`,
      `${ROBOTS_USER_AGENTS.modelTraining.map((agent) => `User-agent: ${agent}`).join("\n")}\n${robotsDirective(policies.modelTraining)}`,
    ];
    if (environment === "production") groups.push(`Sitemap: ${cleanBase(baseUrl)}/sitemap.xml`);
    return `${groups.join("\n\n")}\n`;
  }
  if (environment !== "production") return "User-agent: *\nDisallow: /\n";
  return `User-agent: *\nAllow: /\nSitemap: ${cleanBase(baseUrl)}/sitemap.xml\n`;
}
