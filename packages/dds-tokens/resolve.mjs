/**
 * Token graph resolver — shared by every generator that reads tokens/*.json
 * (the web build in ./build.mjs and scripts/generate-android-tokens.mjs).
 *
 * One resolver, not one per platform: two copies of the reference rules are
 * two chances for web and Android to disagree about what a token resolves to.
 */
import { readFileSync } from "node:fs";

/** Collect every `$value` leaf of the given parsed token documents and resolve `{a.b.c}` references. */
export function resolveTokenDocuments(documents) {
  const tokens = new Map();

  function collect(node, path = []) {
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith("$")) continue;
      const nextPath = [...path, key];
      if (value && typeof value === "object" && "$value" in value) {
        tokens.set(nextPath.join("."), { ...value, path: nextPath });
      } else if (value && typeof value === "object") {
        collect(value, nextPath);
      }
    }
  }

  for (const document of documents) collect(document);

  function resolvedValue(token, trail = []) {
    const value = token.$value;
    if (typeof value !== "string" || !/^\{[^}]+\}$/.test(value)) return value;
    const reference = value.slice(1, -1);
    if (trail.includes(reference)) throw new Error(`Circular token reference: ${[...trail, reference].join(" -> ")}`);
    const target = tokens.get(reference);
    if (!target) throw new Error(`Token reference not found: ${reference}`);
    return resolvedValue(target, [...trail, reference]);
  }

  return [...tokens.values()].map((token) => ({ ...token, $value: resolvedValue(token) }));
}

/** Read the given token files and resolve them as one graph. */
export function resolveTokens(sources) {
  return resolveTokenDocuments(sources.map((source) => JSON.parse(readFileSync(source, "utf8"))));
}
