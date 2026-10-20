import { defineConfig } from "vite";
export default defineConfig({
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
