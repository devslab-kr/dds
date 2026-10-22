<script setup lang="ts">
import { Select, createListCollection } from '@ark-ui/vue/select'
import { computed, ref, useAttrs, watch, type PropType } from 'vue'
import { useModel } from './model'
import { choiceMessages, validateOptions, type ChoiceMessages, type ChoiceOption } from './choice-types'
import { OwnedPortal } from './overlays'
import Icon from './Icon.vue'
defineOptions({ inheritAttrs: false })
const props = defineProps({ items: { type: Array as PropType<readonly ChoiceOption[]>, required: true }, label: { type: String, required: true }, modelValue: String, defaultValue: { type: String, default: '' }, selectedOption: Object as PropType<ChoiceOption>, placeholder: String, disabled: Boolean, readOnly: Boolean, required: Boolean, clearable: Boolean, labelPlacement: { type: String as PropType<'outside' | 'inside' | 'hidden'>, default: 'outside' }, messages: Object as PropType<ChoiceMessages> })
const emit = defineEmits<{ 'update:modelValue': [value: string]; change: [value: string] }>()
const attrs = useAttrs(); const messages = computed(() => ({ ...choiceMessages, ...props.messages })); const open = ref(false)
const value = useModel(() => props.modelValue, props.defaultValue, v => { emit('update:modelValue', v); emit('change', v) })
const collection = computed(() => { validateOptions(props.items); const items = [...props.items]; if (props.selectedOption && !items.some(item => item.value === props.selectedOption!.value)) items.push(props.selectedOption); return createListCollection({ items, itemToValue: item => item.value, itemToString: item => item.label, isItemDisabled: item => !!item.disabled }) })
watch(() => props.disabled || props.readOnly, locked => { if (locked) open.value = false })
function choose(values: string[]) { if (props.disabled || props.readOnly || collection.value.items.find(x => x.value === values[0])?.disabled) return; value.value = values[0] ?? '' }
</script>
<template>
  <Select.Root :collection="collection" :model-value="value ? [value] : []" v-model:open="open" :disabled="disabled" :read-only="readOnly" :required="required" :name="attrs.name as string" :positioning="{ strategy: 'fixed', placement: 'bottom-start' }" class="dds-choice" :class="attrs.class" :data-label-placement="labelPlacement" :data-has-value="value ? '' : undefined" @update:model-value="choose">
    <Select.Label class="dds-choice-label">{{ label }}</Select.Label>
    <Select.Control class="dds-choice-control"><Select.Trigger v-bind="attrs" class="dds-choice-trigger" :disabled="disabled || readOnly"><Select.ValueText class="dds-choice-value" :placeholder="placeholder" /></Select.Trigger><button v-if="clearable && value && !disabled && !readOnly" type="button" class="dds-choice-clear" :aria-label="messages.clear" @pointerdown.prevent @click="choose([])"><Icon name="close" /></button></Select.Control>
    <Select.HiddenSelect :form="attrs.form as string" />
    <OwnedPortal><Select.Positioner class="dds-choice-positioner"><Select.Content class="dds-choice-content"><Select.Item v-for="item in items" :key="item.value" :item="item" class="dds-choice-item"><Select.ItemText>{{ item.label }}</Select.ItemText><span v-if="item.description" class="dds-choice-description">{{ item.description }}</span></Select.Item></Select.Content></Select.Positioner></OwnedPortal>
  </Select.Root>
</template>
