<script setup lang="ts">
import { DatePicker, parseDate, type DateValue } from '@ark-ui/vue/date-picker'
import { computed, ref, useId, watch, watchEffect } from 'vue'
import { useModel } from './model'
import { canonicalMonth, displayMonth, isCalendarMonth, monthBounds, validateMonth, todayDate } from './calendar-utils'
import { OwnedPortal } from './overlays'
import CalendarGrid from './CalendarGrid.vue'
import Button from './Button.vue'
import Icon from './Icon.vue'
const props = withDefaults(defineProps<{ modelValue?: string; defaultValue?: string; label?: string; labelPlacement?: 'outside' | 'inside' | 'hidden'; min?: string; max?: string; required?: boolean; disabled?: boolean; readOnly?: boolean; clearable?: boolean; locale?: string; timeZone?: string; name?: string; form?: string }>(), { defaultValue: '', label: '월', labelPlacement: 'outside', locale: 'ko-KR', timeZone: 'Asia/Seoul' })
const emit = defineEmits<{ 'update:modelValue': [value: string]; change: [value: string]; validityChange: [valid: boolean] }>()
const input = ref<HTMLInputElement | null>(null)
const id = `dds-month-${useId()}`; const open = ref(false)
const value = useModel(() => props.modelValue, props.defaultValue, v => { emit('update:modelValue', v); emit('change', v) })
const draft = ref(displayMonth(value.value, props.locale)); watch(value, v => draft.value = displayMonth(v, props.locale))
const validity = computed(() => validateMonth(draft.value, props.required, props.min, props.max))
watch(() => validity.value.valid, v => emit('validityChange', v), { immediate: true, flush: 'sync' })
watchEffect(() => input.value?.setCustomValidity(validity.value.valid ? '' : '유효한 월을 입력해 주세요.'))
const selection = computed(() => isCalendarMonth(value.value) ? [parseDate(`${value.value}-01`)] : [])
const bounds = computed(() => { const b = monthBounds(props.min, props.max); return { min: b.min ? parseDate(b.min) : undefined, max: b.max ? parseDate(b.max) : undefined } })
function commit() { if (!props.disabled && !props.readOnly && validity.value.valid && validity.value.value !== null && validity.value.value !== value.value) value.value = validity.value.value }
function choose(values: DateValue[]) { if (props.disabled || props.readOnly) return; draft.value = values[0]?.toString().slice(0, 7) ?? ''; commit(); open.value = false }
function thisMonth() { const month = todayDate(props.timeZone).slice(0, 7); if (validateMonth(month, true, props.min, props.max).valid) choose([parseDate(`${month}-01`)]) }
watch(() => props.disabled || props.readOnly, v => { if (v) open.value = false })
</script>
<template>
  <div class="dds-field dds-date-picker" :class="`dds-date-picker--${labelPlacement}`" :data-filled="draft ? '' : undefined">
    <label class="dds-field__label" :for="id">{{ label }}</label>
    <DatePicker.Root :model-value="selection" v-model:open="open" :disabled="disabled" :read-only="readOnly" :locale="locale" :time-zone="timeZone" :min="bounds.min" :max="bounds.max" view="month" min-view="month" max-view="month" lazy-mount unmount-on-exit @update:model-value="choose">
      <DatePicker.Control class="dds-date-picker-control"><input :id="id" ref="input" :form="form" v-model="draft" type="text" :required="required" :disabled="disabled" :readonly="readOnly" :aria-invalid="!validity.valid || undefined" :aria-describedby="!validity.valid ? `${id}-error` : undefined" placeholder="YYYY/MM" @input="commit" @blur="commit" @keydown.enter.prevent="commit" /><DatePicker.Trigger as-child><Button tone="secondary" :aria-label="`${label} 달력 열기`" :disabled="disabled || readOnly"><Icon name="calendar" /></Button></DatePicker.Trigger></DatePicker.Control>
      <OwnedPortal><DatePicker.Positioner class="dds-date-picker-positioner"><DatePicker.Content class="dds-date-picker-content" :aria-label="`${label} 선택`"><CalendarGrid view="month"><Button tone="secondary" :disabled="disabled || readOnly" @click="thisMonth">이번 달</Button><Button v-if="clearable && !required" tone="secondary" :disabled="disabled || readOnly" @click="choose([])">지우기</Button></CalendarGrid></DatePicker.Content></DatePicker.Positioner></OwnedPortal>
    </DatePicker.Root>
    <input v-if="name" type="hidden" :name="name" :form="form" :disabled="disabled" :value="value" />
    <span v-if="!validity.valid" :id="`${id}-error`" class="dds-field__error" role="status">유효한 범위 내 월을 입력해 주세요.</span>
  </div>
</template>
