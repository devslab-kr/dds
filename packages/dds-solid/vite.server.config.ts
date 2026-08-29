import solid from "vite-plugin-solid";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [solid({ ssr: true })],
  build: {
    ssr: "src/index.ts",
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      external: [/^solid-js(?:\/|$)/, /^@devslab-kr\//],
      output: { entryFileNames: "server.js" },
    },
  },
});
