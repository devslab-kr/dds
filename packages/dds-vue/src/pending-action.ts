import { computed, getCurrentScope, onScopeDispose, readonly, ref, type Ref, type ComputedRef } from 'vue'

export interface PendingActionRunOptions { replace?: boolean }
export interface PendingAction<K extends string = string> {
  readonly current: Readonly<Ref<K | null>>
  readonly busy: ComputedRef<boolean>
  is(key: K): boolean
  run<T>(key: K, task: (signal: AbortSignal) => T | Promise<T>, options?: PendingActionRunOptions): Promise<T | undefined>
  reset(): void
}
export function usePendingAction<K extends string = string>(): PendingAction<K> {
  const current = ref<K | null>(null) as Ref<K | null>
  let active: AbortController | null = null
  function reset() { active?.abort(); active = null; current.value = null }
  if (getCurrentScope()) onScopeDispose(reset)
  async function run<T>(key: K, task: (signal: AbortSignal) => T | Promise<T>, options?: PendingActionRunOptions): Promise<T | undefined> {
    if (active && !options?.replace) return undefined
    active?.abort()
    const controller = new AbortController(); active = controller; current.value = key
    try { return await task(controller.signal) } finally { if (active === controller) { active = null; current.value = null } }
  }
  return { current: computed(() => current.value), busy: computed(() => current.value !== null), is: (key: K) => current.value === key, run, reset }
}
export const createPendingAction = usePendingAction
