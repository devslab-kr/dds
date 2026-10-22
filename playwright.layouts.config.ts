import { defineConfig } from "@playwright/test";
export default defineConfig({testDir:"./tests/browser",testMatch:"layouts.spec.ts",workers:1,retries:0,use:{baseURL:"http://127.0.0.1:5285",headless:true},webServer:{command:"pnpm exec vite --config tests/fixtures/layouts/vite.config.ts",url:"http://127.0.0.1:5285/tests/fixtures/layouts/index.html",reuseExistingServer:false}});
