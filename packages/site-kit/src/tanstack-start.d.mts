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
 * `gtm` adds Google Tag Manager's head loader for that container id as `scripts[0]` — unconditionally, without consent. Kept for compatibility; family products use `consent` instead (D-034).
 * `consent` adds consentHeadEntry(consent) as `scripts[0]`: Consent Mode defaults, plus the loader only when the cookie grants analytics for the current policy version. Passing both `gtm` and `consent` throws TypeError.
 * Neither (a route without Tag Manager): the result has no `scripts` key.
 */
export interface TanStackHeadOptions { icons?: boolean | { basePath?: string }; fontPreload?: string | readonly string[] | undefined; gtm?: string | undefined; consent?: ConsentHeadOptions | undefined }
/**
 * `cookie`: the request's Cookie header on the server, `document.cookie` in the browser (createIsomorphicFn), so hydration sees the same script.
 * `gtm`: the container to load once analytics is granted; omitted, the entry is the Consent Mode defaults only.
 */
export interface ConsentHeadOptions { policyVersion: string; cookie: string | null | undefined; gtm?: string | undefined; cookieName?: string | undefined }
/** The consent-gated `scripts` entry (inline script body only; the router adds `ssr.nonce`). Throws RangeError for a malformed id or policy version. */
export declare function consentHeadEntry(options: ConsentHeadOptions): GtmHeadEntry;
/** A route `head().scripts` entry: the loader body only. The router adds `ssr.nonce` when it renders the tag. Throws RangeError for a malformed id. */
export interface GtmHeadEntry { children: string }
export declare function gtmHeadEntry(containerId: string): GtmHeadEntry;
export declare function toTanStackHead<Code extends string = SiteLocale>(metadata: SiteMetadata<Code>, options?: TanStackHeadOptions): { meta: Array<Record<string, string>>; links: Array<Record<string, string>>; scripts?: GtmHeadEntry[] };
export declare const toHtmlAttributes: <Code extends string = SiteLocale>(metadata: SiteMetadata<Code>) => { lang: Code; dir: string };
