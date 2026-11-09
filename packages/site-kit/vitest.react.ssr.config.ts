import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      // The server carries the flag bodies, as the `node` export condition does for a consumer.
      "./flag-bodies": fileURLToPath(new URL("./src/react/flag-bodies.server.ts", import.meta.url)),
      "@devslab/site-kit/flags": fileURLToPath(new URL("./src/core/flags.mjs", import.meta.url)),
      "@devslab/site-kit": fileURLToPath(new URL("./src/core/index.mjs", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/react/__tests__/*.ssr.test.tsx"],
  },
});
