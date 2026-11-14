import { defineConfig } from "vite";
export default defineConfig({
  esbuild: { jsx: "automatic" },
  optimizeDeps: { entries: ["login.html"] },
  build: { assetsInlineLimit: 0, rollupOptions: { input: "login.html" } },
});
