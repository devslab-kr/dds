import type { SiteMetadata } from "./core/seo.mjs";
import type { SiteLocale } from "./core/locales.mjs";

/**
 * Generic over the locale code, like the builders that feed it. A product
 * registry (D-018) yields `SiteMetadata<string>`; the adapter reads the
 * same fields whatever the code type is, so it must not refuse that.
 */
export declare function toTanStackHead<Code extends string = SiteLocale>(metadata: SiteMetadata<Code>): { meta: Array<Record<string, string>>; links: Array<Record<string, string>> };
export declare const toHtmlAttributes: <Code extends string = SiteLocale>(metadata: SiteMetadata<Code>) => { lang: Code; dir: string };
