import { Tabs as ArkTabs } from '@ark-ui/vue/tabs'
import { defineComponent, h, mergeProps, type Component } from 'vue'
import { useModel } from './model'

function part(name: string, component: Component, css: string) {
  return defineComponent({ name, inheritAttrs: false, setup(_, { attrs, slots }) { return () => h(component, mergeProps(attrs, { class: css }), slots) } })
}
function valuePart(name: string, component: Component, css: string) {
  return defineComponent({ name, inheritAttrs: false, props: { value: { type: String, required: true }, disabled: { type: Boolean, default: undefined } }, setup(p, { attrs, slots }) { return () => h(component, mergeProps(attrs, { value: p.value, disabled: p.disabled, class: css }), slots) } })
}
export const Tabs = defineComponent({ name: 'DdsTabs', inheritAttrs: false,
  props: { modelValue: String, defaultValue: { type: String, default: '' } }, emits: ['update:modelValue', 'change'],
  setup(p, { attrs, slots, emit }) { const value = useModel(() => p.modelValue, p.defaultValue, v => { emit('update:modelValue', v); emit('change', v) }); return () => h(ArkTabs.Root, mergeProps(attrs, { class: 'dds-tabs-root', modelValue: value.value, 'onUpdate:modelValue': (v: string) => value.value = v }), slots) }
})
export const TabList = part('DdsTabList', ArkTabs.List, 'dds-tabs')
export const Tab = valuePart('DdsTab', ArkTabs.Trigger, 'dds-tab')
export const TabPanel = valuePart('DdsTabPanel', ArkTabs.Content, 'dds-tab-panel')
