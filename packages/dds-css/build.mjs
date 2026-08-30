/**
 * dds-css build — concatenates src/*.css in a fixed order into dist/dds.css
 * and copies each component file to dist/components/ for per-component
 * imports. No preprocessing: the source is the shipped CSS, so what review
 * sees is what consumers load.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const pkgDir = dirname(fileURLToPath(import.meta.url));

// Fixed order: base first; the rest is alphabetical-by-role and order-independent
// (every selector is namespaced, no cross-file overrides).
// Order follows the spec §4.3 v1 inventory (controls → inputs → indicators →
// surfaces → overlays), which is also the docs order.
export const FILES = [
  "base.css",
  "button.css",
  "iconbutton.css",
  "textfield.css",
  "textarea.css",
  "select.css",
  "checkbox-radio.css",
  "switch.css",
  "badge.css",
  "chip.css",
  "avatar.css",
  "spinner.css",
  "skeleton.css",
  "divider.css",
  "card.css",
  "listrow.css",
  "tabs.css",
  "dialog.css",
  "toast.css",
  "tooltip.css",
  "emptystate.css",
];

const banner = `/* @devslab/dds-css — generated bundle, do not edit. Source: src/*.css
 * Requires @devslab/dds-tokens/tokens.css to be loaded first. */
`;

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  mkdirSync(join(pkgDir, "dist", "components"), { recursive: true });
  const parts = FILES.map((f) => readFileSync(join(pkgDir, "src", f), "utf8"));
  writeFileSync(join(pkgDir, "dist", "dds.css"), banner + "\n" + parts.join("\n"));
  for (const f of FILES) copyFileSync(join(pkgDir, "src", f), join(pkgDir, "dist", "components", f));
  console.log(`dds-css: bundled ${FILES.length} files into dist/dds.css (+ dist/components/)`);
}
