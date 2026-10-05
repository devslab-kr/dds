import { brandIconLinks } from "./core/seo.mjs";
import { gtmHeadScript } from "./core/gtm.mjs";
import { fontPreloadLinks } from "./core/fonts.mjs";

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

// `icons` is opt-in: the adapter cannot know where (or whether) a product
// serves the linq-brand files, and a head that links icons the server 404s
// is worse than one that links none. `true` takes the /brand default.
// `gtm` is opt-in the same way, and per route: the product decides which
// pages carry Tag Manager (public marketing and legal pages, not consoles).
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
  if (options.gtm !== undefined) head.scripts = [gtmHeadEntry(options.gtm)];
  return head;
}

export const toHtmlAttributes = (metadata) => ({ lang: metadata.html.lang, dir: metadata.html.dir });
