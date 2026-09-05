import { FAMILY_LOCALES } from "./locales.mjs";

const placeholders = (message) => [...String(message).matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map((match) => match[1]).sort();
const difference = (left, right) => left.filter((value) => !right.includes(value));

export class CatalogValidationError extends Error {
  constructor(issues) {
    super(`Catalog validation failed:\n${issues.map((issue) => `- ${issue}`).join("\n")}`);
    this.name = "CatalogValidationError";
    this.issues = issues;
  }
}

/**
 * Every locale the site sells in must carry every key.
 *
 * `options.registry` says which locales those are. Omitted, it is the
 * family's fourteen — which is the right answer for a family site and the
 * wrong one for a product that added its own, because a catalog missing
 * six languages would validate clean.
 *
 * @param {object} catalogs
 * @param {string} referenceLocale
 * @param {{ registry?: { LOCALES: ReadonlyArray<{code: string}>, canonicalLocale: (c: string) => string | undefined } }} [options]
 */
export function validateCatalogs(catalogs, referenceLocale, options = {}) {
  const registry = options.registry ?? FAMILY_LOCALES;
  const reference = registry.canonicalLocale(referenceLocale);
  if (!reference || !catalogs[reference]) throw new CatalogValidationError([`reference locale ${referenceLocale} is missing`]);
  const referenceKeys = Object.keys(catalogs[reference]).sort();
  const issues = [];
  for (const { code } of registry.LOCALES) {
    const catalog = catalogs[code];
    if (!catalog) { issues.push(`missing locale ${code}`); continue; }
    const keys = Object.keys(catalog).sort();
    for (const key of difference(referenceKeys, keys)) issues.push(`${code} missing key ${key}`);
    for (const key of difference(keys, referenceKeys)) issues.push(`${code} extra key ${key}`);
    for (const key of referenceKeys.filter((candidate) => candidate in catalog)) {
      if (typeof catalog[key] !== "string") { issues.push(`${code} key ${key} is not a string`); continue; }
      const expected = placeholders(catalogs[reference][key]);
      const actual = placeholders(catalog[key]);
      if (expected.join("|") !== actual.join("|")) issues.push(`${code} placeholder mismatch for ${key}: expected ${expected.join(",")}; received ${actual.join(",")}`);
    }
  }
  if (issues.length) throw new CatalogValidationError(issues);
  return true;
}

export function createTranslator(catalog, locale) {
  return (key, values = {}) => {
    const message = catalog[key];
    if (typeof message !== "string") throw new Error(`Missing translation ${locale}:${key}; runtime fallback is disabled`);
    const required = placeholders(message);
    for (const name of required) if (!(name in values)) throw new Error(`Missing placeholder ${name} for ${locale}:${key}`);
    for (const name of Object.keys(values)) if (!required.includes(name)) throw new Error(`Extra placeholder ${name} for ${locale}:${key}`);
    return message.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (_, name) => String(values[name]));
  };
}
