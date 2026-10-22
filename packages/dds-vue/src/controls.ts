import { computed, defineComponent, h, mergeProps, ref, useId, watchEffect, type PropType } from 'vue'
import { useModel } from './model'

export type ControlSize = 'sm' | 'md' | 'lg'
export type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger'
export interface RadioOption { value: string; label: string; disabled?: boolean }
export interface SegmentedControlItem extends RadioOption {}

export const IconButton = defineComponent({
  name: 'DdsIconButton', inheritAttrs: false,
  props: { label: { type: String, required: true }, tone: { type: String as PropType<Exclude<ButtonTone, 'primary'>>, default: 'ghost' }, size: { type: String as PropType<ControlSize>, default: 'md' }, disabled: Boolean, loading: Boolean },
  setup(p, { attrs, slots }) { return () => h('button', mergeProps(attrs, { type: attrs.type ?? 'button', class: ['dds-iconbtn', p.tone !== 'ghost' && `dds-iconbtn--${p.tone}`, p.size !== 'md' && `dds-iconbtn--${p.size}`], 'aria-label': p.label, 'aria-busy': p.loading || undefined, disabled: p.disabled || p.loading }), p.loading ? h('span', { class: 'dds-spinner', 'aria-hidden': true }) : slots.default?.()) }
})

export const Field = defineComponent({
  name: 'DdsField', props: { label: { type: String, required: true }, helpText: String, error: String, required: Boolean, id: String },
  setup(p, { slots }) {
    const generated = `dds-field-${useId()}`
    return () => { const id = p.id ?? generated; const control = { id, 'aria-describedby': [p.helpText && `${id}-help`, p.error && `${id}-error`].filter(Boolean).join(' ') || undefined, 'aria-invalid': p.error ? true : undefined, 'aria-required': p.required || undefined }
      return h('div', { class: ['dds-field', p.error && 'dds-field--error'] }, [h('label', { for: id, class: 'dds-field__label' }, [p.label, p.required && h('span', { 'aria-hidden': true }, ' *')]), slots.default?.({ control }), p.helpText && h('span', { id: `${id}-help`, class: 'dds-field__help' }, p.helpText), p.error && h('span', { id: `${id}-error`, class: 'dds-field__error', role: 'alert' }, p.error)]) }
  }
})

export const Select = defineComponent({
  name: 'DdsSelect', inheritAttrs: false,
  props: { modelValue: String, defaultValue: { type: String, default: '' }, disabled: Boolean, readOnly: Boolean }, emits: ['update:modelValue', 'change'],
  setup(p, { attrs, emit, slots }) { const value = useModel(() => p.modelValue, p.defaultValue, v => { emit('update:modelValue', v); emit('change', v) }); return () => h('span', { class: 'dds-select' }, h('select', mergeProps(attrs, { class: 'dds-select__input', value: value.value, disabled: p.disabled, 'aria-readonly': p.readOnly || undefined, onChange: (e: Event) => { if (p.disabled || p.readOnly) (e.target as HTMLSelectElement).value = value.value; else value.value = (e.target as HTMLSelectElement).value } }), slots.default?.())) }
})

function toggle(name: string, kind: 'checkbox' | 'radio' | 'switch') {
  return defineComponent({ name, inheritAttrs: false,
    props: { modelValue: { type: Boolean, default: undefined }, defaultValue: Boolean, label: String, disabled: Boolean, readOnly: Boolean, indeterminate: Boolean }, emits: ['update:modelValue', 'change'],
    setup(p, { attrs, slots, emit, expose }) {
      const input = ref<HTMLInputElement>(); const checked = useModel(() => p.modelValue, p.defaultValue, v => { emit('update:modelValue', v); emit('change', v) })
      watchEffect(() => { if (input.value) input.value.indeterminate = p.indeterminate })
      expose({ focus: () => input.value?.focus() })
      return () => h('label', { class: kind === 'switch' ? 'dds-switch' : 'dds-check' }, [h('input', mergeProps(attrs, { ref: input, type: kind === 'radio' ? 'radio' : 'checkbox', role: kind === 'switch' ? 'switch' : undefined, class: kind === 'switch' ? 'dds-switch__input' : 'dds-check__input', checked: checked.value, disabled: p.disabled, 'aria-readonly': p.readOnly || undefined, onClick: (e: Event) => { if (p.readOnly) e.preventDefault() }, onChange: (e: Event) => { if (p.disabled || p.readOnly) (e.target as HTMLInputElement).checked = checked.value; else checked.value = (e.target as HTMLInputElement).checked } })), slots.default?.() ?? p.label])
    }
  })
}
export const Checkbox = toggle('DdsCheckbox', 'checkbox')
export const Radio = toggle('DdsRadio', 'radio')
export const Switch = toggle('DdsSwitch', 'switch')

export function validateSegmentedItems(items: readonly SegmentedControlItem[]) {
  const values = new Set<string>()
  for (const item of items) { if (!item.value || values.has(item.value)) throw new Error('DDS segmented control: values must be nonempty and unique'); values.add(item.value) }
}
function radioSet(name: string, segmented: boolean) {
  return defineComponent({ name, inheritAttrs: false,
    props: { label: { type: String, required: true }, items: { type: Array as PropType<readonly RadioOption[]>, default: () => [] }, options: Array as PropType<readonly RadioOption[]>, modelValue: String, defaultValue: { type: String, default: '' }, disabled: Boolean, readOnly: Boolean, required: Boolean, name: String, size: { type: String as PropType<'sm' | 'md'>, default: 'md' }, fullWidth: Boolean },
    emits: ['update:modelValue', 'change'],
    setup(p, { attrs, emit }) { const id = `dds-radio-${useId()}`; const value = useModel(() => p.modelValue, p.defaultValue, v => { emit('update:modelValue', v); emit('change', v) }); const items = computed(() => { const list = p.options ?? p.items; validateSegmentedItems(list); return list })
      return () => h('div', mergeProps(attrs, { class: segmented ? 'dds-segmented' : 'dds-field', role: 'radiogroup', 'aria-labelledby': id, 'aria-required': p.required || undefined, 'data-size': p.size, 'data-full-width': p.fullWidth ? '' : undefined }), [h('span', { id, class: segmented ? 'dds-segmented__label' : 'dds-field__label' }, p.label), h('div', { class: segmented ? 'dds-segmented__track' : 'dds-radio-group' }, items.value.map(item => h('label', { key: item.value, class: segmented ? 'dds-segmented__item' : 'dds-check', 'data-state': value.value === item.value ? 'checked' : 'unchecked', 'data-disabled': p.disabled || item.disabled ? '' : undefined }, [h('input', { type: 'radio', class: segmented ? 'dds-visually-hidden' : 'dds-check__input', name: p.name ?? id, value: item.value, checked: value.value === item.value, disabled: p.disabled || item.disabled, required: p.required, onClick: (e: Event) => { if (p.readOnly) e.preventDefault() }, onChange: () => { if (!p.disabled && !p.readOnly && !item.disabled) value.value = item.value } }), h('span', { class: segmented ? 'dds-segmented__text' : undefined, 'data-text': item.label }, item.label)])))])
    }
  })
}
export const RadioGroup = radioSet('DdsRadioGroup', false)
export const SegmentedControl = radioSet('DdsSegmentedControl', true)
export const InputGroup = defineComponent({ name: 'DdsInputGroup', setup(_, { slots }) { return () => h('div', { class: 'dds-input-group' }, [(slots.start || slots.prefix) && h('span', { class: 'dds-input-group__start' }, (slots.start ?? slots.prefix)?.()), slots.default?.(), (slots.end || slots.suffix) && h('span', { class: 'dds-input-group__end' }, (slots.end ?? slots.suffix)?.())]) } })
