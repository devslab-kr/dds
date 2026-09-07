import solid from "vite-plugin-solid";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [solid({ ssr: true })],
  build: {
    lib: { entry: "src/solid/index.ts", formats: ["es"], fileName: "solid" },
    sourcemap: true,
    rollupOptions: {
      external: [/^solid-js(?:\/|$)/, /^@solidjs\/web(?:\/|$)/, /^@devslab\//],
      // The flag bodies are the only dynamic import; a stable name keeps the
      // chunk addressable by the bundle gate and by anyone reading dist/.
      output: { chunkFileNames: "[name].js" },
    },
  },
});
