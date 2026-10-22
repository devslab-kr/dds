<script setup lang="ts">
import { DatePicker, parseDate, type DateValue } from '@ark-ui/vue/date-picker'
import { computed, ref, shallowRef, useId, watch, watchEffect, type PropType } from 'vue'
import { useModel } from './model'
import { displayDate, isCalendarDate, validateRange, type DateRange } from './calendar-utils'
import CalendarGrid from './CalendarGrid.vue'
import { OwnedPortal } from './overlays'
import Button from './Button.vue'
import Icon from './Icon.vue'
export interface DateRangePreset { label: string; value: DateRange }
const props = defineProps({ modelValue: Object as PropType<DateRange>, defaultValue: { type: Object as PropType<DateRange>, default: () => ({ start: '', end: '' }) }, label: { type: String, default: '기간' }, min: String, max: String, required: Boolean, disabled: Boolean, readOnly: Boolean, clearable: Boolean, presets: Array as PropType<readonly DateRangePreset[]>, locale: { type: String, default: 'ko-KR' }, timeZone: { type: String, default: 'Asia/Seoul' }, startName: String, endName: String, form: String })
const emit = defineEmits<{ 'update:modelValue': [value: DateRange]; change: [value: DateRange]; validityChange: [valid: boolean] }>()
const startInput = ref<HTMLInputElement | null>(null); const endInput = ref<HTMLInputElement | null>(null)
const id = `dds-range-${useId()}`; const open = ref(false)
const value = useModel(() => props.modelValue, props.defaultValue, v => { emit('update:modelValue', v); emit('change', v) })
const start = ref(displayDate(value.value.start, props.locale)); const end = ref(displayDate(value.value.end, props.locale))
const selection = shallowRef<DateValue[]>([value.value.start, value.value.end].filter(isCalendarDate).map(v => parseDate(v)))
watch(value, v => { start.value = displayDate(v.start, props.locale); end.value = displayDate(v.end, props.locale); selection.value = [v.start, v.end].filter(isCalendarDate).map(d => parseDate(d)) }, { deep: true })
const validity = computed(() => validateRange(start.value, end.value, props.required, props.min, props.max, props.locale))
watch(() => validity.value.valid, v => emit('validityChange', v), { immediate: true, flush: 'sync' })
watchEffect(() => { const message = validity.value.valid ? '' : '유효한 기간을 입력해 주세요.'; startInput.value?.setCustomValidity(message); endInput.value?.setCustomValidity(message) })
const minDate = computed(() => props.min ? parseDate(props.min) : undefined); const maxDate = computed(() => props.max ? parseDate(props.max) : undefined)
function commit() { const next = validity.value.value; if (!props.disabled && !props.readOnly && next && (next.start !== value.value.start || next.end !== value.value.end)) value.value = next }
function choose(values: DateValue[]) { if (props.disabled || props.readOnly) return; selection.value = values; start.value = displayDate(values[0]?.toString() ?? '', props.locale); end.value = displayDate(values[1]?.toString() ?? '', props.locale); if (values.length === 2 || !values.length) { commit(); open.value = false } }
function preset(item: DateRangePreset) { if (validateRange(item.value.start, item.value.end, props.required, props.min, props.max).valid) choose([item.value.start, item.value.end].filter(isCalendarDate).map(v => parseDate(v))) }
watch(() => props.disabled || props.readOnly, v => { if (v) open.value = false })
</script>
<template>
  <div class="dds-field dds-date-picker"><label :id="`${id}-label`" :for="id" class="dds-field__label">{{ label }}</label>
    <DatePicker.Root :model-value="selection" v-model:open="open" selection-mode="range" :disabled="disabled" :read-only="readOnly" :min="minDate" :max="maxDate" :locale="locale" :time-zone="timeZone" min-view="day" max-view="day" fixed-weeks lazy-mount unmount-on-exit @update:model-value="choose">
      <DatePicker.Control class="dds-date-picker-control"><div class="dds-date-range-box"><input :id="id" ref="startInput" :form="form" v-model="start" type="text" class="dds-date-range-input" aria-label="시작일" :aria-invalid="!validity.valid || undefined" :aria-describedby="!validity.valid ? `${id}-error` : undefined" :required="required" :disabled="disabled" :readonly="readOnly" placeholder="YYYY/MM/DD" @input="commit" @blur="commit" @keydown.enter.prevent="commit" /><span class="dds-date-range-separator" aria-hidden="true">–</span><input ref="endInput" :form="form" v-model="end" type="text" class="dds-date-range-input" aria-label="종료일" :aria-invalid="!validity.valid || undefined" :aria-describedby="!validity.valid ? `${id}-error` : undefined" :required="required" :disabled="disabled" :readonly="readOnly" placeholder="YYYY/MM/DD" @input="commit" @blur="commit" @keydown.enter.prevent="commit" /></div><DatePicker.Trigger as-child><Button tone="secondary" :aria-label="`${label} 달력 열기`" :disabled="disabled || readOnly"><Icon name="calendar" /></Button></DatePicker.Trigger></DatePicker.Control>
      <OwnedPortal><DatePicker.Positioner class="dds-date-picker-positioner"><DatePicker.Content class="dds-date-picker-content" :aria-label="`${label} 선택`"><CalendarGrid><div v-if="presets" class="dds-date-picker-presets" role="group" aria-label="빠른 기간 선택"><Button v-for="item in presets" :key="item.label" tone="secondary" :disabled="disabled || readOnly || !validateRange(item.value.start, item.value.end, required, min, max).valid" @click="preset(item)">{{ item.label }}</Button></div><Button v-if="clearable && !required" tone="secondary" :disabled="disabled || readOnly" @click="choose([])">지우기</Button></CalendarGrid></DatePicker.Content></DatePicker.Positioner></OwnedPortal>
    </DatePicker.Root>
    <input v-if="startName" type="hidden" :name="startName" :form="form" :disabled="disabled" :value="value.start" /><input v-if="endName" type="hidden" :name="endName" :form="form" :disabled="disabled" :value="value.end" />
    <span v-if="!validity.valid" :id="`${id}-error`" role="status" class="dds-field__error">{{ validity.reason === 'order' ? '종료일은 시작일 이후여야 합니다.' : '유효한 기간을 입력해 주세요.' }}</span>
  </div>
</template>
