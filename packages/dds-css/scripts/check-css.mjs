/**
 * dds-css hardcoding guard (backlog P1-2 "토큰 CSS 변수만 참조 — 하드코딩 금지").
 *
 * Mechanical enforcement of spec §1/§3.1: component CSS may not carry its
 * own color values. Bans in src/*.css:
 *   - hex colors (#fff, #06b6d4, 8-digit alpha hex)
 *   - color functions: rgb()/rgba()/hsl()/hsla()/oklch()/color()/color-mix()
 *     (color-mix included — mixing is a semantic-token decision, not a
 *     component decision)
 *   - !important (a component that needs it is fighting its own tokens)
 * Also requires every component file to reference at least one var(--dds-*),
 * and the built dist/dds.css to contain every src file (bundle drift guard).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FILES } from "../build.mjs";

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

const BANNED = [
  [/#[0-9a-fA-F]{3,8}\b/, "hex color"],
  [/\brgba?\(/, "rgb()/rgba()"],
  [/\bhsla?\(/, "hsl()/hsla()"],
  [/\boklch\(/, "oklch()"],
  [/\bcolor\(/, "color()"],
  [/\bcolor-mix\(/, "color-mix()"],
  [/!important/, "!important"],
];

for (const file of FILES) {
  const text = readFileSync(join(pkgDir, "src", file), "utf8");
  text.split("\n").forEach((line, i) => {
    for (const [re, label] of BANNED) {
      if (re.test(line)) errors.push(`src/${file}:${i + 1} contains ${label}: ${line.trim()}`);
    }
  });
  if (file !== "base.css" && !text.includes("var(--dds-")) {
    errors.push(`src/${file} references no --dds-* token variables`);
  }
}

let bundle;
try {
  bundle = readFileSync(join(pkgDir, "dist", "dds.css"), "utf8");
} catch {
  errors.push("dist/dds.css missing — run build before check");
}
if (bundle) {
  for (const file of FILES) {
    const src = readFileSync(join(pkgDir, "src", file), "utf8").trim();
    if (!bundle.includes(src)) errors.push(`dist/dds.css is stale: src/${file} content not in bundle`);
  }
}

if (errors.length) {
  console.error(`dds-css check failed (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`dds-css: ${FILES.length} source files clean (no hardcoded colors), bundle in sync`);
