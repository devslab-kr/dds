export function toTanStackHead(metadata) {
  return {
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
    ],
  };
}

export const toHtmlAttributes = (metadata) => ({ lang: metadata.html.lang, dir: metadata.html.dir });
