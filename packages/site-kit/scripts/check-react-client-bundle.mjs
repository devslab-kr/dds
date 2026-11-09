/**
 * What a consumer's browser bundle keeps from `@devslab/site-kit/react`.
 *
 * The React twin of check-client-bundle.mjs (D-020, D-045). Builds
 * fixtures/react-bundle-probe with Vite against the freshly built dist/react,
 * resolving `@devslab/site-kit/react/flag-bodies` to the file package.json's
 * `browser` condition names — so a wrong mapping in package.json fails here,
 * not in a product's build output.
 *
 * Gates:
 *   1. The browser condition maps the bodies subpath to the stub, and every
 *      server condition maps it to the file that carries them.
 *   2. No flag body reaches the header-only main chunk.
 *   3. The header-only main chunk (site-kit's part, React itself left out)
 *      stays under a budget.
 *   4. The bodies are still reachable as a separate chunk for client-only renders.
 *
 * Run after `pnpm build` — it reads dist/react, not the sources.
 */
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "vite";

const pkg = join(dirname(fileURLToPath(import.meta.url)), "..");
const probe = join(pkg, "fixtures", "react-bundle-probe");
const manifest = JSON.parse(readFileSync(join(pkg, "package.json"), "utf8"));
const HEADER_ONLY_BUDGET = 24 * 1024;

const failures = [];
const subpath = manifest.exports["./react/flag-bodies"];
const conditionTarget = (conditions) => Object.entries(subpath).find(([key]) => conditions.includes(key))?.[1];
const browserTarget = conditionTarget(["browser", "import", "default"]);
if (browserTarget !== "./dist/react/flag-bodies.js") failures.push(`browser bundlers resolve the bodies subpath to ${browserTarget}, not the stub`);
for (const [layer, conditions] of Object.entries({
  "Node SSR": ["node", "import", "default"],
  "React Server Components": ["react-server", "node", "import", "default"],
  "Next.js edge": ["edge-light", "worker", "browser", "import", "default"],
  "Cloudflare Workers": ["workerd", "worker", "browser", "import", "default"],
})) {
  const target = conditionTarget(conditions);
  if (target !== "./dist/react/flag-bodies.server.js") failures.push(`${layer} resolves the bodies subpath to ${target}, so the server would write an empty sprite`);
}

const bodies = (await import(pathToFileURL(join(pkg, "src", "core", "flag-bodies.mjs")).href)).FLAGS_BY_COUNTRY;
const bodyMarkers = Object.values(bodies).map((flag) => flag.body.slice(0, 60));
const work = mkdtempSync(join(tmpdir(), "site-kit-react-probe-"));

async function bundle(entry) {
  const outDir = join(work, entry);
  await build({
    configFile: false,
    logLevel: "warn",
    root: probe,
    resolve: {
      alias: [
        { find: /^@devslab\/site-kit\/react\/flag-bodies$/, replacement: join(pkg, browserTarget) },
        { find: /^@devslab\/site-kit\/react$/, replacement: join(pkg, "dist", "react", "index.js") },
      ],
    },
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    build: {
      outDir,
      emptyOutDir: true,
      minify: true,
      sourcemap: false,
      rollupOptions: {
        input: join(probe, `${entry}.js`),
        // React itself is the consumer's cost either way; measure site-kit's share.
        external: [/^react(?:\/|$)/, /^react-dom(?:\/|$)/],
        output: { entryFileNames: "main.js" },
      },
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

try {
  const headerOnly = await bundle("header-only");
  const everything = await bundle("everything");
  if (bodyMarkers.some((marker) => headerOnly.main.source.includes(marker))) failures.push("a flag body is in the header-only main chunk");
  if (headerOnly.main.source.length > HEADER_ONLY_BUDGET) failures.push(`header-only main chunk is ${headerOnly.main.source.length} bytes, over the ${HEADER_ONLY_BUDGET} byte budget`);
  if (bodyMarkers.some((marker) => everything.main.source.includes(marker))) failures.push("a flag body is in the everything main chunk");
  const lazyFlags = headerOnly.chunks.find((chunk) => bodyMarkers.every((marker) => chunk.source.includes(marker)));
  if (!lazyFlags) failures.push("the flag bodies must still be reachable as a separate chunk for client-only renders");
  console.log(`site-kit react client bundle: header-only ${size(headerOnly.main.source)}, everything ${size(everything.main.source)}` +
    (lazyFlags ? `, flag chunk ${size(lazyFlags.source)} (fetched only without server HTML)` : ""));
} finally {
  rmSync(work, { recursive: true, force: true });
}
if (failures.length) {
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}
