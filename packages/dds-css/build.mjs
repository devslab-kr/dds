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
export const FILES = [
  "base.css",
  "button.css",
  "textfield.css",
  "badge.css",
  "spinner.css",
  "skeleton.css",
  "dialog.css",
  "toast.css",
];

const banner = `/* @devslab-kr/dds-css — generated bundle, do not edit. Source: src/*.css
 * Requires @devslab-kr/dds-tokens/tokens.css to be loaded first. */
`;

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  mkdirSync(join(pkgDir, "dist", "components"), { recursive: true });
  const parts = FILES.map((f) => readFileSync(join(pkgDir, "src", f), "utf8"));
  writeFileSync(join(pkgDir, "dist", "dds.css"), banner + "\n" + parts.join("\n"));
  for (const f of FILES) copyFileSync(join(pkgDir, "src", f), join(pkgDir, "dist", "components", f));
  console.log(`dds-css: bundled ${FILES.length} files into dist/dds.css (+ dist/components/)`);
}
