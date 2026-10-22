import { it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, nextTick } from 'vue'
import * as DDS from '../index'
afterEach(() => { document.body.innerHTML = '' })
it('gives a dialog an accessible title and emits close on Escape', async () => {
  const wrapper = mount(DDS.Dialog, { attachTo: document.body, props: { open: true, title: '확인', description: '내용 확인' }, slots: { default: () => h('button', '저장') } })
  await new Promise(r => setTimeout(r, 70))
  const dialog = document.querySelector('[role="dialog"]')!
  expect(dialog).not.toBeNull()
  expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)?.textContent).toBe('확인')
  dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await new Promise(r => setTimeout(r, 30))
  expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  wrapper.unmount()
})
it('shows independent toast providers and clears through their own context', async () => {
  let api!: ReturnType<typeof DDS.useToast>
  const Child = defineComponent({ setup() { api = DDS.useToast(); return () => h('button', { onClick: () => api.show({ message: '저장됨', duration: 0 }) }, '알림') } })
  const wrapper = mount(DDS.ToastProvider, { attachTo: document.body, slots: { default: () => h(Child) } })
  await wrapper.get('button').trigger('click'); await nextTick()
  expect(document.body.textContent).toContain('저장됨')
  api.clear(); await nextTick()
  expect(document.body.textContent).not.toContain('저장됨')
  wrapper.unmount()
})
it('filters combobox options and never commits disabled options', async () => {
  const wrapper = mount(DDS.Combobox, { attachTo: document.body, props: { label: '거래처', items: [{ value: 'a', label: '서울' }, { value: 'b', label: '부산', disabled: true }], modelValue: '' } })
  ;(wrapper.get('input[role="combobox"]').element as HTMLInputElement).focus()
  await nextTick()
  await wrapper.get('input[role="combobox"]').setValue('서울')
  await new Promise(r => setTimeout(r, 40))
  expect(document.querySelector('[role="option"]')?.textContent).toContain('서울')
  expect(Array.from(document.querySelectorAll('[role="option"]')).some(x => x.textContent?.includes('부산'))).toBe(false)
  document.querySelector<HTMLElement>('[role="option"]')!.click()
  await nextTick()
  expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['a'])
  wrapper.unmount()
})
it('submits a combobox selection ID once rather than its visible label', async () => {
  const wrapper = mount(defineComponent({ setup() { return () => h('form', {}, [h(DDS.Combobox, { label: '도시', name: 'city', modelValue: 'a', items: [{value:'a',label:'서울'}] })]) } }), { attachTo: document.body })
  await nextTick()
  const data = new FormData(wrapper.get('form').element as HTMLFormElement)
  expect(data.getAll('city')).toEqual(['a'])
  wrapper.unmount()
})
