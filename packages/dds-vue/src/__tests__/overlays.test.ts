import { it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, nextTick } from 'vue'
import * as DDS from '../index'
// Zag timers compare rAF timestamps with global performance.now; jsdom's window
// clock has a different origin. Match the existing React/Solid test harness.
beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(() => callback(performance.now()), 16))
  vi.stubGlobal('cancelAnimationFrame', (timer: number) => clearTimeout(timer))
})
afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals() })
it('gives a dialog an accessible title and emits close on Escape', async () => {
  const wrapper = mount(DDS.Dialog, { attachTo: document.body, props: { open: true, title: '확인', description: '내용 확인' }, slots: { default: () => h('button', '저장') } })
  await new Promise(r => setTimeout(r, 70))
  const dialog = document.querySelector('[role="dialog"]')!
  expect(dialog).not.toBeNull()
  expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)?.textContent).toBe('확인')
  dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await new Promise(r => setTimeout(r, 30))
  expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  wrapper.unmount()
})
it('shows independent toast providers and clears through their own context', async () => {
  let api!: ReturnType<typeof DDS.useToast>
  const Child = defineComponent({ setup() { api = DDS.useToast(); return () => h('button', { onClick: () => api.show({ message: '저장됨', duration: 0 }) }, '알림') } })
  const wrapper = mount(DDS.ToastProvider, { attachTo: document.body, slots: { default: () => h(Child) } })
  await wrapper.get('button').trigger('click'); await nextTick()
  expect(document.body.textContent).toContain('저장됨')
  api.clear(); await nextTick()
  expect(document.body.textContent).not.toContain('저장됨')
  wrapper.unmount()
})

function mountToast(defaultDuration = 5000) {
  let api!: ReturnType<typeof DDS.useToast>
  const Child = defineComponent({ setup() { api = DDS.useToast(); return () => null } })
  const wrapper = mount(DDS.ToastProvider, { attachTo: document.body, props: { defaultDuration }, slots: { default: () => h(Child) } })
  return { api, wrapper }
}
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
it('keeps loading persistent and updates the same toast before terminal expiry', async () => {
  const { api, wrapper } = mountToast(35)
  try {
    const id = api.loading({ message: '처리 중' })
    await nextTick()
    const toast = document.querySelector('.dds-toast')!
    expect(toast.querySelector('.dds-spinner')?.getAttribute('aria-hidden')).toBe('true')
    await new Promise(r => setTimeout(r, 80))
    expect(document.body.textContent).toContain('처리 중')
    api.update(id, { message: '완료', tone: 'success' })
    await nextTick()
    expect(document.querySelector('.dds-toast')).toBe(toast)
    expect(toast.textContent).toContain('완료')
    expect(toast.querySelector('.dds-spinner')).toBeNull()
    await vi.waitFor(() => expect(document.querySelector('.dds-toast')).toBeNull())
    api.update(id, { message: '되살아나면 안 됨' })
    api.update('missing', { message: '없음' })
    await nextTick()
    expect(document.querySelector('.dds-toast')).toBeNull()
  } finally { wrapper.unmount() }
})
it('preserves omitted fields and resets explicit undefined options and null actions', async () => {
  const { api, wrapper } = mountToast(35)
  try {
    const id = api.show({ message: '기존', tone: 'danger', duration: 0, action: { label: '이전', onClick: vi.fn() } })
    api.update(id, { message: '수정' })
    await nextTick()
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('수정')
    expect(document.querySelector('.dds-toast__action')?.textContent).toBe('이전')
    api.update(id, { action: { label: '교체', onClick: vi.fn() } })
    await nextTick()
    expect(document.querySelector('.dds-toast__action')?.textContent).toBe('교체')
    api.update(id, { tone: undefined, duration: undefined, action: null })
    await nextTick()
    expect(document.querySelector('[role="status"]')).not.toBeNull()
    expect(document.querySelector('.dds-toast__action')).toBeNull()
    await vi.waitFor(() => expect(document.querySelector('.dds-toast')).toBeNull())
  } finally { wrapper.unmount() }
})
it('settles promise toasts with their original values, errors and IDs', async () => {
  const { api, wrapper } = mountToast()
  try {
    const work = deferred<number>()
    const factory = vi.fn(() => work.promise)
    const success = vi.fn((value: number) => ({ message: `완료 ${value}`, duration: 0 }))
    const tracked = api.promise(factory, { loading: { message: '대기' }, success, error: { message: '실패' } })
    await nextTick()
    const toast = document.querySelector('.dds-toast')!
    expect(tracked.id).toBeTruthy()
    expect(Object.getOwnPropertyDescriptor(tracked, 'id')?.writable).toBe(false)
    work.resolve(42)
    await expect(tracked).resolves.toBe(42)
    await nextTick()
    expect(factory).toHaveBeenCalledTimes(1)
    expect(success).toHaveBeenCalledWith(42)
    expect(document.querySelector('.dds-toast')).toBe(toast)
    expect(toast.classList.contains('dds-toast--success')).toBe(true)
    const failure = new Error('원본')
    const error = vi.fn((reason: unknown) => ({ message: String((reason as Error).message), duration: 0 }))
    const rejected = api.promise(() => { throw failure }, { loading: { message: '진행' }, success: { message: '성공' }, error })
    await expect(rejected).rejects.toBe(failure)
    await nextTick()
    expect(error).toHaveBeenCalledWith(failure)
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('원본')
  } finally { wrapper.unmount() }
})
it.each(['update', 'dismiss', 'clear', 'close', 'action', 'unmount'] as const)('suppresses terminal factories after manual %s', async mode => {
  const { api, wrapper } = mountToast()
  const work = deferred<number>()
  const success = vi.fn(() => ({ message: '늦은 완료' }))
  const action = vi.fn()
  const tracked = api.promise(work.promise, { loading: { message: '대기', action: { label: '취소', onClick: action } }, success, error: { message: '실패' } })
  await nextTick()
  if (mode === 'update') api.update(tracked.id, { message: '수동 상태' })
  else if (mode === 'dismiss') api.dismiss(tracked.id)
  else if (mode === 'clear') api.clear()
  else if (mode === 'close') document.querySelector<HTMLButtonElement>('[aria-label="알림 닫기"]')!.click()
  else if (mode === 'action') document.querySelector<HTMLButtonElement>('.dds-toast__action')!.click()
  else wrapper.unmount()
  work.resolve(7)
  await expect(tracked).resolves.toBe(7)
  await nextTick()
  expect(success).not.toHaveBeenCalled()
  expect(document.body.textContent).not.toContain('늦은 완료')
  if (mode === 'update') expect(document.body.textContent).toContain('수동 상태')
  if (mode !== 'unmount') wrapper.unmount()
})
it('dismisses before calling an action once and keeps stale APIs inert after disposal', async () => {
  const { api, wrapper } = mountToast()
  const success = vi.fn(() => ({ message: '늦은 완료' }))
  const work = deferred<number>()
  let tracked!: DDS.ToastPromise<number>
  const action = vi.fn(() => api.update(tracked.id, { message: '재생성 금지' }))
  tracked = api.promise(work.promise, { loading: { message: '대기', action: { label: '실행', onClick: action } }, success, error: { message: '실패' } })
  await nextTick()
  const button = document.querySelector<HTMLButtonElement>('.dds-toast__action')!
  expect(button.tagName).toBe('BUTTON')
  expect(button.type).toBe('button')
  button.click(); button.click()
  await nextTick()
  expect(action).toHaveBeenCalledTimes(1)
  expect(document.querySelector('.dds-toast')).toBeNull()
  wrapper.unmount()
  api.show({ message: '폐기 후' }); api.loading({ message: '폐기 후' }); api.update(tracked.id, { message: '폐기 후' }); api.clear(); api.dismiss(tracked.id)
  const after = api.promise(Promise.resolve(9), { loading: { message: '폐기 후' }, success, error: { message: '실패' } })
  work.resolve(1)
  await expect(tracked).resolves.toBe(1)
  await expect(after).resolves.toBe(9)
  expect(success).not.toHaveBeenCalled()
  expect(document.body.textContent).not.toContain('폐기 후')
})
it('guards reentrant terminal factories and preserves results when message factories throw', async () => {
  const { api, wrapper } = mountToast()
  try {
    const work = deferred<number>()
    const tracked = api.promise(work.promise, { loading: { message: '대기' }, success: () => { api.update(tracked.id, { message: '사용자 상태', tone: 'info' }); return { message: '덮어쓰기 금지' } }, error: { message: '실패' } })
    work.resolve(3)
    await expect(tracked).resolves.toBe(3)
    await nextTick()
    expect(document.body.textContent).toContain('사용자 상태')
    expect(document.body.textContent).not.toContain('덮어쓰기 금지')
    api.clear()
    const bad = () => { throw new Error('표시 오류') }
    await expect(api.promise(Promise.resolve(4), { loading: { message: '대기' }, success: bad, error: bad })).resolves.toBe(4)
    const reason = new Error('작업 오류')
    await expect(api.promise(Promise.reject(reason), { loading: { message: '대기' }, success: bad, error: bad })).rejects.toBe(reason)
    await nextTick()
    expect(document.querySelector('.dds-toast')).toBeNull()
  } finally { wrapper.unmount() }
})
it('preserves operation outcomes when a terminal input getter throws', async () => {
  const { api, wrapper } = mountToast()
  try {
    const terminal = { get message(): string { throw new Error('표시 getter 오류') } }
    await expect(api.promise(Promise.resolve(5), { loading: { message: '대기' }, success: terminal, error: terminal })).resolves.toBe(5)
    const reason = new Error('원래 작업 오류')
    await expect(api.promise(Promise.reject(reason), { loading: { message: '대기' }, success: terminal, error: terminal })).rejects.toBe(reason)
    await nextTick()
    expect(document.querySelector('.dds-toast')).toBeNull()
  } finally { wrapper.unmount() }
})
it('preserves a manual update made by a terminal input getter', async () => {
  const { api, wrapper } = mountToast()
  try {
    const work = deferred<number>()
    const tracked = api.promise(work.promise, {
      loading: { message: '대기' },
      success: { get message() { api.update(tracked.id, { message: '수동 상태', tone: 'info' }); return '덮어쓰기 금지' } },
      error: { message: '실패' },
    })
    work.resolve(6)
    await expect(tracked).resolves.toBe(6)
    await nextTick()
    expect(document.body.textContent).toContain('수동 상태')
    expect(document.body.textContent).not.toContain('덮어쓰기 금지')
  } finally { wrapper.unmount() }
})
it('isolates provider IDs and manual toast operations', async () => {
  let first!: DDS.ToastApi; let second!: DDS.ToastApi
  const Child = defineComponent({ props: { second: Boolean }, setup(p) { if (p.second) second = DDS.useToast(); else first = DDS.useToast(); return () => null } })
  const wrapper = mount(defineComponent({ setup() { return () => [h(DDS.ToastProvider, {}, { default: () => h(Child) }), h(DDS.ToastProvider, {}, { default: () => h(Child, { second: true }) })] } }), { attachTo: document.body })
  try {
    const regions = Array.from(document.querySelectorAll('.dds-toast-region'))
    expect(regions).toHaveLength(2)
    expect(new Set(regions.map(region => region.id)).size).toBe(2)
    const id = first.loading({ message: '첫 번째' })
    const other = second.loading({ message: '두 번째' })
    expect(id).not.toBe(other)
    first.update(other, { message: '덮어쓰기 금지' }); first.clear()
    await nextTick()
    expect(document.body.textContent).not.toContain('첫 번째')
    expect(document.body.textContent).toContain('두 번째')
    expect(document.body.textContent).not.toContain('덮어쓰기 금지')
  } finally { wrapper.unmount() }
})
it('filters combobox options and never commits disabled options', async () => {
  const wrapper = mount(DDS.Combobox, { attachTo: document.body, props: { label: '거래처', items: [{ value: 'a', label: '서울' }, { value: 'b', label: '부산', disabled: true }], modelValue: '' } })
  ;(wrapper.get('input[role="combobox"]').element as HTMLInputElement).focus()
  await nextTick()
  await wrapper.get('input[role="combobox"]').setValue('서울')
  await new Promise(r => setTimeout(r, 40))
  expect(document.querySelector('[role="option"]')?.textContent).toContain('서울')
  expect(Array.from(document.querySelectorAll('[role="option"]')).some(x => x.textContent?.includes('부산'))).toBe(false)
  document.querySelector<HTMLElement>('[role="option"]')!.click()
  await nextTick()
  expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['a'])
  wrapper.unmount()
})
it('submits a combobox selection ID once rather than its visible label', async () => {
  const wrapper = mount(defineComponent({ setup() { return () => h('form', {}, [h(DDS.Combobox, { label: '도시', name: 'city', modelValue: 'a', items: [{value:'a',label:'서울'}] })]) } }), { attachTo: document.body })
  await nextTick()
  const data = new FormData(wrapper.get('form').element as HTMLFormElement)
  expect(data.getAll('city')).toEqual(['a'])
  wrapper.unmount()
})
it('keeps the full selected label available when a select field truncates its display', async () => {
  const fullLabel = '서울 강남구에 위치한 아주 긴 이름의 치과기공소'
  const wrapper = mount(DDS.SelectPicker, { attachTo: document.body, props: { label: '기공소', modelValue: 'a', selectedOption: { value: 'a', label: fullLabel }, items: [{ value: 'b', label: '부산' }] } })
  try {
    const trigger = wrapper.get('[role="combobox"]')
    await vi.waitFor(() => expect(trigger.attributes('title')).toBe(fullLabel))
    expect(trigger.text()).toBe(fullLabel)
    await wrapper.setProps({ modelValue: 'b' })
    expect(trigger.attributes('title')).toBe('부산')
    await wrapper.setProps({ modelValue: '' })
    expect(trigger.attributes('title')).toBeUndefined()
  } finally { wrapper.unmount() }
  const withoutTitle = mount(DDS.SelectPicker, { props: { label: '기공소', modelValue: 'a', items: [{ value: 'a', label: fullLabel }] }, attrs: { title: null } })
  try { expect(withoutTitle.get('[role="combobox"]').attributes('title')).toBeUndefined() }
  finally { withoutTitle.unmount() }
})
it('selects with the keyboard and emits the option ID once', async () => {
  const fullLabel = '서울 강남구에 위치한 아주 긴 이름의 치과기공소'
  const wrapper = mount(DDS.SelectPicker, { attachTo: document.body, props: { label: '기공소', items: [{ value: 'a', label: fullLabel }, { value: 'b', label: '부산', disabled: true }] } })
  try {
    const trigger = wrapper.get('[role="combobox"]')
    ;(trigger.element as HTMLElement).focus()
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    await vi.waitFor(() => expect(document.querySelector('[role="option"]')?.textContent).toBe(fullLabel))
    await vi.waitFor(() => expect(document.activeElement?.getAttribute('role')).toBe('listbox'))
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await vi.waitFor(() => expect(wrapper.emitted('update:modelValue')).toEqual([['a']]))
    expect(wrapper.emitted('change')).toEqual([['a']])
    await vi.waitFor(() => expect(trigger.attributes('title')).toBe(fullLabel))
  } finally { wrapper.unmount() }
})
