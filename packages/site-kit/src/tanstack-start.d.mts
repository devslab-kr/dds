import type { SiteMetadata } from "./core/seo.mjs";
export declare function toTanStackHead(metadata: SiteMetadata): { meta: Array<Record<string, string>>; links: Array<Record<string, string>> };
export declare const toHtmlAttributes: (metadata: SiteMetadata) => { lang: string; dir: string };
