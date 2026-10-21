<script setup lang="ts">
import { DatePicker, parseDate, type DateValue } from '@ark-ui/vue/date-picker'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch, watchEffect, type StyleValue } from 'vue'
import Button from './Button.vue'
import Icon from './Icon.vue'
import { displayDate, validateDateInput } from './dateOnly'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{
  modelValue: string; label?: string; min?: string; max?: string; disabled?: boolean; required?: boolean; readOnly?: boolean; labelPlacement?: 'outside' | 'inside' | 'hidden'
}>(), { disabled: false, required: true, readOnly: false, labelPlacement: 'outside' })
const emit = defineEmits<{
  'update:modelValue': [value: string]; change: [value: string]; validityChange: [valid: boolean]
}>()
const attrs = useAttrs()
const id = `dds-date-${useId()}`
const label = computed(() => props.label ?? String(attrs['aria-label'] ?? '날짜'))
const host = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const portalTarget = ref<string | HTMLElement>('body')
const draft = ref(displayDate(props.modelValue))
const open = ref(false)
const validity = computed(() => validateDateInput(draft.value, props.required, props.min, props.max))
const error = computed(() => validity.value.valid ? '' : draft.value === '' ? '날짜를 입력해 주세요.' : 'YYYY/MM/DD 형식의 유효한 범위 내 날짜를 입력해 주세요.')
const selection = computed(() => validateDateInput(props.modelValue, false).valid && props.modelValue ? [parseDate(props.modelValue)] : [])
const minDate = computed(() => props.min ? parseDate(props.min) : undefined)
const maxDate = computed(() => props.max ? parseDate(props.max) : undefined)
let emittedValue: string | null = null
let focusFrame: number | null = null
watch(() => props.modelValue, value => {
  if (value === emittedValue) { emittedValue = null; return }
  emittedValue = null
  draft.value = displayDate(value)
})
watch(() => validity.value.valid, valid => emit('validityChange', valid), { immediate: true, flush: 'sync' })
watchEffect(() => { input.value?.setCustomValidity(error.value) })
watch(() => props.disabled || props.readOnly, locked => { if (locked) open.value = false })
onMounted(() => { portalTarget.value = host.value?.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]') ?? 'body' })
onBeforeUnmount(() => { if (focusFrame !== null) cancelAnimationFrame(focusFrame) })
function commit(): void {
  const state = validity.value
  if (props.disabled || props.readOnly || !state.valid || state.value === null) return
  const value = state.value
  draft.value = displayDate(value)
  if (value !== props.modelValue && value !== emittedValue) {
    emittedValue = value
    emit('update:modelValue', value)
    emit('change', value)
  }
}
function onInput(event: Event): void {
  draft.value = (event.target as HTMLInputElement).value
  input.value?.setCustomValidity(error.value)
  commit()
}
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); event.stopPropagation(); commit() }
}
function select(values: DateValue[]): void {
  draft.value = displayDate(values[0]?.toString() ?? '')
  commit()
  open.value = false
  if (focusFrame !== null) cancelAnimationFrame(focusFrame)
  focusFrame = requestAnimationFrame(() => { focusFrame = null; if (!props.disabled) input.value?.focus({ preventScroll: true }) })
}
async function closeCalendar(): Promise<void> {
  open.value = false
  await nextTick()
  if (focusFrame !== null) cancelAnimationFrame(focusFrame)
  // Ark restores its captured focus during close; restore the explicit trigger after that frame.
  focusFrame = requestAnimationFrame(() => {
    focusFrame = requestAnimationFrame(() => {
      focusFrame = null
      if (!props.disabled && !props.readOnly) host.value?.querySelector<HTMLButtonElement>('[data-part="trigger"]')?.focus({ preventScroll: true })
    })
  })
}
function today(): void {
  const value = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date())
  if (validateDateInput(value, true, props.min, props.max).valid) select([parseDate(value)])
}
const todayAllowed = computed(() => validateDateInput(new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date()), true, props.min, props.max).valid)
</script>

<template>
  <div ref="host" class="dds-field dds-date-picker" :data-filled="draft ? 'true' : undefined" :class="[`dds-date-picker--${labelPlacement}`, attrs.class]" :style="attrs.style as StyleValue">
      <label :for="id" class="dds-field__label">{{ label }}</label>
      <DatePicker.Root :model-value="selection" v-model:open="open" :disabled="disabled" :read-only="readOnly" :required="required" :invalid="!validity.valid"
        :min="minDate" :max="maxDate" locale="ko-KR" time-zone="Asia/Seoul" :start-of-week="0" min-view="day" max-view="day" fixed-weeks lazy-mount unmount-on-exit
        :translations="{ dayCell: state => `${state.valueText} 선택` }"
        :positioning="{ placement: 'bottom-start', gutter: 8, strategy: portalTarget === 'body' ? 'absolute' : 'fixed' }"
        @update:model-value="select">
        <DatePicker.Control class="dds-date-picker-control">
          <input :id="id" ref="input" type="text" :value="draft" :required="required" :disabled="disabled" :readonly="readOnly" :aria-invalid="!validity.valid || undefined"
            :aria-describedby="error ? `${id}-error` : undefined" placeholder="YYYY/MM/DD" autocomplete="off" :spellcheck="false"
            @input.stop="onInput" @blur="commit" @keydown="onKeydown" />
          <DatePicker.Trigger as-child><Button tone="secondary" :aria-label="`${label} 달력 열기`" :disabled="disabled || readOnly"><Icon name="calendar" /></Button></DatePicker.Trigger>
        </DatePicker.Control>
        <Teleport :to="portalTarget">
          <DatePicker.Positioner class="dds-date-picker-positioner">
            <DatePicker.Content class="dds-date-picker-content" :aria-label="`${label} 날짜 선택`" @keydown.esc.stop="closeCalendar">
              <DatePicker.View view="day">
                <DatePicker.Context v-slot="picker">
                  <DatePicker.ViewControl class="dds-date-picker-header">
                    <DatePicker.PrevTrigger as-child><Button tone="secondary" aria-label="이전 달"><Icon name="chevron-left" /></Button></DatePicker.PrevTrigger>
                    <DatePicker.RangeText />
                    <DatePicker.NextTrigger as-child><Button tone="secondary" aria-label="다음 달"><Icon name="chevron-right" /></Button></DatePicker.NextTrigger>
                  </DatePicker.ViewControl>
                  <DatePicker.Table class="dds-date-picker-table">
                    <DatePicker.TableHead><DatePicker.TableRow><DatePicker.TableHeader v-for="(day, index) in picker.weekDays" :key="index">{{ day.short }}</DatePicker.TableHeader></DatePicker.TableRow></DatePicker.TableHead>
                    <DatePicker.TableBody><DatePicker.TableRow v-for="(week, index) in picker.weeks" :key="index">
                      <DatePicker.TableCell v-for="(day, dayIndex) in week" :key="dayIndex" :value="day"><DatePicker.TableCellTrigger>{{ day.day }}</DatePicker.TableCellTrigger></DatePicker.TableCell>
                    </DatePicker.TableRow></DatePicker.TableBody>
                  </DatePicker.Table>
                  <div class="dds-date-picker-footer">
                    <Button tone="secondary" :disabled="disabled || readOnly || !todayAllowed" @click="today">오늘</Button>
                    <Button tone="secondary" v-if="!required" :disabled="disabled || readOnly" @click="select([])">지우기</Button>
                  </div>
                </DatePicker.Context>
              </DatePicker.View>
            </DatePicker.Content>
          </DatePicker.Positioner>
        </Teleport>
      </DatePicker.Root>
      <span v-if="error" :id="`${id}-error`" class="dds-field__error" role="status">{{ error }}</span>
  </div>
</template>
