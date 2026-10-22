<script setup lang="ts">
import { computed, ref, useAttrs, useId, watch, watchEffect } from 'vue'
import Combobox from './Combobox.vue'
import { matchesTimeQuery, normalizeTime, parseTypedTime, timeOptions } from './time-only'
import { useModel } from './model'
defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{ modelValue?: string; defaultValue?: string; label?: string; step?: number; min?: string; max?: string; required?: boolean; disabled?: boolean; readOnly?: boolean; clearable?: boolean; name?: string; form?: string }>(), { defaultValue: '', label: '시간', step: 10 })
const emit = defineEmits<{ 'update:modelValue': [value: string]; change: [value: string]; validityChange: [valid: boolean] }>()
const host = ref<HTMLElement | null>(null); const id = `dds-time-${useId()}`
const attrs = useAttrs(); const value = useModel(() => props.modelValue, props.defaultValue, v => { emit('update:modelValue', v); emit('change', v) })
const draft = ref(normalizeTime(value.value) ?? value.value)
watch(value, v => draft.value = normalizeTime(v) ?? v)
const allowed = (v: string) => (v === '' ? !props.required : !!normalizeTime(v) && (!props.min || v >= props.min) && (!props.max || v <= props.max))
const valid = computed(() => allowed(draft.value === '' ? '' : parseTypedTime(draft.value) ?? '?'))
watch(valid, v => emit('validityChange', v), { immediate: true, flush: 'sync' })
watchEffect(() => host.value?.querySelector<HTMLInputElement>('input[role="combobox"]')?.setCustomValidity(valid.value ? '' : '유효한 시간을 입력해 주세요.'))
const items = computed(() => timeOptions(props.step).filter(v => allowed(v) && matchesTimeQuery(v, draft.value)).map(v => ({ value: v, label: v })))
function choose(v: string) { if (v === '' && draft.value !== '') return; if (!props.disabled && !props.readOnly && allowed(v)) { value.value = v; draft.value = v } }
function commit(event?: KeyboardEvent) { if (event?.isComposing) return; const next = draft.value === '' ? '' : parseTypedTime(draft.value); if (next !== null && allowed(next)) { event?.preventDefault(); event?.stopPropagation(); choose(next) } }
</script>
<template><div ref="host" class="dds-time-picker"><Combobox v-bind="attrs" :form="form" :label="label" :model-value="normalizeTime(value) ?? value" v-model:input-value="draft" :items="items" :selected-option="value ? { value, label: value } : undefined" filter-mode="external" :required="required" :disabled="disabled" :read-only="readOnly" :clearable="clearable" :aria-invalid="!valid || undefined" :aria-describedby="!valid ? `${id}-error` : undefined" :messages="{ open: '시간 목록 열기', clear: '시간 지우기', empty: '맞는 시간이 없습니다' }" @update:model-value="choose" @keydown.capture="($event: KeyboardEvent) => { if ($event.key === 'Enter') commit($event) }" @blur="commit()" /><span v-if="!valid" :id="`${id}-error`" class="dds-field__error" role="status">유효한 시간을 입력해 주세요.</span><input v-if="name" type="hidden" :name="name" :form="form" :disabled="disabled" :value="value" /></div></template>
