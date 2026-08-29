import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solid({ hot: false })],
  test: {
    environment: "jsdom",
    include: ["src/__tests__/a11y.test.tsx", "src/__tests__/primitives.test.tsx"],
    globals: false,
    restoreMocks: true,
    setupFiles: [],
  },
});
