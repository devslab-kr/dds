import solid from "vite-plugin-solid";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [solid({ ssr: true })],
  build: {
    lib: { entry: "src/solid/index.ts", formats: ["es"], fileName: "solid" },
    sourcemap: true,
    rollupOptions: { external: [/^solid-js(?:\/|$)/, /^@solidjs\/web(?:\/|$)/, /^@devslab-kr\//] },
  },
});
