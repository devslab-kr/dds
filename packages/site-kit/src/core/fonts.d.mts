/** Package-relative path of Geist's Latin subset — the one family face every page fetches, so the one worth preloading (D-033). */
export declare const FAMILY_FONT_PRELOAD_FILE: "fonts/geist/geist-latin-wght-normal.woff2";
export interface FontPreloadLink { rel: "preload"; href: string; as: "font"; type: "font/woff2"; crossorigin: "anonymous" }
/** `<link rel="preload" as="font">` descriptors. Each href is a same-origin path ending in .woff2; anything else throws RangeError. */
export declare function fontPreloadLinks(hrefs: string | readonly string[]): FontPreloadLink[];
