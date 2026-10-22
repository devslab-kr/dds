import { it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import * as DDS from '../index'
it('associates picker validation with an external native form', async () => {
  const form = document.createElement('form'); form.id = 'external-picker-form'; document.body.appendChild(form)
  for (const component of [DDS.MonthPicker, DDS.TimePicker, DDS.DateRangePicker]) {
    const wrapper = mount(component as any, { attachTo: document.body, props: { label: '필수 입력', required: true, form: form.id } })
    await nextTick()
    expect(form.checkValidity()).toBe(false)
    wrapper.unmount()
  }
  form.remove()
})
it('submits a select ID once to its external native form', async () => {
  const form = document.createElement('form'); form.id = 'external-select-form'; document.body.appendChild(form)
  const wrapper = mount(DDS.SelectPicker, { attachTo: document.body, props: { label: '도시', modelValue: 'a', items: [{ value: 'a', label: '서울' }], name: 'city', form: form.id } })
  await nextTick()
  expect(new FormData(form).getAll('city')).toEqual(['a'])
  wrapper.unmount(); form.remove()
})
it('validates canonical ranges without swapping reversed dates', () => {
  expect(DDS.validateRange('2026/10/22', '2026/10/21', true, undefined, undefined, 'ko-KR').value).toBeNull()
  expect(DDS.validateRange('2026/10/21', '2026/10/22', true, undefined, undefined, 'ko-KR').value).toEqual({ start: '2026-10-21', end: '2026-10-22' })
  expect(DDS.validateMonth('202602', true).value).toBe('2026-02')
  expect(DDS.validateMonth('2026/13', true).valid).toBe(false)
  expect(DDS.parseTypedTime('930')).toBe('09:30')
  expect(DDS.parseTypedTime('24:00')).toBeNull()
})
it('commits valid months only and retains invalid draft for correction', async () => {
  const wrapper = mount(DDS.MonthPicker, { props: { label: '대상 월', modelValue: '2026-10' } })
  await wrapper.get('input[type="text"]').setValue('2026/13')
  expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  expect(wrapper.get('input[type="text"]').attributes('aria-invalid')).toBe('true')
  expect((wrapper.get('input[type="text"]').element as HTMLInputElement).validity.valid).toBe(false)
  await wrapper.get('input[type="text"]').setValue('2026/11')
  expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['2026-11'])
  wrapper.unmount()
})
it('prevents range commits while either typed endpoint is invalid or reversed', async () => {
  const wrapper = mount(DDS.DateRangePicker, { props: { label: '기간', modelValue: { start: '2026-10-21', end: '2026-10-22' } } })
  await wrapper.get('[aria-label="종료일"]').setValue('2026/10/20')
  expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  expect(wrapper.emitted('validityChange')?.at(-1)).toEqual([false])
  expect((wrapper.get('[aria-label="종료일"]').element as HTMLInputElement).validity.valid).toBe(false)
  await wrapper.get('[aria-label="종료일"]').setValue('2026/10/23')
  expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([{ start: '2026-10-21', end: '2026-10-23' }])
  wrapper.unmount()
})
it('commits typed time as HH:MM rather than display shorthand', async () => {
  const wrapper = mount(DDS.TimePicker, { attachTo: document.body, props: { label: '예약 시각', modelValue: '' } })
  ;(wrapper.get('input[role="combobox"]').element as HTMLInputElement).focus()
  await wrapper.get('input[role="combobox"]').setValue('930')
  await wrapper.get('input[role="combobox"]').trigger('keydown', { key: 'Enter' })
  expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['09:30'])
  wrapper.unmount()
})
it('keeps an invalid time draft visible and prevents native form submission', async () => {
  const wrapper = mount(DDS.TimePicker, { attachTo: document.body, props: { label: '시각', modelValue: '09:30' } })
  ;(wrapper.get('input[role="combobox"]').element as HTMLInputElement).focus()
  await wrapper.get('input[role="combobox"]').setValue('25:00')
  expect((wrapper.get('input[role="combobox"]').element as HTMLInputElement).value).toBe('25:00')
  expect((wrapper.get('input[role="combobox"]').element as HTMLInputElement).validity.valid).toBe(false)
  expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  wrapper.unmount()
})
