function text(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`Publisher ${field} must be a nonempty string`);
  return value;
}

function webUrl(value, field) {
  text(value, field);
  let parsed;
  try { parsed = new URL(value); } catch { throw new TypeError(`Publisher ${field} must be an absolute HTTP(S) URL`); }
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new TypeError(`Publisher ${field} must be an HTTP(S) URL without credentials`);
  return parsed.href;
}

/** Identity only. Capabilities, endorsements and other GEO claims remain verified facts. */
export function definePublisher(input) {
  const labels = Object.fromEntries(Object.entries(input.labels ?? {}).map(([locale, label]) => [locale, text(label, "label")]));
  const alternateName = input.alternateName === undefined ? undefined : Array.isArray(input.alternateName)
    ? Object.freeze(input.alternateName.map((name) => text(name, "alternateName"))) : text(input.alternateName, "alternateName");
  const sameAs = input.sameAs === undefined ? undefined : Object.freeze(input.sameAs.map((url) => webUrl(url, "sameAs URL")));
  return Object.freeze({
    id: webUrl(input.id, "id URL"), name: text(input.name, "name"), url: webUrl(input.url, "url URL"),
    ...(alternateName === undefined ? {} : { alternateName }),
    ...(sameAs === undefined ? {} : { sameAs }),
    labels: Object.freeze(labels),
    defaultLabel: text(input.defaultLabel ?? input.name, "defaultLabel"),
  });
}

export function buildPublisher(input, { locale } = {}) {
  const identity = definePublisher(input);
  const language = locale?.toLowerCase();
  const labelFor = (key) => Object.hasOwn(identity.labels, key) ? identity.labels[key] : undefined;
  const label = labelFor(locale) ?? labelFor(language) ?? labelFor(language?.split("-")[0]) ?? identity.defaultLabel;
  return {
    organization: {
      "@context": "https://schema.org", "@type": "Organization", "@id": identity.id,
      name: identity.name, url: identity.url,
      ...(identity.alternateName === undefined ? {} : { alternateName: identity.alternateName }),
      ...(identity.sameAs === undefined ? {} : { sameAs: identity.sameAs }),
    },
    reference: { "@id": identity.id },
    link: { href: identity.url, label },
  };
}

/** Safe inside an HTML script element, including when values contain </script>. */
export function serializeJsonLd(value) {
  const json = JSON.stringify(value);
  if (json === undefined) throw new TypeError("JSON-LD must be JSON serializable");
  return json.replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Build-time/SSR snippet: a visible attribution link and its matching identity. */
export function renderPublisherHtml(identity, { locale, nonce } = {}) {
  const { organization, link } = buildPublisher(identity, { locale });
  const nonceAttribute = nonce === undefined ? "" : ` nonce="${escapeHtml(nonce)}"`;
  return `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>\n<script type="application/ld+json"${nonceAttribute}>${serializeJsonLd(organization)}</script>`;
}
