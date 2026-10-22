<script setup lang="ts">
import { Combobox, createListCollection } from '@ark-ui/vue/combobox'
import { computed, ref, useAttrs, watch, type PropType } from 'vue'
import { useModel } from './model'
import { choiceMessages, validateOptions, type ChoiceMessages, type ChoiceOption } from './choice-types'
import { OwnedPortal } from './overlays'
import Icon from './Icon.vue'
defineOptions({ inheritAttrs: false })
const props = defineProps({ items: { type: Array as PropType<readonly ChoiceOption[]>, required: true }, label: { type: String, required: true }, modelValue: String, defaultValue: { type: String, default: '' }, inputValue: String, selectedOption: Object as PropType<ChoiceOption>, placeholder: String, disabled: Boolean, readOnly: Boolean, required: Boolean, clearable: Boolean, loading: Boolean, error: [Boolean, String], filterMode: { type: String as PropType<'local' | 'external'>, default: 'local' }, labelPlacement: { type: String as PropType<'outside' | 'inside' | 'hidden'>, default: 'outside' }, messages: Object as PropType<ChoiceMessages> })
const emit = defineEmits<{ 'update:modelValue': [value: string]; 'update:inputValue': [value: string]; change: [value: string]; retry: [] }>()
const attrs = useAttrs(); const inputAttrs = computed(() => { const { name: _name, ...rest } = attrs; return rest }); const messages = computed(() => ({ ...choiceMessages, ...props.messages }))
const value = useModel(() => props.modelValue, props.defaultValue, v => { emit('update:modelValue', v); emit('change', v) })
const selected = computed(() => props.items.find(item => item.value === value.value) ?? (props.selectedOption?.value === value.value ? props.selectedOption : undefined))
const query = useModel(() => props.inputValue, selected.value?.label ?? '', v => emit('update:inputValue', v))
const open = ref(false)
const filtered = computed(() => { validateOptions(props.items); return props.filterMode === 'external' ? [...props.items] : props.items.filter(item => item.label.toLocaleLowerCase().includes(query.value.toLocaleLowerCase())) })
const collection = computed(() => createListCollection({ items: filtered.value, itemToValue: item => item.value, itemToString: item => item.label, isItemDisabled: item => !!item.disabled }))
watch(() => props.modelValue, () => { query.value = selected.value?.label ?? '' })
watch(() => props.disabled || props.readOnly, locked => { if (locked) open.value = false })
function choose(values: string[]) { if (props.disabled || props.readOnly) return; const candidate = props.items.find(item => item.value === values[0]); if (values.length && (!candidate || candidate.disabled)) return; value.value = values[0] ?? ''; if (candidate) query.value = candidate.label }
function clear() { query.value = ''; choose([]) }
function input(text: string) { if (!props.disabled && !props.readOnly) { query.value = text; open.value = true } }
</script>
<template>
  <Combobox.Root :collection="collection" :model-value="value ? [value] : []" :input-value="query" v-model:open="open" :disabled="disabled" :read-only="readOnly" :required="required" :allow-custom-value="false" :open-on-click="true" :positioning="{ strategy: 'fixed', placement: 'bottom-start' }" class="dds-choice" :class="attrs.class" :data-label-placement="labelPlacement" :data-has-value="value ? '' : undefined" @update:model-value="choose" @update:input-value="input">
    <Combobox.Label class="dds-choice-label">{{ label }}</Combobox.Label>
    <Combobox.Control class="dds-choice-control">
      <Combobox.Input v-bind="inputAttrs" class="dds-choice-input" :placeholder="placeholder" :aria-busy="loading || undefined" :aria-invalid="!!error || undefined" />
      <button v-if="clearable && value && !disabled && !readOnly" type="button" class="dds-choice-clear" :aria-label="messages.clear" @pointerdown.prevent @click="clear"><Icon name="close" /></button>
      <Combobox.Trigger class="dds-choice-clear" :aria-label="messages.open" :disabled="disabled || readOnly"><Icon name="chevron-down" /></Combobox.Trigger>
    </Combobox.Control>
    <OwnedPortal><Combobox.Positioner class="dds-choice-positioner"><Combobox.Content class="dds-choice-content">
      <div v-if="loading" class="dds-choice-status" role="status">{{ messages.loading }}</div>
      <div v-else-if="error" class="dds-choice-status" role="alert">{{ typeof error === 'string' ? error : messages.error }} <button type="button" class="dds-btn dds-btn--ghost" @click="emit('retry')">{{ messages.retry }}</button></div>
      <div v-else-if="!filtered.length" class="dds-choice-status" role="status">{{ messages.empty }}</div>
      <Combobox.Item v-for="item in filtered" v-else :key="item.value" :item="item" class="dds-choice-item"><Combobox.ItemText>{{ item.label }}</Combobox.ItemText><span v-if="item.description" class="dds-choice-description">{{ item.description }}</span></Combobox.Item>
    </Combobox.Content></Combobox.Positioner></OwnedPortal>
    <input v-if="attrs.name" type="hidden" :name="String(attrs.name)" :form="attrs.form as string" :value="value" :disabled="disabled" />
  </Combobox.Root>
</template>
