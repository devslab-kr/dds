import { brandIconLinks } from "./core/seo.mjs";
import { gtmHeadScript } from "./core/gtm.mjs";
import { fontPreloadLinks } from "./core/fonts.mjs";
import { consentCookieGrantsAnalytics, consentHeadScript } from "./core/consent.mjs";

/**
 * Send these on every route that uses `consent` (TanStack Start: the route's
 * `headers` option). The head differs per visitor's cookie, so the page must
 * never sit in a shared cache.
 */
export { CONSENT_RESPONSE_HEADERS } from "./core/consent.mjs";

/**
 * A route `head().scripts` entry that loads Google Tag Manager (D-031).
 *
 * Only `children`: no `nonce`, on purpose. The router's HeadContent stamps
 * `router.options.ssr.nonce` on every head script it renders, after the
 * entry's own attributes, so the per-request nonce reaches this script the
 * same way it reaches the meta and link tags. A nonce written here would be
 * overwritten anyway. The product sets `ssr.nonce` when it creates the
 * router (asklinq#427); without it the loader renders with no nonce and the
 * page's CSP blocks it.
 */
export function gtmHeadEntry(containerId) {
  return { children: gtmHeadScript(containerId) };
}

/**
 * The consent-gated head entry (D-034): one inline script. Without a current
 * analytics grant in `cookie` it only pushes Consent Mode defaults (all
 * denied) into the page's dataLayer — nothing contacts Google. With one, it
 * also grants `analytics_storage` and runs Google's Tag Manager loader.
 *
 * `cookie` is the Cookie header on the server and `document.cookie` in the
 * browser (TanStack Start: createIsomorphicFn), so both sides of hydration
 * render the same script. Only the consent cookie is read from it; nothing
 * from it is written into the page. Like gtmHeadEntry, no nonce: the router
 * stamps `ssr.nonce`.
 */
export function consentHeadEntry(options) {
  const granted = consentCookieGrantsAnalytics(options?.cookie, {
    policyVersion: options?.policyVersion,
    ...(options.cookieName === undefined ? {} : { cookieName: options.cookieName }),
  });
  return { children: consentHeadScript({ granted, gtm: options.gtm }) };
}

// `icons` is opt-in: the adapter cannot know where (or whether) a product
// serves the linq-brand files, and a head that links icons the server 404s
// is worse than one that links none. `true` takes the /brand default.
// `gtm` is opt-in the same way, and per route: the product decides which
// pages carry Tag Manager (public marketing and legal pages, not consoles).
// It loads Tag Manager unconditionally and stays for compatibility; products
// switch to `consent` (D-034), which loads it only after an opt-in.
// `fontPreload` is opt-in too: only the product knows the hashed URL its
// bundler gave the face (D-033). Appended after the icons.
export function toTanStackHead(metadata, options = {}) {
  const icons = options.icons === true ? brandIconLinks() : options.icons ? brandIconLinks(options.icons) : [];
  const head = {
    meta: [
      { title: metadata.title },
      { name: "description", content: metadata.description },
      { property: "og:type", content: metadata.openGraph.type },
      { property: "og:locale", content: metadata.openGraph.locale },
      { property: "og:url", content: metadata.openGraph.url },
      { property: "og:site_name", content: metadata.openGraph.siteName },
      { property: "og:title", content: metadata.openGraph.title },
      { property: "og:description", content: metadata.openGraph.description },
      { property: "og:image", content: metadata.openGraph.images[0].url },
      { name: "twitter:card", content: metadata.twitter.card },
      { name: "twitter:title", content: metadata.twitter.title },
      { name: "twitter:description", content: metadata.twitter.description },
      { name: "twitter:image", content: metadata.twitter.image },
    ],
    links: [
      { rel: "canonical", href: metadata.canonical },
      ...metadata.alternates.map(({ hreflang, href }) => ({ rel: "alternate", hreflang, href })),
      ...icons,
      ...(options.fontPreload === undefined ? [] : fontPreloadLinks(options.fontPreload)),
    ],
  };
  if (options.gtm !== undefined && options.consent !== undefined) {
    throw new TypeError("toTanStackHead: pass the container id as consent.gtm, not both gtm and consent — gtm alone loads Tag Manager without consent");
  }
  if (options.consent !== undefined) head.scripts = [consentHeadEntry(options.consent)];
  else if (options.gtm !== undefined) head.scripts = [gtmHeadEntry(options.gtm)];
  return head;
}

export const toHtmlAttributes = (metadata) => ({ lang: metadata.html.lang, dir: metadata.html.dir });
