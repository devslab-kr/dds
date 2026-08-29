import type { SiteLocale, TextDirection } from "./locales.mjs";
export interface MetadataInput { baseUrl: string; path: string; locale: SiteLocale; defaultLocale: SiteLocale; title: string; description: string; siteName: string; image: string }
export interface SiteMetadata {
  html: { lang: SiteLocale; dir: TextDirection };
  title: string; description: string; canonical: string;
  alternates: Array<{ hreflang: SiteLocale | "x-default"; href: string }>;
  openGraph: { type: "website"; locale: SiteLocale; url: string; siteName: string; title: string; description: string; images: Array<{ url: string }> };
  twitter: { card: "summary_large_image"; title: string; description: string; image: string };
}
export declare function localizedPath(path: string, locale: SiteLocale, defaultLocale: SiteLocale): string;
export declare function localizedUrl(baseUrl: string, path: string, locale: SiteLocale, defaultLocale: SiteLocale): string;
export declare function buildMetadata(input: MetadataInput): SiteMetadata;
export declare function buildSitemap(input: { baseUrl: string; routes: string[]; defaultLocale: SiteLocale; lastModified?: string }): Array<{ loc: string; locale: SiteLocale; alternates: Array<{ hreflang: SiteLocale | "x-default"; href: string }>; lastmod?: string }>;
export declare function renderSitemapXml(entries: ReturnType<typeof buildSitemap>): string;
export type RobotsPolicy = "allow" | "disallow";
export declare const ROBOTS_USER_AGENTS: { readonly citation: readonly string[]; readonly modelTraining: readonly string[] };
export declare function buildRobots(input: { baseUrl: string; environment: "production" | "preview" | "development"; policies?: { search: RobotsPolicy; citation: RobotsPolicy; modelTraining: RobotsPolicy } }): string;
