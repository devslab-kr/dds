import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "react.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:5276",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm --filter @devslab/react-canary dev",
    url: "http://127.0.0.1:5276",
    reuseExistingServer: false,
    timeout: 60000,
  },
});
