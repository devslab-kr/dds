import solid from "@solidjs/vite-plugin";
import { defineConfig } from "vitest/config";
export default defineConfig({ plugins: [solid({ ssr: true })], test: { environment: "jsdom", restoreMocks: true } });
