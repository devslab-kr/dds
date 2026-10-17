import solid from "vite-plugin-solid";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [solid({ ssr: true })],
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
        input: "src/input.tsx",
        combobox: "src/combobox.tsx",
        "select-picker": "src/select-picker.tsx",
        "dropdown-menu": "src/dropdown-menu.tsx",
        popover: "src/popover.tsx",
        calendar: "src/calendar.tsx",
        "date-picker": "src/date-picker.tsx",
      },
      formats: ["es"],
      fileName: (_format, name) => name + ".js",
    },
    sourcemap: true,
    rollupOptions: {
      external: [
        /^solid-js(?:\/|$)/,
        /^@solidjs\/web(?:\/|$)/,
        /^@devslab\//,
        /^@ark-ui\//,
        /^@zag-js\//,
        /^@tanstack\//,
      ],
    },
  },
});
