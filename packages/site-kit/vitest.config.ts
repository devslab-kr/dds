import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  plugins: [solid({ hot: false })],
  resolve: {
    alias: {
      "@devslab/dds-solid": fileURLToPath(new URL("../dds-solid/src/index.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    // The DDS source alias reaches Ark's browser JSX; keep it in Vite's
    // Solid transformation pipeline instead of handing .jsx to Node.
    server: { deps: { inline: [/\/@ark-ui\/solid\//] } },
    include: [
      "src/solid/__tests__/a11y.test.tsx",
      "src/solid/__tests__/locale-menu.test.tsx",
      "src/solid/__tests__/shells.test.tsx",
      "src/solid/__tests__/oss-product-mark.test.tsx",
      "src/solid/__tests__/sections.test.tsx",
      "src/solid/__tests__/footer.test.tsx",
      "src/solid/__tests__/landing-chrome.test.tsx",
      "src/solid/__tests__/consent.test.tsx",
    ],
    restoreMocks: true,
  },
});
