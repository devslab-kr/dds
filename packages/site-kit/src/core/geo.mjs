const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const schemaClaims = new Map([
  ["Organization", new Set(["description", "sameAs", "contactPoint", "areaServed"])],
  ["WebSite", new Set(["description", "inLanguage", "publisher"])],
  ["SoftwareApplication", new Set(["description", "applicationCategory", "operatingSystem", "featureList", "offers"])],
  ["Product", new Set(["description", "category", "brand", "offers"])],
  ["BreadcrumbList", new Set(["itemListElement"])],
  ["FAQPage", new Set(["mainEntity"])],
  ["TechArticle", new Set(["headline", "description", "datePublished", "dateModified", "author", "about"])],
]);

export class VerifiedFactRegistry {
  #facts = new Map();
  #now;

  constructor(facts, { now = new Date().toISOString().slice(0, 10) } = {}) {
    if (!isoDate.test(now)) throw new TypeError("now must be YYYY-MM-DD");
    this.#now = now;
    for (const fact of facts) {
      if (!fact?.id || this.#facts.has(fact.id)) throw new Error(`Duplicate or missing fact id: ${fact?.id}`);
      if (typeof fact.value !== "string" || !fact.value.trim()) throw new Error(`Fact ${fact.id} has no value`);
      if (!String(fact.sourceUrl).startsWith("https://")) throw new Error(`Fact ${fact.id} requires an HTTPS sourceUrl`);
      if (!isoDate.test(fact.verifiedAt) || fact.verifiedAt > this.#now) throw new Error(`Fact ${fact.id} has an invalid verifiedAt date`);
      if (fact.expiresAt && (!isoDate.test(fact.expiresAt) || fact.expiresAt < this.#now)) throw new Error(`Fact ${fact.id} is expired`);
      this.#facts.set(fact.id, Object.freeze({ ...fact }));
    }
  }

  get(id) {
    const fact = this.#facts.get(id);
    if (!fact) throw new Error(`Unverified fact: ${id}`);
    return fact;
  }

  all() { return [...this.#facts.values()]; }
}

function resolveClaim(value, registry) {
  if (Array.isArray(value)) return value.map((entry) => resolveClaim(entry, registry));
  if (value && typeof value === "object" && Object.keys(value).length === 1 && "factId" in value) return registry.get(value.factId).value;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, resolveClaim(entry, registry)]));
  throw new TypeError("GEO claims must reference a verified factId; literal claims are forbidden");
}

export function buildVerifiedJsonLd({ type, id, identity, claims = {} }, registry) {
  if (!(registry instanceof VerifiedFactRegistry)) throw new TypeError("A VerifiedFactRegistry is required");
  if (!type || !id || !identity?.name || !identity?.url) throw new TypeError("Schema type, id, identity.name, and identity.url are required");
  const allowedClaims = schemaClaims.get(type);
  if (!allowedClaims) throw new TypeError(`Unsupported schema type: ${type}`);
  for (const claim of Object.keys(claims)) {
    if (!allowedClaims.has(claim)) throw new TypeError(`Unsupported claim ${claim} for schema type ${type}`);
  }
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": id,
    name: identity.name,
    url: identity.url,
    ...(identity.logo ? { logo: identity.logo } : {}),
    ...Object.fromEntries(Object.entries(claims).map(([key, value]) => [key, resolveClaim(value, registry)])),
  };
}

export function renderLlmsTxt({ title, summary, canonicalUrl, facts }) {
  if (!(facts instanceof VerifiedFactRegistry)) throw new TypeError("facts must be a VerifiedFactRegistry");
  const lines = [`# ${title}`, "", `> ${summary}`, "", `Canonical: ${canonicalUrl}`, "", "## Verified facts", ""];
  for (const fact of facts.all()) lines.push(`- ${fact.value} (source: ${fact.sourceUrl}; verified: ${fact.verifiedAt})`);
  return `${lines.join("\n")}\n`;
}
