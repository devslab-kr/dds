/**
 * Preload links for the family font (D-033). The faces themselves ship as
 * `@devslab/site-kit/fonts.css` + `fonts/**`; this module only builds the
 * `<link rel="preload">` a page head may add for the face every page needs.
 */

/**
 * Package-relative path of the face worth preloading: Geist's Latin subset.
 * Every family page draws Latin (digits, brand names, the language menu), so
 * it is the one file a page always fetches; Pretendard's 92 Korean subsets
 * depend on the text and are left to unicode-range.
 *
 * A Vite app imports it with `?url`, which yields the same hashed
 * `/assets/*` URL the stylesheet's url() becomes:
 *   import geistLatin from "@devslab/site-kit/fonts/geist/geist-latin-wght-normal.woff2?url";
 */
export const FAMILY_FONT_PRELOAD_FILE = "fonts/geist/geist-latin-wght-normal.woff2";

const SAME_ORIGIN_PATH = /^\/(?!\/)/;

/**
 * `<link rel="preload" as="font">` descriptors, same shape as
 * toTanStackHead's `links`. Each href must be a same-origin absolute path —
 * the CSP is `font-src 'self'`, so a URL on another origin (or a data: URI)
 * would be blocked anyway and the preload would only waste a request.
 * `crossorigin` is required even on the same origin: fonts are fetched in
 * CORS mode, and a preload without it is not reused by the @font-face fetch.
 */
export function fontPreloadLinks(hrefs) {
  const list = typeof hrefs === "string" ? [hrefs] : [...(hrefs ?? [])];
  return list.map((href) => {
    const value = String(href);
    if (!SAME_ORIGIN_PATH.test(value)) {
      throw new RangeError(`fontPreloadLinks takes same-origin paths ("/assets/…"), not ${JSON.stringify(value)}: a product serves its own fonts`);
    }
    if (!/\.woff2(?:[?#].*)?$/.test(value)) throw new RangeError(`fontPreloadLinks preloads woff2 files only: ${JSON.stringify(value)}`);
    return { rel: "preload", href: value, as: "font", type: "font/woff2", crossorigin: "anonymous" };
  });
}
