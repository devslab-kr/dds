import { it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import * as DDS from '../index'
it('renders declared status labels and handles explicitly open domains safely', () => {
  const Pill = DDS.createStatusPill({ tones: { order: { waiting: 'warning' } }, label: (_domain, value) => value === 'waiting' ? '대기' : undefined, openDomains: ['order'] })
  const known = mount(Pill, { props: { domain: 'order', value: 'waiting', locale: 'ko-KR' } })
  expect(known.text()).toBe('대기')
  const unknown = mount(Pill, { props: { domain: 'order', value: '<unknown>', locale: 'ko-KR' } })
  expect(unknown.get('code').text()).toBe('<unknown>')
  expect(unknown.find('unknown').exists()).toBe(false)
  known.unmount(); unknown.unmount()
})
it('identifies the active navigation route without prefix collisions and links skip navigation', async () => {
  const wrapper = mount(DDS.ConsoleShell, { props: { surface: 'test', activePath: '/orders/archive', brand: { href: '/', name: 'DDS', mark: '/logo.svg' }, labels: { skip: '본문으로', menuOpen: '메뉴 열기', menuClose: '메뉴 닫기', nav: '업무', badge: '알림' }, header: { title: '주문' }, nav: [{ label: '업무', items: [{ id: 'o', href: '/orders', label: '주문' }, { id: 'oa', href: '/orders/archive', label: '보관' }] }] }, slots: { default: () => h('p', '내용') } })
  expect(wrapper.get('[aria-current="page"]').text()).toContain('보관')
  expect(wrapper.get('.dds-console-skip').attributes('href')).toBe(`#${wrapper.get('main').attributes('id')}`)
  await wrapper.get('[aria-controls]').trigger('click')
  expect(wrapper.get('[aria-controls]').attributes('aria-expanded')).toBe('true')
  wrapper.unmount()
})
