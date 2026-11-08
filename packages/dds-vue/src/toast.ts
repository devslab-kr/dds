import { createToaster, Toaster, Toast, type ToastOptions } from '@ark-ui/vue/toast'
import { defineComponent, h, inject, onScopeDispose, provide, useId, type InjectionKey, type VNodeChild, type Component, type ComponentPublicInstance } from 'vue'
import { OwnedPortal } from './overlays'
import Icon from './Icon.vue'

export type ToastTone = 'success' | 'warning' | 'danger' | 'info' | 'loading'
export interface ToastAction { label: string; onClick: () => void }
export interface ToastInput { message: VNodeChild; tone?: ToastTone | undefined; duration?: number | undefined; action?: ToastAction | null | undefined }
export interface ToastRecord extends ToastInput { id: string }
export type ToastUpdate = Partial<ToastInput>
export type ToastLoadingInput = Omit<ToastInput, 'tone' | 'duration'>
export interface ToastPromiseOptions<T> {
  loading: ToastLoadingInput
  success: ToastInput | ((value: T) => ToastInput)
  error: ToastInput | ((error: unknown) => ToastInput)
}
export type ToastPromise<T> = Promise<T> & { readonly id: string }
export interface ToastApi {
  show(input: ToastInput): string
  loading(input: ToastLoadingInput): string
  update(id: string, patch: ToastUpdate): void
  promise<T>(operation: Promise<T> | (() => Promise<T>), options: ToastPromiseOptions<T>): ToastPromise<T>
  dismiss(id: string): void
  clear(): void
}

interface ToastEntry { input: ToastInput; revision: number }
const context: InjectionKey<ToastApi> = Symbol('DDS toast')

export const ToastProvider = defineComponent({
  name: 'DdsToastProvider',
  props: {
    defaultDuration: { type: Number, default: 5000 },
    regionLabel: { type: String, default: '알림' },
    dismissLabel: { type: String, default: '알림 닫기' },
  },
  setup(p, { slots }) {
    const id = useId()
    let sequence = 0
    let disposed = false
    const records = new Map<string, ToastEntry>()
    let region: HTMLElement | undefined
    let scopedDocument: Document | undefined
    // Zag derives its logical region ID from placement. Keep the physical ID
    // unique while resolving that logical lookup inside this provider.
    const getRootNode = () => scopedDocument ??= new Proxy(region?.ownerDocument ?? document, {
      get(target, property) {
        if (property === 'getElementById') return (key: string) => key === 'toast-group:bottom-end' ? region ?? null : target.getElementById(key)
        const value = Reflect.get(target, property, target)
        return typeof value === 'function' ? value.bind(target) : value
      },
    })
    const toaster = createToaster({ placement: 'bottom-end', max: Number.MAX_SAFE_INTEGER, overlap: false, gap: 8, offsets: 'var(--dds-space-16)', removeDelay: 0, hotkey: ['DDS_NO_HOTKEY'] })

    function current(key: string, record: ToastEntry, revision = record.revision) {
      return !disposed && records.get(key) === record && record.revision === revision && toaster.isVisible(key) && !toaster.isDismissed(key)
    }
    function dismiss(key: string) {
      if (disposed) return
      records.delete(key)
      toaster.remove(key)
    }
    function options(key: string, record: ToastEntry): ToastOptions {
      const { input, revision } = record
      const tone = input.tone ?? 'info'
      const duration = input.duration ?? p.defaultDuration
      const action = input.action
      return {
        id: key,
        description: input.message,
        type: tone === 'danger' ? 'error' : tone,
        duration: tone === 'loading' || duration <= 0 ? Infinity : duration,
        meta: { tone },
        action: action ? { label: action.label, onClick() {
          if (!current(key, record, revision)) return
          dismiss(key)
          action.onClick()
        } } : undefined,
        onStatusChange({ status }) {
          if (status !== 'visible' && records.get(key) === record) records.delete(key)
        },
      }
    }
    function show(input: ToastInput) {
      const key = `dds-toast-${id}-${++sequence}`
      if (disposed) return key
      const record = { input: { ...input }, revision: 0 }
      records.set(key, record)
      toaster.create(options(key, record))
      return key
    }
    function apply(key: string, record: ToastEntry, patch: ToastUpdate) {
      record.input = { ...record.input, ...patch }
      record.revision++
      toaster.update(key, options(key, record))
    }
    function settle<T>(key: string, record: ToastEntry | undefined, revision: number, terminal: ToastInput | ((value: T) => ToastInput), value: T, tone: ToastTone) {
      if (!record || !current(key, record, revision)) return
      try {
        const input = typeof terminal === 'function' ? terminal(value) : terminal
        const patch = { ...input, tone: input.tone ?? tone }
        if (current(key, record, revision)) apply(key, record, patch)
      } catch {
        if (current(key, record, revision)) dismiss(key)
      }
    }
    const api: ToastApi = {
      show,
      loading: input => show({ ...input, tone: 'loading' }),
      update(key, patch) {
        const record = records.get(key)
        if (record && current(key, record)) apply(key, record, patch)
      },
      promise<T>(operation: Promise<T> | (() => Promise<T>), promiseOptions: ToastPromiseOptions<T>): ToastPromise<T> {
        const key = api.loading(promiseOptions.loading)
        const record = records.get(key)
        const revision = record?.revision ?? 0
        const work = Promise.resolve().then(() => typeof operation === 'function' ? operation() : operation)
        const tracked = work.then(value => {
          settle(key, record, revision, promiseOptions.success, value, 'success')
          return value
        }, error => {
          settle(key, record, revision, promiseOptions.error, error, 'danger')
          throw error
        })
        return Object.defineProperty(tracked, 'id', { value: key, enumerable: true }) as ToastPromise<T>
      },
      dismiss,
      clear() {
        if (disposed) return
        records.clear()
        toaster.remove()
      },
    }
    provide(context, api)
    onScopeDispose(() => { api.clear(); disposed = true })
    return () => [slots.default?.(), h(OwnedPortal, {}, {
      default: () => h(Toaster as Component, {
        toaster, getRootNode, id: `dds-toast-region-${id}`, label: p.regionLabel, class: 'dds-toast-region',
        ref: (value: Element | ComponentPublicInstance | null) => { region = value ? ('$el' in value ? value.$el : value) as HTMLElement : undefined },
      }, {
        default: (toast: ToastOptions) => h(Toast.Root, {
          class: ['dds-toast', `dds-toast--${toast.meta?.tone ?? 'info'}`, toast.action && 'dds-toast--action'],
          role: toast.type === 'error' ? 'alert' : 'status',
        }, { default: () => [
          toast.meta?.tone === 'loading' && h('span', { class: 'dds-spinner', 'aria-hidden': 'true' }),
          h(Toast.Description, {}, () => toast.description),
          toast.action && h(Toast.ActionTrigger, { type: 'button', class: 'dds-btn dds-btn--secondary dds-btn--sm dds-toast__action' }, () => toast.action?.label),
          p.dismissLabel && h(Toast.CloseTrigger, { class: 'dds-iconbtn dds-iconbtn--sm', 'aria-label': p.dismissLabel }, () => h(Icon, { name: 'close' })),
        ] }),
      }),
    })]
  },
})

export function useToast(): ToastApi {
  const api = inject(context)
  if (!api) throw new Error('useToast must be called inside <ToastProvider>')
  return api
}
