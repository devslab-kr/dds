import { defineConfig } from 'vite'
import vue from '../../../packages/dds-vue/node_modules/@vitejs/plugin-vue/dist/index.mjs'
import { fileURLToPath } from 'node:url'
const root = new URL('../../../', import.meta.url)
const path = (file: string) => fileURLToPath(new URL(file, root))
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [vue()],
  resolve: { alias: [
    { find: /^vue$/, replacement: path('packages/dds-vue/node_modules/vue/dist/vue.runtime.esm-bundler.js') },
    { find: '@devslab/dds-vue/styles.css', replacement: path('packages/dds-vue/styles.css') },
    { find: /^@devslab\/dds-vue$/, replacement: path('packages/dds-vue/dist/index.js') },
    { find: '@devslab/dds-table-vue/styles.css', replacement: path('packages/dds-table-vue/styles.css') },
    { find: /^@devslab\/dds-table-vue$/, replacement: path('packages/dds-table-vue/dist/index.js') },
  ] },
  server: { host: '127.0.0.1', port: 5283, strictPort: true, fs: { allow: [fileURLToPath(root)] } }
})
