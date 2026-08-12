/**
 * Token source validation (backlog P1-1 "JSON 스키마 검증").
 *
 * Structural schema for our W3C Design Tokens subset, plus the invariants
 * the format spec alone can't express:
 *   - every leaf has $value + $type, with a $type this pipeline knows
 *   - every {reference} resolves, and only semantic files may reference
 *   - semantic.light and semantic.dark define the *identical* token set
 *     (a token existing in one theme only is how `if (dark)` branches are born)
 *   - colors are valid hex; dimensions are non-negative numbers
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const tokensDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "tokens");
const read = (f) => JSON.parse(readFileSync(join(tokensDir, f), "utf8"));

const KNOWN_TYPES = new Set([
  "color", "dimension", "fontFamily", "typography", "shadow", "duration", "cubicBezier",
]);
const HEX_RE = /^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/;
const errors = [];

function walk(node, path, file, leaves) {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    const p = [...path, key];
    if (value === null || typeof value !== "object") {
      errors.push(`${file}: ${p.join(".")} is a bare value — leaves need { $value, $type }`);
      continue;
    }
    if ("$value" in value) {
      const type = value.$type;
      if (!type) errors.push(`${file}: ${p.join(".")} has $value but no $type`);
      else if (!KNOWN_TYPES.has(type)) errors.push(`${file}: ${p.join(".")} has unknown $type "${type}"`);
      leaves.set(p.join("."), { ...value, file });
    } else {
      walk(value, p, file, leaves);
    }
  }
}

const files = {
  "palette.json": read("palette.json"),
  "foundation.json": read("foundation.json"),
  "semantic.light.json": read("semantic.light.json"),
  "semantic.dark.json": read("semantic.dark.json"),
};
const leavesByFile = {};
const allLeaves = new Map();
for (const [file, json] of Object.entries(files)) {
  const leaves = new Map();
  walk(json, [], file, leaves);
  leavesByFile[file] = leaves;
  for (const [k, v] of leaves) allLeaves.set(k, v); // light/dark share paths by design
}

// References: {palette.x.y} must resolve; only semantic files may reference.
const paletteLeaves = leavesByFile["palette.json"];
for (const [path, leaf] of allLeaves) {
  const v = leaf.$value;
  if (typeof v !== "string" || !v.startsWith("{")) continue;
  if (!leaf.file.startsWith("semantic.")) {
    errors.push(`${leaf.file}: ${path} uses a reference — only semantic mappings may reference`);
  }
  const target = v.slice(1, -1);
  if (!paletteLeaves.has(target)) {
    errors.push(`${leaf.file}: ${path} references "{${target}}" which does not exist in palette.json`);
  }
}

// Theme parity: identical key sets.
const lightKeys = [...leavesByFile["semantic.light.json"].keys()];
const darkKeys = new Set(leavesByFile["semantic.dark.json"].keys());
for (const k of lightKeys) if (!darkKeys.has(k)) errors.push(`semantic.dark.json is missing ${k}`);
for (const k of darkKeys) if (!lightKeys.includes(k)) errors.push(`semantic.light.json is missing ${k}`);

// Value shapes.
for (const [path, leaf] of allLeaves) {
  const v = leaf.$value;
  switch (leaf.$type) {
    case "color":
      if (typeof v === "string" && !v.startsWith("{") && !HEX_RE.test(v.toLowerCase()))
        errors.push(`${leaf.file}: ${path} color "${v}" is not 6/8-digit hex`);
      break;
    case "dimension":
      if (typeof v !== "number" || v < 0)
        errors.push(`${leaf.file}: ${path} dimension must be a non-negative number, got ${JSON.stringify(v)}`);
      break;
    case "typography":
      for (const req of ["fontSize", "lineHeight", "fontWeight"])
        if (typeof v?.[req] !== "number")
          errors.push(`${leaf.file}: ${path} typography needs numeric ${req}`);
      break;
    case "shadow":
      if (typeof v?.web !== "string" || typeof v?.androidElevation !== "number" || typeof v?.ios !== "object")
        errors.push(`${leaf.file}: ${path} shadow needs { web, androidElevation, ios }`);
      break;
    case "cubicBezier":
      if (!Array.isArray(v) || v.length !== 4 || v.some((n) => typeof n !== "number"))
        errors.push(`${leaf.file}: ${path} cubicBezier must be 4 numbers`);
      break;
    case "duration":
      if (typeof v !== "string" || !/^\d+ms$/.test(v))
        errors.push(`${leaf.file}: ${path} duration must look like "200ms"`);
      break;
  }
}

if (errors.length) {
  console.error(`Token validation failed (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`dds-tokens: ${allLeaves.size} token paths validated, light/dark parity OK`);
