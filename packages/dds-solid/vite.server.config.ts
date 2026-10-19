import solid from "vite-plugin-solid";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [solid({ ssr: true })],
  build: {
    ssr: true,
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      input: {
        server: "src/index.ts",
        "input.server": "src/input.tsx",
        "combobox.server": "src/combobox.tsx",
        "select-picker.server": "src/select-picker.tsx",
        "dropdown-menu.server": "src/dropdown-menu.tsx",
        "popover.server": "src/popover.tsx",
        "calendar.server": "src/calendar.tsx",
        "date-picker.server": "src/date-picker.tsx",
        "time-picker.server": "src/time-picker.tsx",
        "segmented-control.server": "src/segmented-control.tsx",
        "number-input.server": "src/number-input.tsx",
      },
      external: [
        /^solid-js(?:\/|$)/,
        /^@solidjs\/web(?:\/|$)/,
        /^@devslab\//,
        /^@ark-ui\//,
        /^@zag-js\//,
        /^@tanstack\//,
      ],
      output: { entryFileNames: "[name].js" },
    },
  },
});
