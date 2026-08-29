import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";
export default defineConfig({
  plugins: [solid({ hot: false })],
  test: {
    environment: "jsdom",
    include: ["src/solid/__tests__/a11y.test.tsx", "src/solid/__tests__/shells.test.tsx"],
    restoreMocks: true,
  },
});
