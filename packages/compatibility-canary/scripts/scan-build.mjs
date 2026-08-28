import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { assertNoLikelySecrets } from "../src/canary-contracts.mjs";

const roots = ["dist", ".output"];
const textExtensions = new Set([".css", ".html", ".js", ".json", ".map", ".mjs", ".svg", ".txt", ".xml"]);
let scanned = 0;
async function walk(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const target = resolve(path, entry.name);
    if (entry.isDirectory()) await walk(target);
    else if (textExtensions.has(extname(entry.name))) { assertNoLikelySecrets(await readFile(target, "utf8"), target); scanned += 1; }
  }
}
for (const root of roots) {
  try { await walk(resolve(root)); } catch (error) { if (error.code !== "ENOENT") throw error; }
}
assert.ok(scanned > 0, "no text build artifacts were found to scan");
console.log(`scanned ${scanned} build artifacts for likely secrets`);
