import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solid({ hot: false })],
  test: {
    pool: process.platform === "win32" ? "threads" : "forks",
    maxWorkers: 2,
    environment: "jsdom",
    include: ["src/__tests__/a11y.test.tsx", "src/__tests__/primitives.test.tsx"],
    globals: false,
    restoreMocks: true,
    setupFiles: ["src/__tests__/setup.ts"],
  },
});
