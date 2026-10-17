import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "components.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  reporter: "line",
  timeout: 30000,
  use: { headless: true, trace: "retain-on-failure" },
  webServer: [
    {
      command:
        "pnpm exec vite --config tests/fixtures/components/vite.react.config.ts",
      url: "http://127.0.0.1:5281",
      reuseExistingServer: false,
      timeout: 60000,
    },
    {
      command:
        "pnpm exec vite --config tests/fixtures/components/vite.solid.config.ts",
      url: "http://127.0.0.1:5282",
      reuseExistingServer: false,
      timeout: 60000,
    },
  ],
});
