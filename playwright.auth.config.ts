import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "auth.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:5277",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "pnpm --filter @devslab/react-canary exec vite --config vite.auth.config.ts --host 127.0.0.1 --port 5277 --strictPort",
    url: "http://127.0.0.1:5277/login.html",
    reuseExistingServer: false,
    timeout: 60000,
  },
});
