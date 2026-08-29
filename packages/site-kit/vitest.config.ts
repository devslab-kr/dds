import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  plugins: [solid({ hot: false })],
  resolve: {
    alias: {
      "@devslab-kr/dds-solid": fileURLToPath(new URL("../dds-solid/src/index.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/solid/__tests__/a11y.test.tsx", "src/solid/__tests__/shells.test.tsx"],
    restoreMocks: true,
  },
});
