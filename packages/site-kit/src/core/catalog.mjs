import { LOCALES, canonicalLocale } from "./locales.mjs";

const placeholders = (message) => [...String(message).matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map((match) => match[1]).sort();
const difference = (left, right) => left.filter((value) => !right.includes(value));

export class CatalogValidationError extends Error {
  constructor(issues) {
    super(`Catalog validation failed:\n${issues.map((issue) => `- ${issue}`).join("\n")}`);
    this.name = "CatalogValidationError";
    this.issues = issues;
  }
}

export function validateCatalogs(catalogs, referenceLocale) {
  const reference = canonicalLocale(referenceLocale);
  if (!reference || !catalogs[reference]) throw new CatalogValidationError([`reference locale ${referenceLocale} is missing`]);
  const referenceKeys = Object.keys(catalogs[reference]).sort();
  const issues = [];
  for (const { code } of LOCALES) {
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
