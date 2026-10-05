import type { SiteMetadata } from "./core/seo.mjs";
import type { SiteLocale } from "./core/locales.mjs";

/**
 * Generic over the locale code, like the builders that feed it. A product
 * registry (D-018) yields `SiteMetadata<string>`; the adapter reads the
 * same fields whatever the code type is, so it must not refuse that.
 */
/**
 * `icons: true` appends brandIconLinks() (the /brand default); an object passes its options through. Omitted, no icon links are emitted.
 * `fontPreload` appends fontPreloadLinks(fontPreload) — the same-origin URL(s) the product's bundler gave the family face, e.g. Geist Latin imported with `?url` (D-033). Omitted, no preload links are emitted.
 * `gtm` adds Google Tag Manager's head loader for that container id as `scripts[0]`; omitted or `undefined` (a route without Tag Manager), the result has no `scripts` key.
 */
export interface TanStackHeadOptions { icons?: boolean | { basePath?: string }; fontPreload?: string | readonly string[] | undefined; gtm?: string | undefined }
/** A route `head().scripts` entry: the loader body only. The router adds `ssr.nonce` when it renders the tag. Throws RangeError for a malformed id. */
export interface GtmHeadEntry { children: string }
export declare function gtmHeadEntry(containerId: string): GtmHeadEntry;
export declare function toTanStackHead<Code extends string = SiteLocale>(metadata: SiteMetadata<Code>, options?: TanStackHeadOptions): { meta: Array<Record<string, string>>; links: Array<Record<string, string>>; scripts?: GtmHeadEntry[] };
export declare const toHtmlAttributes: <Code extends string = SiteLocale>(metadata: SiteMetadata<Code>) => { lang: Code; dir: string };
