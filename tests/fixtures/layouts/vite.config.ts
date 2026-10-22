import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import solid from "vite-plugin-solid";
import vue from "@vitejs/plugin-vue";
import { svelte } from "@sveltejs/vite-plugin-svelte";
export default defineConfig({
  plugins: [
    react({ include: /react\.tsx$/ }),
    solid({ include: /solid\.tsx$/, hot: false }),
    vue(),
    svelte({ configFile: "packages/dds-svelte/svelte.config.js" }),
  ],
  optimizeDeps: {
    noDiscovery: true,
    include: [
      "react",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },
  server: { host: "127.0.0.1", port: 5285, strictPort: true },
});
