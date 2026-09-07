/**
 * What a consumer's browser bundle keeps from `@devslab/site-kit/solid`.
 *
 * Builds fixtures/bundle-probe with the consumer's own toolchain (Vite +
 * vite-plugin-solid, the one every product uses) against the freshly built
 * dist/, then reads the output the way a product would ship it:
 *
 *   - `header-only`: imports SiteHeader and nothing else.
 *   - `everything`: imports every export and keeps it reachable.
 *
 * Gates:
 *   1. No flag body reaches the header-only main chunk. The fourteen
 *      vendored SVGs are ~115 KB — Spain alone is 85 KB — and they used to
 *      ride along with every header because LocaleMenu imported them
 *      statically. They now live in a chunk the browser only fetches when a
 *      flag menu renders without server HTML.
 *   2. The header-only main chunk stays under a budget, so a future import
 *      that drags the bodies (or anything of that size) back in fails here
 *      rather than in a product's build output.
 *   3. `everything` is larger than `header-only`: the unused components are
 *      actually dropped, not merely small.
 *
 * Run after `pnpm build` — it reads dist/solid.js, not the sources.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "vite";
import solid from "vite-plugin-solid";

const pkg = join(dirname(fileURLToPath(import.meta.url)), "..");
const probe = join(pkg, "fixtures", "bundle-probe");
const dist = join(pkg, "dist");
const HEADER_ONLY_BUDGET = 48 * 1024;

const bodies = (await import(pathToFileURL(join(pkg, "src", "core", "flag-bodies.mjs")).href)).FLAGS_BY_COUNTRY;
const bodyMarkers = Object.values(bodies).map((flag) => flag.body.slice(0, 60));

async function bundle(entry) {
  const outDir = join(probe, "out", entry);
  await build({
    configFile: false,
    logLevel: "warn",
    root: probe,
    plugins: [solid()],
    resolve: { alias: { "@devslab/site-kit/solid": join(dist, "solid.js") } },
    build: {
      outDir,
      emptyOutDir: true,
      minify: true,
      sourcemap: false,
      rollupOptions: { input: join(probe, `${entry}.tsx`), output: { entryFileNames: "main.js" } },
    },
  });
  const files = readdirSync(outDir, { recursive: true })
    .map((name) => join(outDir, String(name)))
    .filter((path) => statSync(path).isFile() && path.endsWith(".js"))
    .map((path) => ({ path, source: readFileSync(path, "utf8") }));
  const main = files.find((file) => file.path.endsWith("main.js"));
  if (!main) throw new Error(`${entry}: no main.js in ${outDir}`);
  return { main, chunks: files.filter((file) => file !== main) };
}

const size = (source) => `${(source.length / 1024).toFixed(1)} kB (gzip ${(gzipSync(source).length / 1024).toFixed(1)} kB)`;

const headerOnly = await bundle("header-only");
const everything = await bundle("everything");
const failures = [];

for (const marker of bodyMarkers) {
  if (headerOnly.main.source.includes(marker)) {
    failures.push(`a flag body is back in the header-only main chunk (starts ${JSON.stringify(marker.slice(0, 30))})`);
    break;
  }
}
if (headerOnly.main.source.length > HEADER_ONLY_BUDGET) {
  failures.push(`header-only main chunk is ${headerOnly.main.source.length} bytes, over the ${HEADER_ONLY_BUDGET} byte budget`);
}
if (!(everything.main.source.length > headerOnly.main.source.length)) {
  failures.push("importing every export did not grow the bundle — unused components are not being dropped");
}
const lazyFlags = headerOnly.chunks.find((chunk) => bodyMarkers.every((marker) => chunk.source.includes(marker)));
if (!lazyFlags) failures.push("the flag bodies must still be reachable as a separate chunk for client-only renders");

console.log(`site-kit client bundle: header-only ${size(headerOnly.main.source)}, everything ${size(everything.main.source)}` +
  (lazyFlags ? `, flag chunk ${size(lazyFlags.source)} (fetched only without server HTML)` : ""));
if (failures.length) {
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}
