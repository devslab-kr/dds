<script setup lang="ts">
import { computed, ref, useAttrs, useId, watch, watchEffect, type PropType } from 'vue'
import Icon from './Icon.vue'
import { useModel } from './model'
defineOptions({ inheritAttrs: false })
const props = defineProps({ modelValue: { type: Number as PropType<number | null>, default: undefined }, defaultValue: { type: Number as PropType<number | null>, default: null }, label: { type: String, required: true }, min: Number, max: Number, step: { type: Number, default: 1 }, disabled: Boolean, readOnly: Boolean, required: Boolean, invalid: Boolean, locale: { type: String, default: 'ko-KR' }, suffix: String, stepper: { type: Boolean, default: true }, labelPlacement: { type: String as PropType<'outside' | 'hidden'>, default: 'outside' }, formatOptions: Object as PropType<Intl.NumberFormatOptions> })
const emit = defineEmits<{ 'update:modelValue': [value: number | null]; change: [value: number | null]; validityChange: [valid: boolean] }>()
const attrs = useAttrs(); const id = `dds-number-${useId()}`
const value = useModel(() => props.modelValue, props.defaultValue, v => { emit('update:modelValue', v); emit('change', v) })
const formatter = computed(() => new Intl.NumberFormat(props.locale, props.formatOptions ?? { maximumFractionDigits: 0 }))
const format = (v: number | null) => v === null ? '' : formatter.value.format(v)
const draft = ref(format(value.value)); const badDraft = ref(false)
const input = ref<HTMLInputElement | null>(null)
let emitted: number | null | undefined
watch([value, formatter], () => { if (value.value === emitted) { emitted = undefined; return }; draft.value = format(value.value); badDraft.value = false })
const invalid = computed(() => props.invalid || badDraft.value || (value.value === null ? props.required : (props.min !== undefined && value.value < props.min) || (props.max !== undefined && value.value > props.max)))
watch(invalid, v => emit('validityChange', !v), { immediate: true })
watchEffect(() => input.value?.setCustomValidity(invalid.value ? '유효한 범위 내 숫자를 입력해 주세요.' : ''))
const locked = computed(() => props.disabled || props.readOnly)
function commit(formatDisplay = true) {
  if (locked.value) return
  // An untouched formatted value can be rounded or compact; never reinterpret it.
  if (!badDraft.value && draft.value === format(value.value)) return
  const parts = [...formatter.value.formatToParts(-1234.5), ...formatter.value.formatToParts(1234.5)]
  const group = parts.find(p => p.type === 'group')?.value
  const decimal = parts.find(p => p.type === 'decimal')?.value ?? '.'
  let text = draft.value.replace(/[０-９]/g, c => String(c.charCodeAt(0) - 0xff10)).replace(/[－−]/g, '-').replaceAll('，', ',').replaceAll('．', '.')
  const negativeAccounting = text.trim().startsWith('(') && text.trim().endsWith(')')
  const digits = new Intl.NumberFormat(props.locale, { useGrouping: false, maximumFractionDigits: 0 })
  for (let digit = 0; digit < 10; digit++) text = text.split(digits.format(digit)).join(String(digit))
  const minus = parts.find(p => p.type === 'minusSign')?.value
  if (minus) text = text.split(minus).join('-')
  for (const part of parts) if (['currency', 'unit', 'percentSign', 'literal'].includes(part.type)) text = text.split(part.value).join('')
  if (group) text = text.split(group).join('')
  if (decimal) text = text.replace(decimal, '.')
  text = text.trim()
  if (negativeAccounting) text = `-${text}`
  if (!text) { badDraft.value = props.required; if (!props.required && value.value !== null) { emitted = null; value.value = null }; return }
  let number = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) ? Number(text) : NaN
  if (formatter.value.resolvedOptions().style === 'percent') number /= 100
  badDraft.value = !Number.isFinite(number) || (props.min !== undefined && number < props.min) || (props.max !== undefined && number > props.max)
  if (!badDraft.value && number !== value.value) { emitted = number; value.value = number }
  if (!badDraft.value && formatDisplay) draft.value = format(number)
}
function move(delta: number) {
  if (locked.value) return
  const candidate = Number(((value.value ?? 0) + delta).toPrecision(14))
  const next = Math.min(props.max ?? Infinity, Math.max(props.min ?? -Infinity, candidate))
  if (next !== value.value) value.value = next
}
function key(event: KeyboardEvent) {
  if (event.isComposing) return
  const delta = ({ ArrowUp: props.step, ArrowDown: -props.step, PageUp: props.step * 10, PageDown: -props.step * 10 } as Record<string, number>)[event.key]
  if (delta !== undefined) { event.preventDefault(); move(delta) }
  if (event.key === 'Enter') { event.preventDefault(); commit() }
}
</script>
<template>
  <div class="dds-number-input" :data-label-placement="labelPlacement" :class="attrs.class">
    <label :for="id" class="dds-number-input__label">{{ label }}</label>
    <div class="dds-number-input__control" :data-invalid="invalid ? '' : undefined">
      <input v-bind="attrs" :id="id" ref="input" v-model="draft" :name="undefined" class="dds-number-input__field" role="spinbutton" inputmode="decimal" :disabled="disabled" :readonly="readOnly" :required="required" :aria-invalid="invalid || undefined" :aria-valuenow="value ?? undefined" :aria-valuemin="min" :aria-valuemax="max" @input="commit(false)" @blur="commit()" @keydown="key" />
      <input v-if="attrs.name" type="hidden" :name="String(attrs.name)" :form="attrs.form as string" :disabled="disabled" :value="value ?? ''" />
      <span v-if="suffix" class="dds-number-input__suffix">{{ suffix }}</span>
      <div v-if="stepper" class="dds-number-input__steppers">
        <button type="button" class="dds-number-input__step" aria-label="값 줄이기" :disabled="locked || (min !== undefined && value !== null && value <= min)" @click="move(-step)"><Icon name="minus" /></button>
        <button type="button" class="dds-number-input__step" aria-label="값 늘리기" :disabled="locked || (max !== undefined && value !== null && value >= max)" @click="move(step)"><Icon name="plus" /></button>
      </div>
    </div>
  </div>
</template>
