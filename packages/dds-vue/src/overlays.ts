import { Dialog as ArkDialog } from '@ark-ui/vue/dialog'
import { Tooltip as ArkTooltip } from '@ark-ui/vue/tooltip'
import { Popover as ArkPopover } from '@ark-ui/vue/popover'
import { Menu as ArkMenu } from '@ark-ui/vue/menu'
import { defineComponent, h, mergeProps, onMounted, ref, Teleport, type Component, type PropType } from 'vue'
import { useModel } from './model'

/** Resolve the nearest modal after mount, preserving modal isolation and SSR. */
export const OwnedPortal = defineComponent({
  name: 'DdsOwnedPortal', props: { disabled: Boolean, target: Object as PropType<HTMLElement> },
  setup(p, { slots }) { const host = ref<HTMLElement>(); const target = ref<HTMLElement | string>('body'); const mounted = ref(false)
    onMounted(() => { target.value = p.target ?? host.value?.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]') ?? 'body'; mounted.value = true })
    return () => h('span', { ref: host, style: { display: 'contents' } }, [h(Teleport, { to: target.value, disabled: p.disabled || !mounted.value }, slots.default?.() ?? [])])
  }
})
function styled(name: string, component: Component, css: string) {
  return defineComponent({ name, inheritAttrs: false, setup(_, { attrs, slots }) { return () => h(component, mergeProps(attrs, { class: css }), slots) } })
}
function floatingContent(name: string, positioner: Component, content: Component, css: string, positionCss: string) {
  return defineComponent({ name, inheritAttrs: false, props: { portal: { type: Boolean, default: true }, portalMount: Object as PropType<HTMLElement> },
    setup(p, { attrs, slots }) { return () => h(OwnedPortal, { disabled: !p.portal, target: p.portalMount }, { default: () => h(positioner, { class: positionCss }, { default: () => h(content, mergeProps(attrs, { class: css }), slots) }) }) }
  })
}
export const Dialog = defineComponent({ name: 'DdsDialog', inheritAttrs: false,
  props: { open: { type: Boolean, default: undefined }, defaultOpen: Boolean, title: { type: String, required: true }, description: String, closeOnOutside: { type: Boolean, default: true }, portal: { type: Boolean, default: true }, initialFocus: Function as PropType<() => HTMLElement | null>, finalFocus: Function as PropType<() => HTMLElement | null> },
  emits: ['update:open', 'openChange'],
  setup(p, { attrs, slots, emit }) { const open = useModel(() => p.open, p.defaultOpen, v => { emit('update:open', v); emit('openChange', v) })
    return () => h(ArkDialog.Root, { open: open.value, 'onUpdate:open': (v: boolean) => open.value = v, closeOnInteractOutside: p.closeOnOutside, initialFocusEl: p.initialFocus, finalFocusEl: p.finalFocus, lazyMount: true, unmountOnExit: true }, { default: () => [slots.trigger ? h(ArkDialog.Trigger, { asChild: true }, slots.trigger) : null, h(OwnedPortal, { disabled: !p.portal }, { default: () => h(ArkDialog.Positioner, { class: 'dds-dialog-overlay' }, { default: () => h(ArkDialog.Content, mergeProps(attrs, { class: 'dds-dialog', 'aria-describedby': p.description ? undefined : null }), { default: () => [h(ArkDialog.Title, { class: 'dds-dialog__title' }, () => p.title), p.description && h(ArkDialog.Description, { class: 'dds-dialog__body' }, () => p.description), slots.default?.(), slots.actions && h('div', { class: 'dds-dialog__actions' }, slots.actions())] }) }) })] })
  }
})
export const Tooltip = defineComponent({ name: 'DdsTooltip', inheritAttrs: false, props: { content: { type: String, required: true } },
  setup(p, { attrs, slots }) { return () => h(ArkTooltip.Root, { openDelay: 0, closeDelay: 0, ...attrs }, { default: () => [h(ArkTooltip.Trigger, { asChild: true }, slots.default), h(OwnedPortal, {}, { default: () => h(ArkTooltip.Positioner, {}, { default: () => h(ArkTooltip.Content, { class: 'dds-tooltip__bubble' }, () => p.content) }) })] }) }
})
export const Popover = {
  Root: ArkPopover.Root,
  Trigger: ArkPopover.Trigger,
  Content: floatingContent('DdsPopoverContent', ArkPopover.Positioner, ArkPopover.Content, 'dds-popover', 'dds-popover-positioner'),
  Title: ArkPopover.Title, Description: ArkPopover.Description, CloseTrigger: ArkPopover.CloseTrigger, Arrow: ArkPopover.Arrow, ArrowTip: ArkPopover.ArrowTip,
}
export const DropdownMenu = {
  Root: ArkMenu.Root, Trigger: ArkMenu.Trigger, TriggerItem: ArkMenu.TriggerItem, ContextTrigger: ArkMenu.ContextTrigger,
  Content: floatingContent('DdsMenuContent', ArkMenu.Positioner, ArkMenu.Content, 'dds-menu', 'dds-menu-positioner'),
  Item: ArkMenu.Item, ItemText: ArkMenu.ItemText, ItemGroup: ArkMenu.ItemGroup, ItemGroupLabel: ArkMenu.ItemGroupLabel, ItemIndicator: ArkMenu.ItemIndicator,
  CheckboxItem: ArkMenu.CheckboxItem, RadioItem: ArkMenu.RadioItem, RadioItemGroup: ArkMenu.RadioItemGroup, Separator: ArkMenu.Separator,
}
export { ArkDialog, ArkTooltip }
