// @vitest-environment node
import { expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Input, DatePicker, ConsoleShell } from '../index'
it('renders labelled native controls without browser globals or a client framework bridge', async () => {
  const html = await renderToString(createSSRApp({ render: () => h('main', [
    h(Input, { modelValue: '서울', label: '고객 검색' }),
    h(DatePicker, { modelValue: '2026-10-22', label: '운행일자' })
  ]) }))
  expect(html).toContain('서울')
  expect(html).toContain('2026/10/22')
  expect(html).toContain('운행일자 달력 열기')
})

it('server-renders unique console targets and repeatable initial disclosure state without browser globals', async () => {
  const props = {
    surface: 'ops', activePath: '/ops/orders',
    brand: { href: '/', name: 'Operations', mark: '/mark.svg' },
    labels: { skip: 'Skip', menuOpen: 'Open', menuClose: 'Close', nav: 'Primary', badge: '{count} pending' },
    header: { title: 'Orders' },
    nav: [{ id: 'work', label: 'Work', collapsible: true, items: [{ id: 'orders', href: '/ops/orders', label: 'Orders' }] }],
  }
  const render = () => renderToString(createSSRApp({ render: () => h('div', [
    h(ConsoleShell, props), h(ConsoleShell, { ...props, defaultExpandedGroups: [] }),
  ]) }))
  const html = await render()
  expect(await render()).toBe(html)
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1])
  expect(new Set(ids).size).toBe(ids.length)
  const targets = [...html.matchAll(/aria-controls="([^"]+)"/g)].map(match => match[1])
  expect(targets.every(target => ids.includes(target))).toBe(true)
  expect(html).toMatch(/class="dds-console-rail__group-toggle" aria-expanded="true"/)
  expect(html).toMatch(/class="dds-console-rail__group-toggle" aria-expanded="false"/)
  expect(html).toContain('hidden')
})
