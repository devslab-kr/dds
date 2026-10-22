<script setup lang="ts">
import { DatePicker, parseDate, type DateValue } from '@ark-ui/vue/date-picker'
import { computed } from 'vue'
import { useModel } from './model'
import { isCalendarDate } from './calendar-utils'
import CalendarGrid from './CalendarGrid.vue'
const props = withDefaults(defineProps<{ modelValue?: string; defaultValue?: string; label?: string; min?: string; max?: string; disabled?: boolean; readOnly?: boolean; locale?: string; timeZone?: string; startOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6 }>(), { defaultValue: '', label: '날짜 선택', locale: 'ko-KR', timeZone: 'Asia/Seoul', startOfWeek: 0 })
const emit = defineEmits<{ 'update:modelValue': [value: string]; change: [value: string] }>()
const value = useModel(() => props.modelValue, props.defaultValue, v => { emit('update:modelValue', v); emit('change', v) })
const selection = computed(() => isCalendarDate(value.value) ? [parseDate(value.value)] : [])
const minDate = computed(() => props.min ? parseDate(props.min) : undefined); const maxDate = computed(() => props.max ? parseDate(props.max) : undefined)
function choose(values: DateValue[]) { if (!props.disabled && !props.readOnly) value.value = values[0]?.toString() ?? '' }
</script>
<template><DatePicker.Root :model-value="selection" :disabled="disabled" :read-only="readOnly" :min="minDate" :max="maxDate" :locale="locale" :time-zone="timeZone" :start-of-week="startOfWeek" min-view="day" max-view="day" fixed-weeks class="dds-calendar dds-date-picker-content" :aria-label="label" @update:model-value="choose"><CalendarGrid><slot /></CalendarGrid></DatePicker.Root></template>
