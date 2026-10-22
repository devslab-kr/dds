// @vitest-environment node
import { it, expect } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { DataTable } from '../index'
it('renders a labelled busy placeholder without constructing a DOM grid during SSR', async () => {
  const html = await renderToString(createSSRApp({ render: () => h(DataTable<{ id: number }>, { label: '주문', rows: [{ id: 1 }], columns: [{ field: 'id' }], density: 'dense' }, { placeholder: () => h('p', '불러오는 중') }) }))
  expect(html).toContain('aria-label="주문"')
  expect(html).toContain('aria-busy="true"')
  expect(html).toContain('data-density="dense"')
  expect(html).toContain('불러오는 중')
  expect(html).not.toContain('ag-root-wrapper')
})
