import type { LocaleRegistry, SiteLocale, TextDirection } from "./locales.mjs";
export interface MetadataInput<Code extends string = SiteLocale> { baseUrl: string; path: string; locale: Code; defaultLocale: Code; title: string; description: string; siteName: string; image: string; registry?: LocaleRegistry<Code> }
export interface SiteMetadata<Code extends string = SiteLocale> {
  html: { lang: Code; dir: TextDirection };
  title: string; description: string; canonical: string;
  alternates: Array<{ hreflang: Code | "x-default"; href: string }>;
  openGraph: { type: "website"; locale: Code; url: string; siteName: string; title: string; description: string; images: Array<{ url: string }> };
  twitter: { card: "summary_large_image"; title: string; description: string; image: string };
}
export declare function localizedPath<Code extends string = SiteLocale>(path: string, locale: Code, defaultLocale: Code, registry?: LocaleRegistry<Code>): string;
export declare function localizedUrl<Code extends string = SiteLocale>(baseUrl: string, path: string, locale: Code, defaultLocale: Code, registry?: LocaleRegistry<Code>): string;
export declare function buildMetadata<Code extends string = SiteLocale>(input: MetadataInput<Code>): SiteMetadata<Code>;
export declare function buildSitemap<Code extends string = SiteLocale>(input: { baseUrl: string; routes: string[]; defaultLocale: Code; lastModified?: string; registry?: LocaleRegistry<Code> }): Array<{ loc: string; locale: Code; alternates: Array<{ hreflang: Code | "x-default"; href: string }>; lastmod?: string }>;
export declare function renderSitemapXml(entries: ReturnType<typeof buildSitemap>): string;
export type RobotsPolicy = "allow" | "disallow";
export declare const ROBOTS_USER_AGENTS: { readonly citation: readonly string[]; readonly modelTraining: readonly string[] };
export declare function buildRobots(input: { baseUrl: string; environment: "production" | "preview" | "development"; policies?: { search: RobotsPolicy; citation: RobotsPolicy; modelTraining: RobotsPolicy } }): string;
/** The @devslab/linq-brand icon files a page head links, in link order. */
export declare const BRAND_ICON_FILES: readonly ["favicon.svg", "mark-48.png", "favicon.ico", "apple-touch-icon.png"];
export interface BrandIconLink { rel: "icon" | "apple-touch-icon"; href: string; type?: string; sizes?: string }
/** `<link>` descriptors for BRAND_ICON_FILES served at `basePath` (default "/brand"; a same-origin path, never a URL). */
export declare function brandIconLinks(options?: { basePath?: string }): BrandIconLink[];
