import { cloudflare } from "@cloudflare/vite-plugin";
import solid from "vite-plugin-solid";
import { tanstackStart } from "@tanstack/solid-start/plugin/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart({ srcDirectory: "src" }),
    solid({ ssr: true }),
  ],
});
