import solid from "vite-plugin-solid";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [solid({ ssr: true })],
  resolve: {
    alias: {
      // The server carries the flag bodies; the browser build loads them on demand (src/solid/flag-bodies.ts).
      "./flag-bodies": fileURLToPath(new URL("./src/solid/flag-bodies.server.ts", import.meta.url)),
    },
  },
  build: {
    ssr: "src/solid/index.ts",
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      external: [/^solid-js(?:\/|$)/, /^@devslab\//],
      output: { entryFileNames: "solid.server.js" },
    },
  },
});
