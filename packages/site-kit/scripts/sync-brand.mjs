import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BRAND_ICON_FILES } from "../src/core/seo.mjs";

const publicDirectory = resolve(process.argv[2] ?? "public");
const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
mkdirSync(resolve(publicDirectory, "brand"), { recursive: true });
for (const file of [...BRAND_ICON_FILES, "mark.svg"])
  copyFileSync(resolve(packageDirectory, "brand", file), resolve(publicDirectory, "brand", file));
// Browser fallback and legacy product-brand references use the same master mark.
copyFileSync(resolve(packageDirectory, "brand/mark.svg"), resolve(publicDirectory, "brand.svg"));
copyFileSync(resolve(packageDirectory, "brand/favicon.ico"), resolve(publicDirectory, "favicon.ico"));
console.log("DDS shared brand icons synchronized.");
