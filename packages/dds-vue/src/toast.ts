import { createToaster, Toaster, Toast, type ToastOptions } from '@ark-ui/vue/toast'
import { defineComponent, h, inject, onScopeDispose, provide, useId, type InjectionKey, type VNodeChild, type Component } from 'vue'
import { OwnedPortal } from './overlays'
import Icon from './Icon.vue'
export type ToastTone = 'success' | 'warning' | 'danger' | 'info'
export interface ToastInput { message: VNodeChild; tone?: ToastTone; duration?: number }
export interface ToastApi { show(input: ToastInput): string; dismiss(id: string): void; clear(): void }
const context: InjectionKey<ToastApi> = Symbol('DDS toast')
export const ToastProvider = defineComponent({ name: 'DdsToastProvider', props: { defaultDuration: { type: Number, default: 5000 }, regionLabel: { type: String, default: '알림' }, dismissLabel: { type: String, default: '알림 닫기' } },
  setup(p, { slots }) { const id = useId(); let sequence = 0
    const toaster = createToaster({ placement: 'bottom-end', overlap: false, gap: 8, offsets: 'var(--dds-space-16)', removeDelay: 0, hotkey: ['DDS_NO_HOTKEY'] })
    const api: ToastApi = { show(input) { const key = `dds-toast-${id}-${++sequence}`; toaster.create({ id: key, description: input.message, type: input.tone === 'danger' ? 'error' : input.tone ?? 'info', duration: (input.duration ?? p.defaultDuration) > 0 ? input.duration ?? p.defaultDuration : Infinity, meta: { tone: input.tone ?? 'info' } }); return key }, dismiss: key => toaster.remove(key), clear: () => toaster.remove() }
    provide(context, api); onScopeDispose(api.clear)
    return () => [slots.default?.(), h(OwnedPortal, {}, { default: () => h(Toaster as Component, { toaster, label: p.regionLabel, class: 'dds-toast-region' }, { default: (toast: ToastOptions) => h(Toast.Root, { class: ['dds-toast', `dds-toast--${toast.meta?.tone ?? 'info'}`], role: toast.type === 'error' ? 'alert' : 'status' }, { default: () => [h(Toast.Description, {}, () => toast.description), p.dismissLabel && h(Toast.CloseTrigger, { class: 'dds-iconbtn dds-iconbtn--sm', 'aria-label': p.dismissLabel }, () => h(Icon, { name: 'close' }))] }) }) })]
  }
})
export function useToast(): ToastApi { const api = inject(context); if (!api) throw new Error('useToast must be called inside <ToastProvider>'); return api }
