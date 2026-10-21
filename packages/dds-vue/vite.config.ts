import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: { entry: { index: 'src/index.ts', 'date-only': 'src/dateOnly.ts' }, formats: ['es'], cssFileName: 'dds-vue', fileName: (_format, name) => `${name}.js` },
    sourcemap: true,
    rollupOptions: { external: [/^vue(?:\/|$)/, /^@ark-ui\//, /^@devslab\//] }
  },
  test: { setupFiles: ['src/__tests__/setup.ts'], pool: 'threads', maxWorkers: 2, environment: 'jsdom', environmentOptions: { jsdom: { pretendToBeVisual: true } } }
})
