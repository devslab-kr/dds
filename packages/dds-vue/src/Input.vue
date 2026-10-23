<script setup lang="ts">
import { computed, onMounted, ref, useAttrs, useId } from 'vue'
import Icon from './Icon.vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{ modelValue: string; label?: string; disabled?: boolean; readOnly?: boolean; type?: 'text' | 'search' | 'email' | 'tel' | 'url' | 'password'; labelPlacement?: 'outside' | 'inside' | 'hidden'; clearable?: boolean; clearLabel?: string }>(), { disabled: false, readOnly: false, type: 'text', labelPlacement: 'outside', clearable: false, clearLabel: '내용 지우기' })
const emit = defineEmits<{ 'update:modelValue': [value: string]; keydown: [event: KeyboardEvent]; clear: [] }>()
const attrs = useAttrs()
const generatedId = useId()
const id = computed(() => String(attrs.id ?? `dds-input-${generatedId}`))
const label = computed(() => props.label ?? String(attrs['aria-label'] ?? attrs.placeholder ?? '입력'))
const input = ref<HTMLInputElement | null>(null)
defineExpose({ focus: () => input.value?.focus(), select: () => input.value?.select() })
function update(value: string): void {
  if (props.disabled || props.readOnly) return
  emit('update:modelValue', value)
  if (value === '') emit('clear')
}
function clear(): void { update(''); input.value?.focus() }
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && (event.isComposing || event.keyCode === 229)) { event.preventDefault(); return }
  emit('keydown', event)
}
onMounted(() => { if (attrs.autofocus !== undefined && attrs.autofocus !== false) input.value?.focus() })
</script>

<template>
  <span class="dds-input" :data-label-placement="labelPlacement" :data-filled="modelValue ? '' : undefined" :data-disabled="disabled ? '' : undefined">
      <label class="dds-input__label" :for="id">{{ label }}</label>
      <Icon v-if="type === 'search'" name="search" class="dds-input__search" :size="16" />
      <input v-bind="attrs" :id="id" ref="input" :type="type" class="dds-input__control" :readonly="readOnly" :value="modelValue" :disabled="disabled"
        @input="update(($event.target as HTMLInputElement).value)" @keydown="onKeydown" />
      <button v-if="clearable && modelValue && !disabled && !readOnly" type="button" class="dds-input__clear" :aria-label="clearLabel"
        @pointerdown.prevent @mousedown.prevent @click="clear"><Icon name="close" /></button>
  </span>
</template>
