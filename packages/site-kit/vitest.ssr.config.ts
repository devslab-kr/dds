import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [solid({ ssr: true, hot: false })],
  resolve: {
    alias: {
      // The server carries the flag bodies; the browser build loads them on demand (src/solid/flag-bodies.ts).
      "./flag-bodies": fileURLToPath(new URL("./src/solid/flag-bodies.server.ts", import.meta.url)),
    },
  },

  test: {
    environment: "node",
    // Transform the DDS/Ark JSX chain with the SSR Solid compiler.
    server: { deps: { inline: [/\/@ark-ui\/solid\//, /\/@devslab\/dds-solid\//] } },
    include: ["src/solid/__tests__/ssr.test.tsx", "src/solid/__tests__/tanstack-head.ssr.test.tsx"],
    setupFiles: [],
  },
});
