import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solid({ ssr: true, hot: false })],
  test: {
    pool: process.platform === "win32" ? "threads" : "forks",
    environment: "node",
    include: ["src/__tests__/ssr.test.tsx"],
    setupFiles: [],
  },
});
