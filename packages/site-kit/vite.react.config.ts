import { defineConfig, type Plugin } from "vite";
import { fileURLToPath } from "node:url";

/**
 * `@devslab/site-kit/react` — built separately from the Solid entry, without
 * vite-plugin-solid (Vite's own TSX transform, React's automatic runtime).
 *
 * Three entries:
 *   - index.js: every component, one module, "use client" on its first line.
 *   - flag-bodies.js / flag-bodies.server.js: the browser stub and the server
 *     bodies behind `@devslab/site-kit/react/flag-bodies` (package.json picks
 *     one per export condition).
 *
 * index.js imports the bodies by that package name, not by a relative path,
 * so a consumer's bundler resolves it once per layer: a Next.js app's SSR
 * layer gets the bodies and writes the sprite, its browser layer gets the stub
 * and never carries ~115 KB of flags (D-020, D-045).
 */
const FLAG_BODIES = "@devslab/site-kit/react/flag-bodies";
const flagBodiesByName = (): Plugin => ({
  name: "site-kit-react-flag-bodies",
  enforce: "pre",
  resolveId(source, importer) {
    if (source === "./flag-bodies" && importer?.replaceAll("\\", "/").includes("/src/react/")) {
      return { id: FLAG_BODIES, external: true };
    }
    return null;
  },
});

export default defineConfig({
  plugins: [flagBodiesByName()],
  build: {
    outDir: "dist/react",
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: {
        index: fileURLToPath(new URL("./src/react/index.ts", import.meta.url)),
        "flag-bodies": fileURLToPath(new URL("./src/react/flag-bodies.ts", import.meta.url)),
        "flag-bodies.server": fileURLToPath(new URL("./src/react/flag-bodies.server.ts", import.meta.url)),
      },
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      external: [/^react(?:\/|$)/, /^react-dom(?:\/|$)/, /^@devslab\//],
      output: {
        // The bodies the browser stub fetches on demand, at a stable name.
        chunkFileNames: "chunks/[name].js",
        banner: (chunk) => (chunk.name === "index" ? '"use client";' : ""),
      },
    },
  },
});
