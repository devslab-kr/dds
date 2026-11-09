import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// React components in jsdom. No Solid plugin here: Vite's own TSX transform,
// React's automatic runtime (tsconfig.react.json). `./flag-bodies` stays the
// browser stub, so these tests take the no-server-HTML path that fetches the
// bodies — the hydrated path is tests/site-kit-react-hydration.test.mjs.
export default defineConfig({
  resolve: {
    alias: {
      "@devslab/site-kit/flags": fileURLToPath(new URL("./src/core/flags.mjs", import.meta.url)),
      "@devslab/site-kit": fileURLToPath(new URL("./src/core/index.mjs", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/react/__tests__/*.test.tsx"],
    exclude: ["src/react/__tests__/*.ssr.test.tsx"],
    restoreMocks: true,
  },
});
