import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, defineComponent, ref, nextTick, effectScope } from 'vue'
import * as DDS from '../index'

describe('native Vue control contracts', () => {
  it('updates checkbox through the native form control and respects disabled', async () => {
    const wrapper = mount(DDS.Checkbox, { props: { label: '선택', modelValue: false } })
    await wrapper.get('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    await wrapper.setProps({ disabled: true })
    expect(wrapper.get('input').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
  it('associates field help and error with its slotted native input', () => {
    const wrapper = mount(DDS.Field, { props: { label: '이름', helpText: '전체 이름', error: '필수입니다', required: true }, slots: { default: ({ control }: any) => h('input', control) } })
    const input = wrapper.get('input')
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toContain(wrapper.get('[role="alert"]').attributes('id'))
    wrapper.unmount()
  })
  it('switches tab values while keeping inactive content hidden', async () => {
    const wrapper = mount(defineComponent({ setup() { const value = ref('a'); return () => h(DDS.Tabs, { modelValue: value.value, 'onUpdate:modelValue': (v: string) => value.value = v }, { default: () => [h(DDS.TabList, {}, () => [h(DDS.Tab, { value: 'a' }, () => 'A'), h(DDS.Tab, { value: 'b' }, () => 'B')]), h(DDS.TabPanel, { value: 'a' }, () => '첫째'), h(DDS.TabPanel, { value: 'b' }, () => '둘째')] }) } }))
    await wrapper.findAll('[role="tab"]')[1]!.trigger('click')
    await nextTick()
    expect(wrapper.findAll('[role="tab"]')[1]!.attributes('aria-selected')).toBe('true')
    expect(wrapper.text()).toContain('둘째')
    wrapper.unmount()
  })
  it('emits numeric values and clamps stepper changes to bounds', async () => {
    const wrapper = mount(DDS.NumberInput, { props: { label: '수량', modelValue: 2, min: 0, max: 3, step: 1 } })
    await wrapper.get('[aria-label="값 늘리기"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([3])
    await wrapper.setProps({ modelValue: 3 })
    await wrapper.get('[aria-label="값 늘리기"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    wrapper.unmount()
  })
  it('ignores disabled segmented items and emits the selected value', async () => {
    const wrapper = mount(DDS.SegmentedControl, { props: { label: '보기', modelValue: 'a', items: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'c', label: 'C', disabled: true }] } })
    await wrapper.get('[value="b"]').setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b'])
    expect(wrapper.get('[value="c"]').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
  it('blocks native submission when a numeric draft is invalid', async () => {
    const wrapper = mount(DDS.NumberInput, { props: { label: '수량', modelValue: 2, min: 0, max: 3 } })
    await wrapper.get('input[role="spinbutton"]').setValue('abc')
    expect((wrapper.get('input[role="spinbutton"]').element as HTMLInputElement).validity.valid).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.unmount()
  })
  it('accepts its own currency, percent and local-digit formatted values on blur', async () => {
    for (const [locale, formatOptions, modelValue] of [
      ['en-US', { style: 'currency', currency: 'USD' }, 12],
      ['en-US', { style: 'percent', maximumFractionDigits: 1 }, .125],
      ['ar-EG', { style: 'decimal', maximumFractionDigits: 1 }, 12.5],
    ] as const) {
      const wrapper = mount(DDS.NumberInput, { props: { label: '금액', locale, formatOptions, modelValue } })
      await wrapper.get('input[role="spinbutton"]').trigger('blur')
      expect((wrapper.get('input[role="spinbutton"]').element as HTMLInputElement).validity.valid).toBe(true)
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      wrapper.unmount()
    }
  })
})

describe('async action ownership', () => {
  it('aborts replaced work without letting its completion clear the new action', async () => {
    const scope = effectScope()
    const action = scope.run(() => DDS.usePendingAction())!
    let finish!: () => void
    let signal!: AbortSignal
    const first = action.run('first', s => { signal = s; return new Promise<void>(r => finish = r) })
    let finishSecond!: () => void
    const second = action.run('second', () => new Promise<void>(r => finishSecond = r), { replace: true })
    expect(signal.aborted).toBe(true)
    finish(); await first
    expect(action.current.value).toBe('second')
    finishSecond(); await second
    expect(action.busy.value).toBe(false)
    scope.stop()
  })
})
