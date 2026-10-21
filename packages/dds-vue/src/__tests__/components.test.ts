import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import axe from 'axe-core'
import { Button, Icon, Input, DatePicker } from '../index'

const wrappers: VueWrapper[] = []
function tracked<T extends VueWrapper>(wrapper: T): T { wrappers.push(wrapper); return wrapper }
afterEach(() => { wrappers.splice(0).forEach(wrapper => wrapper.unmount()); document.body.innerHTML = '' })
describe('Vue DDS input and action contracts', () => {
  it('updates the model and clears while retaining input focus', async () => {
    const w = tracked(mount(Input, { attachTo: document.body, props: { label: '고객 검색', type: 'search', modelValue: '서울', clearable: true, clearLabel: '검색어 지우기' } }))
    const input = w.get('input')
    await input.setValue('연세')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['연세'])
    await w.get('button').trigger('click')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([''])
    expect(document.activeElement).toBe(input.element)
    await w.setProps({ modelValue: '' })
    expect((input.element as HTMLInputElement).value).toBe('')
    expect(w.find('button').exists()).toBe(false)
  })
  it('forwards combobox semantics and exposes native focus', async () => {
    const w = tracked(mount(Input, { attachTo: document.body, props: { label: '고객', modelValue: '' }, attrs: { role: 'combobox', 'aria-expanded': true, 'aria-controls': 'results' } }))
    expect(w.get('input').attributes('aria-controls')).toBe('results')
    w.vm.focus()
    expect(document.activeElement).toBe(w.get('input').element)
    await w.get('input').trigger('keydown', { key: 'Enter', isComposing: true })
    expect(w.emitted('keydown')).toBeUndefined()
    await w.get('input').trigger('keydown', { key: 'ArrowDown' })
    expect(w.emitted('keydown')).toHaveLength(1)
  })
  it('prevents readonly writes and keeps the clear action unavailable', async () => {
    const w = tracked(mount(Input, { props: { label: '조회값', modelValue: '기존', clearable: true, readOnly: true } }))
    await w.get('input').setValue('변경')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.find('button').exists()).toBe(false)
  })
  it('sizes icons with valid CSS units', () => {
    const w = tracked(mount(Icon, { props: { name: 'calendar', size: 14 } }))
    expect((w.get('svg').element as SVGElement).style.width).toBe('14px')
    expect((w.get('svg').element as SVGElement).style.height).toBe('14px')
  })
  it('keeps a loading action named and disabled, with a labelled standalone icon', () => {
    const w = tracked(mount(Button, { props: { loading: true }, slots: { default: '저장' } }))
    expect(w.get('button').element.disabled).toBe(true)
    expect(w.get('button').attributes('aria-busy')).toBe('true')
    expect(w.text()).toContain('저장')
    const icon = tracked(mount(Icon, { props: { name: 'calendar', label: '달력' } }))
    expect(icon.get('svg').attributes('role')).toBe('img')
    expect(icon.get('svg').attributes('aria-label')).toBe('달력')
  })
})
describe('Vue DDS calendar editing contract', () => {
  it('emits canonical dates and reports invalid drafts without committing the old value', async () => {
    const w = tracked(mount(DatePicker, { attachTo: document.body, props: { label: '운행일자', modelValue: '2026-10-22' } }))
    const input = w.get('input')
    await input.setValue('2026/02/31')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.emitted('validityChange')?.at(-1)).toEqual([false])
    expect((input.element as HTMLInputElement).checkValidity()).toBe(false)
    await input.setValue('2026/10/23')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['2026-10-23'])
    expect(w.emitted('validityChange')?.at(-1)).toEqual([true])
    await w.setProps({ modelValue: '2026-11-02' })
    expect((input.element as HTMLInputElement).value).toBe('2026/11/02')
  })
  it('honours bounds and disabled/read-only input', async () => {
    const w = tracked(mount(DatePicker, { props: { label: '기간', modelValue: '2026-10-22', min: '2026-10-22', max: '2026-10-23' } }))
    await w.get('input').setValue('2026/10/24')
    expect(w.emitted('validityChange')?.at(-1)).toEqual([false])
    await w.setProps({ readOnly: true })
    await w.get('input').setValue('2026/10/23')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.get('button').element.disabled).toBe(true)
  })
  it('selects a calendar day through the accessible popup and returns focus to the input', async () => {
    const w = tracked(mount(DatePicker, { attachTo: document.body, props: { label: '운행일자', modelValue: '2026-10-22' } }))
    await w.get('button[aria-label="운행일자 달력 열기"]').trigger('click')
    await nextTick()
    await vi.waitFor(() => expect(document.querySelector('[role="button"][aria-label="2026년 10월 23일 금요일 선택"]')).not.toBeNull())
    document.querySelector<HTMLElement>('[role="button"][aria-label="2026년 10월 23일 금요일 선택"]')!.click()
    await vi.waitFor(() => expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['2026-10-23']))
    await vi.waitFor(() => expect(document.activeElement).toBe(w.get('input').element))
  })
  it('keeps the popup in its owning dialog and Escape restores the trigger without closing the dialog', async () => {
    let parentEscapes = 0
    const w = tracked(mount({ render: () => h('section', { role: 'dialog', 'aria-label': '일정 편집', onKeydown: (event: KeyboardEvent) => { if (event.key === 'Escape') parentEscapes++ } }, [h(DatePicker, { label: '운행일자', modelValue: '2026-10-22' })]) }, { attachTo: document.body }))
    const trigger = w.get('button[aria-label="운행일자 달력 열기"]')
    await trigger.trigger('click')
    await vi.waitFor(() => expect(document.querySelector('[role="button"][aria-label="2026년 10월 23일 금요일 선택"]')).not.toBeNull())
    const day = document.querySelector<HTMLElement>('[role="button"][aria-label="2026년 10월 23일 금요일 선택"]')!
    expect(day.closest('[role="dialog"]')).toBe(w.element)
    day.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger.element))
    expect(parentEscapes).toBe(0)
    expect(w.element.isConnected).toBe(true)
  })
  it('keeps filled inside date labels floating when unfocused', async () => {
    const w = tracked(mount(DatePicker, { props: { label: '운행일자', labelPlacement: 'inside', modelValue: '2026-10-22', required: false } }))
    expect(w.attributes('data-filled')).toBe('true')
    await w.setProps({ modelValue: '' })
    expect(w.attributes('data-filled')).toBeUndefined()
  })
  it('provides accessible names and error associations without an imperative framework bridge', async () => {
    const w = tracked(mount(DatePicker, { attachTo: document.body, props: { label: '운행일자', modelValue: '2026-10-22' } }))
    await nextTick()
    // jsdom has no visual contrast calculation; the shared DDS palette is verified by foundation/browser gates.
    const results = await axe.run(w.element, { rules: { 'color-contrast': { enabled: false } } })
    expect(results.violations.map(item => item.id)).toEqual([])
  })
})
