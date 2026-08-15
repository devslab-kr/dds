/**
 * dds-icons guard — the set's geometry contract, enforced mechanically
 * (spec §3.7 as amended by D-013):
 *
 *   - 24 grid: viewBox "0 0 24 24", width/height 24
 *   - color comes from the consumer: fill="none", stroke="currentColor",
 *     and no color literal anywhere in the file
 *   - round caps and joins (the set's drawing style)
 *   - stroke width is the set's: 1.6 core, 1.8 site (a third value means
 *     someone dropped in an icon from elsewhere)
 *   - name is function-shaped: lowercase kebab, no size/color in the name
 *   - stroke/fill/style overrides inside the body would break currentColor
 *
 * Also checks the built artifacts contain every source icon (drift guard).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readIcons } from "../build.mjs";

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const icons = readIcons();

const STROKE_BY_SET = { core: "1.6", site: "1.8" };
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;

for (const icon of icons) {
  const at = (msg) => errors.push(`${icon.rel}: ${msg}`);
  const a = icon.attrs;
  if (a.viewBox !== "0 0 24 24") at(`viewBox is "${a.viewBox}", expected "0 0 24 24"`);
  if (a.width !== "24" || a.height !== "24") at(`width/height are ${a.width}/${a.height}, expected 24/24`);
  if (a.fill !== "none") at(`fill is "${a.fill}", expected "none"`);
  if (a.stroke !== "currentColor") at(`stroke is "${a.stroke}", expected "currentColor"`);
  if (a["stroke-linecap"] !== "round" || a["stroke-linejoin"] !== "round") at("stroke-linecap/linejoin must be round");
  if (a["stroke-width"] !== STROKE_BY_SET[icon.set])
    at(`stroke-width is ${a["stroke-width"]}, expected ${STROKE_BY_SET[icon.set]} for the ${icon.set} set`);
  if (!NAME_RE.test(icon.name)) at("name must be lowercase kebab-case (function-variant, spec §3.7)");
  if (icon.set === "site" && !icon.name.startsWith("site-")) at("site-set icons keep the site- prefix");
  if (icon.set === "core" && icon.name.startsWith("site-")) at("site- prefixed icon belongs in svg/site/");
  if (COLOR_RE.test(readFileSync(icon.path, "utf8"))) at("contains a color literal — icons inherit currentColor");
  if (/\b(stroke|fill|style)=/.test(icon.body)) at("body overrides stroke/fill/style — inherit from the root instead");
  if (!icon.body.trim()) at("empty icon body");
}

const names = icons.map((i) => i.name);
const dupes = names.filter((n, i) => names.indexOf(n) !== i);
if (dupes.length) errors.push(`duplicate icon names across sets: ${[...new Set(dupes)].join(", ")}`);

let sprite;
let map;
try {
  sprite = readFileSync(join(pkgDir, "dist", "icons.svg"), "utf8");
  map = readFileSync(join(pkgDir, "dist", "icons.js"), "utf8");
} catch {
  errors.push("dist missing — run build before check");
}
if (sprite && map) {
  for (const icon of icons) {
    if (!sprite.includes(`id="dds-${icon.name}"`)) errors.push(`dist/icons.svg is stale: ${icon.name} missing`);
    if (!map.includes(`${JSON.stringify(icon.name)}:`)) errors.push(`dist/icons.js is stale: ${icon.name} missing`);
  }
}

if (errors.length) {
  console.error(`dds-icons check failed (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`dds-icons: ${icons.length} icons pass the §3.7 contract (24 grid, currentColor, round caps), dist in sync`);
