/**
 * Bundles a fixtures/<name>/main.tsx page into one ES module string for the
 * browser tests (tests/browser/site-kit-consent.spec.ts, site-kit.spec.ts), with the
 * consumer's toolchain (Vite + vite-plugin-solid) against the built dist/ —
 * the same way check-client-bundle.mjs builds its probes. Nothing is written
 * to disk. Run after `pnpm build`.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import solid from "vite-plugin-solid";

const pkg = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Bundles fixtures/<name>/main.tsx (consent-page, anchor-page). */
export async function buildFixture(name) {
  const fixture = join(pkg, "fixtures", name);
  const result = await build({
    configFile: false,
    logLevel: "warn",
    root: fixture,
    plugins: [solid()],
    resolve: {
      alias: [
        { find: /^@devslab\/site-kit\/solid$/, replacement: join(pkg, "dist", "solid.js") },
        { find: /^@devslab\/site-kit$/, replacement: join(pkg, "src", "core", "index.mjs") },
      ],
    },
    build: {
      write: false,
      minify: false,
      sourcemap: false,
      rollupOptions: { input: join(fixture, "main.tsx"), output: { format: "es", codeSplitting: false } },
    },
  });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap((entry) => entry.output);
  const entry = outputs.find((chunk) => chunk.type === "chunk" && chunk.isEntry);
  if (!entry) throw new Error(`${name} fixture: no entry chunk`);
  return entry.code;
}

export const buildConsentFixture = () => buildFixture("consent-page");
