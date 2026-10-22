import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: { entry: { index: 'src/index.ts', 'date-only': 'src/dateOnly.ts', 'input': 'src/input.ts', 'combobox': 'src/combobox.ts', 'select-picker': 'src/select-picker.ts', 'dropdown-menu': 'src/dropdown-menu.ts', 'popover': 'src/popover.ts', 'calendar': 'src/calendar.ts', 'date-picker': 'src/date-picker.ts', 'date-range-picker': 'src/date-range-picker.ts', 'month-picker': 'src/month-picker.ts', 'time-picker': 'src/time-picker.ts', 'segmented-control': 'src/segmented-control.ts', 'number-input': 'src/number-input.ts' }, formats: ['es'], cssFileName: 'dds-vue', fileName: (_format, name) => `${name}.js` },
    sourcemap: true,
    rollupOptions: { external: [/^vue(?:\/|$)/, /^@ark-ui\//, /^@devslab\//] }
  },
  test: { setupFiles: ['src/__tests__/setup.ts'], pool: 'threads', maxWorkers: 2, environment: 'jsdom', environmentOptions: { jsdom: { pretendToBeVisual: true } } }
})
