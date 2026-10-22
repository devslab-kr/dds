import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
export default defineConfig({ plugins:[vue()], build:{lib:{entry:'src/index.ts',formats:['es'],fileName:'index'},sourcemap:true,rollupOptions:{external:[/^vue(?:\/|$)/,/^ag-grid-/,/^@devslab\//]}},test:{setupFiles:['src/__tests__/setup.ts'],pool:'threads',maxWorkers:1,environment:'jsdom',environmentOptions:{jsdom:{pretendToBeVisual:true}}} })
