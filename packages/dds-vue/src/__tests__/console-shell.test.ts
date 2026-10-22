import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, markRaw, nextTick } from 'vue'
import axe from 'axe-core'
import { ConsoleShell, LeftNav } from '../index'

const wrappers: VueWrapper[] = []
afterEach(() => { wrappers.splice(0).forEach(w => w.unmount()); document.body.innerHTML = '' })
const props = {
  surface: 'ops', activePath: '/ops/orders/42',
  brand: { href: '/', name: 'Operations', mark: '/mark.svg' },
  labels: { skip: 'Skip to content', menuOpen: 'Open menu', menuClose: 'Close menu', nav: 'Primary', badge: '{count} pending' },
  header: { title: 'Orders', eyebrow: 'Operations' },
  nav: [
    { id: 'work', label: 'Work', collapsible: true, items: [{ id: 'orders', href: '/ops/orders', label: 'Orders', badge: 3 }] },
    { id: 'settings', label: 'Settings', collapsible: true, items: [{ id: 'team', href: '/ops/team', label: 'Team' }] },
    { label: 'Help', items: [{ id: 'help', href: '/help', label: 'Help center' }] },
  ],
}
function shell(overrides = {}) {
  const w = mount(ConsoleShell, { props: { ...props, ...overrides }, attachTo: document.body })
  wrappers.push(w)
  return w
}
function disclosure(w: VueWrapper, label: string) {
  return w.findAll('h2 button').find(button => button.text() === label)!
}

describe('Vue ConsoleShell', () => {
  it('composes a standalone menu into the navigation slot and closes the shell rail on navigation', async () => {
    const w = mount(ConsoleShell, { props: { ...props, nav: undefined }, slots: { navigation: ({ close }: { close: () => void }) => h(LeftNav, { surface: 'ops', activePath: props.activePath, nav: props.nav, labels: props.labels, 'onNavigate': close }) }, attachTo: document.body })
    wrappers.push(w)
    await w.get('button[data-action="toggle-rail"]').trigger('click')
    expect(w.findAll('nav')).toHaveLength(1)
    expect(disclosure(w, 'Work').attributes('aria-expanded')).toBe('true')
    const link = w.get('a[href="/ops/orders"]')
    link.element.addEventListener('click', event => event.preventDefault())
    await link.trigger('click')
    expect(w.get('button[data-action="toggle-rail"]').attributes('aria-expanded')).toBe('false')
  })

  it('lets a standalone menu own uncontrolled disclosure state and emit navigation', async () => {
    const w = mount(LeftNav, { props: { surface: 'ops', activePath: props.activePath, nav: props.nav, labels: props.labels } })
    wrappers.push(w)
    expect(w.find('main').exists()).toBe(false)
    expect(w.find('aside').exists()).toBe(false)
    await disclosure(w, 'Work').trigger('click')
    expect(disclosure(w, 'Work').attributes('aria-expanded')).toBe('false')
    expect(w.emitted('update:expandedGroups')?.at(-1)).toEqual([[]])
    w.get('a[href="/help"]').element.addEventListener('click', event => event.preventDefault())
    await w.get('a[href="/help"]').trigger('click')
    expect(w.emitted('navigate')).toHaveLength(1)
  })
  it('initially opens the active group, leaves legacy groups open, and toggles group visibility', async () => {
    const w = shell()
    const work = disclosure(w, 'Work')
    expect(work.attributes('aria-expanded')).toBe('true')
    expect(disclosure(w, 'Settings').attributes('aria-expanded')).toBe('false')
    expect(w.get('a[href="/ops/orders"]').attributes('aria-current')).toBe('page')
    expect(w.get('a[href="/help"]').element.closest('ul')!.hidden).toBe(false)
    expect(document.getElementById(work.attributes('aria-controls')!)!.hidden).toBe(false)
    await work.trigger('click')
    expect(work.attributes('aria-expanded')).toBe('false')
    expect(document.getElementById(work.attributes('aria-controls')!)!.hidden).toBe(true)
    expect(w.emitted('update:expandedGroups')?.at(-1)).toEqual([[]])
    await w.setProps({ activePath: '/ops/team' })
    expect(disclosure(w, 'Settings').attributes('aria-expanded')).toBe('false')
  })

  it('supports explicit empty defaults and fallback group keys', async () => {
    const w = shell({ defaultExpandedGroups: [], nav: [{ label: 'Work', collapsible: true, items: props.nav[0]!.items }] })
    const work = disclosure(w, 'Work')
    expect(work.attributes('aria-expanded')).toBe('false')
    await work.trigger('click')
    expect(w.emitted('update:expandedGroups')?.at(-1)).toEqual([['group-0']])
    expect(work.attributes('aria-expanded')).toBe('true')
  })

  it('emits requested controlled changes and only changes visibility when the parent updates', async () => {
    const w = shell({ expandedGroups: ['settings'] })
    await disclosure(w, 'Work').trigger('click')
    expect(w.emitted('update:expandedGroups')?.at(-1)).toEqual([['settings', 'work']])
    expect(disclosure(w, 'Work').attributes('aria-expanded')).toBe('false')
    await w.setProps({ expandedGroups: ['settings', 'work'] })
    expect(disclosure(w, 'Work').attributes('aria-expanded')).toBe('true')
  })

  it('renders decorative component icons, named badges, context and slots without changing navigation names', () => {
    const icon = markRaw(defineComponent({ render: () => h('svg', { 'data-test': 'icon', viewBox: '0 0 20 20' }) }))
    const w = mount(ConsoleShell, { props: { ...props, context: [{ label: 'Workspace', value: 'Seoul' }], nav: [{ label: 'Work', items: [{ id: 'orders', href: '/ops/orders', label: 'Orders', icon, badge: 3 }] }] }, slots: { default: '<p>Order content</p>', 'header-actions': '<button>Create order</button>', foot: '<a href="/account">Account</a>' } })
    wrappers.push(w)
    expect(w.get('[data-test="icon"]').element.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(w.get('[aria-label="3 pending"]').text()).toBe('3')
    expect(w.get('dl').text()).toContain('Seoul')
    expect(w.get('main').text()).toContain('Order content')
    expect(w.get('header button').text()).toBe('Create order')
    expect(w.get('aside a[href="/account"]').text()).toBe('Account')
  })

  it('closes the mobile rail through Escape, scrim and navigation', async () => {
    const w = shell()
    const toggle = w.get('button[data-action="toggle-rail"]')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(toggle.text()).toBe('Close menu')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(toggle.attributes('aria-expanded')).toBe('false')
    await toggle.trigger('click')
    await w.get('.dds-console-rail__scrim').trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    await toggle.trigger('click')
    w.get('a[href="/ops/orders"]').element.addEventListener('click', event => event.preventDefault())
    await w.get('a[href="/ops/orders"]').trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('false')
  })

  it('gives shell instances independent ARIA targets and accessible navigation', async () => {
    const parent = mount({ render: () => h('div', [h(ConsoleShell, props), h(ConsoleShell, props)]) }, { attachTo: document.body })
    wrappers.push(parent)
    const [first, second] = parent.findAllComponents(ConsoleShell)
    expect(first).toBeDefined()
    expect(second).toBeDefined()
    expect(first!.get('main').attributes('id')).not.toBe(second!.get('main').attributes('id'))
    for (const button of first!.findAll('button[aria-controls]')) {
      expect(first!.element.querySelector(`[id="${button.attributes('aria-controls')}"]`)).not.toBeNull()
    }
    parent.unmount()
    wrappers.pop()
    const single = shell()
    const result = await axe.run(single.element, { rules: { 'color-contrast': { enabled: false } } })
    expect(result.violations.map(item => item.id)).toEqual([])
  })
})
