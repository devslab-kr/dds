// @vitest-environment node
import { expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Input, DatePicker } from '../index'
it('renders labelled native controls without browser globals or a client framework bridge', async () => {
  const html = await renderToString(createSSRApp({ render: () => h('main', [
    h(Input, { modelValue: '서울', label: '고객 검색' }),
    h(DatePicker, { modelValue: '2026-10-22', label: '운행일자' })
  ]) }))
  expect(html).toContain('서울')
  expect(html).toContain('2026/10/22')
  expect(html).toContain('운행일자 달력 열기')
})
