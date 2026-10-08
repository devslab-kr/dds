import solid from "vite-plugin-solid";
import { defineConfig } from "vite";
export default defineConfig({
  root: "ark-preview",
  plugins: [solid()],
  server: { host: "127.0.0.1", port: 4179, strictPort: true },
});
