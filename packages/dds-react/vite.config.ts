import { readFile } from "node:fs/promises";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    {
      name: "dds-react-usage-guides",
      async generateBundle() {
        for (const topic of [
          "toast",
          "components-input-choice-calendar",
          "layouts",
        ]) {
          for (const suffix of [".md", ".ko.md"]) {
            const filename = topic + suffix;
            const source = await readFile(
              new URL(`../../docs/${filename}`, import.meta.url),
            );
            this.emitFile({
              type: "asset",
              fileName: `docs/${filename}`,
              source,
            });
          }
        }
      },
    },
  ],
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
        input: "src/input.tsx",
        "otp-input": "src/otp-input.tsx",
        combobox: "src/combobox.tsx",
        "select-picker": "src/select-picker.tsx",
        "dropdown-menu": "src/dropdown-menu.tsx",
        popover: "src/popover.tsx",
        calendar: "src/calendar.tsx",
        "date-picker": "src/date-picker.tsx",
        "time-picker": "src/time-picker.tsx",
        "date-range-picker": "src/date-range-picker.tsx",
        "month-picker": "src/month-picker.tsx",
        "segmented-control": "src/segmented-control.tsx",
        "number-input": "src/number-input.tsx",
      },
      formats: ["es"],
      fileName: (_format, name) => name + ".js",
    },
    sourcemap: true,
    rollupOptions: {
      external: [
        /^react(?:\/|$)/,
        /^react-dom(?:\/|$)/,
        /^@devslab\//,
        /^@ark-ui\//,
        /^@zag-js\//,
        /^@tanstack\//,
      ],
    },
  },
});
