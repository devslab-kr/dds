/**
 * Docs ↔ tokens drift check (backlog P1-1 "문서·토큰 값 불일치 검사").
 *
 * CLAUDE.md: the spec docs and preview mirror the token JSON by hand, so the
 * places most likely to rot are checked mechanically:
 *
 *   1. design-system.md + design-system.ko.md contain every brand/neutral hex,
 *      the documented status anchors (50/500/700) and the alpha values.
 *   2. preview/index.html contains every brand/neutral hex, and the resolved
 *      light AND dark hex of every semantic color token.
 *
 * Coarse by design (presence, not table-cell position) — it catches "changed
 * the JSON, forgot a mirror", which is the failure mode we've actually had.
 * Non-color foundations (type scale, spacing…) are not checked; they change
 * far less often and have no reference syntax to drift.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (f) => JSON.parse(readFileSync(join(root, "tokens", f), "utf8"));
const readText = (f) => readFileSync(join(root, f), "utf8").toLowerCase();

const palette = readJson("palette.json").palette;
const light = readJson("semantic.light.json");
const dark = readJson("semantic.dark.json");

const resolveRef = (v) => {
  if (typeof v !== "string" || !v.startsWith("{")) return v;
  const path = v.slice(1, -1).split(".").slice(1); // drop leading "palette"
  let node = palette;
  for (const seg of path) node = node?.[seg];
  const out = node?.$value ?? node;
  if (typeof out !== "string") throw new Error(`Unresolvable reference ${v}`);
  return out;
};

const leaves = (node, path = []) =>
  Object.entries(node).flatMap(([k, v]) => {
    if (k.startsWith("$")) return [];
    return v && typeof v === "object" && "$value" in v
      ? [[[...path, k].join("."), v.$value]]
      : leaves(v, [...path, k]);
  });

const docs = {
  "docs/design-system.md": readText("docs/design-system.md"),
  "docs/design-system.ko.md": readText("docs/design-system.ko.md"),
};
const preview = readText("preview/index.html");
const errors = [];
const expectIn = (text, file, hex, label) => {
  if (!text.includes(hex.toLowerCase())) errors.push(`${file}: missing ${hex} (${label})`);
};

// 1. Docs: full brand/neutral scales, status anchors, alpha values.
const docHexes = [];
for (const scale of ["cyan", "zinc"])
  for (const [step, t] of Object.entries(palette[scale]))
    docHexes.push([t.$value, `palette.${scale}.${step}`]);
for (const scale of ["red", "amber", "green", "blue"])
  for (const step of ["50", "500", "700"])
    docHexes.push([palette[scale][step].$value, `palette.${scale}.${step} (anchor)`]);
for (const [name, t] of Object.entries(palette.alpha))
  docHexes.push([t.$value, `palette.alpha.${name}`]);
for (const [file, text] of Object.entries(docs))
  for (const [hex, label] of docHexes) expectIn(text, file, hex, label);

// 2. Preview: brand/neutral scales + every semantic color, both themes resolved.
for (const scale of ["cyan", "zinc"])
  for (const [step, t] of Object.entries(palette[scale]))
    expectIn(preview, "preview/index.html", t.$value, `palette.${scale}.${step}`);
for (const [theme, tree] of [["light", light], ["dark", dark]])
  for (const [path, value] of leaves(tree.color, ["color"]))
    expectIn(preview, "preview/index.html", resolveRef(value), `${path} (${theme})`);

if (errors.length) {
  console.error(`Docs/tokens sync check failed (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("docs sync: design-system.md / .ko.md / preview/index.html match tokens/*.json");
