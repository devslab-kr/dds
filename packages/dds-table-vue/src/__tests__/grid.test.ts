import { it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { actionColumn, DataTable } from '../index'
it('forwards readiness, grid options and reactive row/label changes to the native Vue grid', async () => {
  const ready = vi.fn()
  const wrapper = mount(DataTable<{ id: number }>, { attachTo: document.body, props: { label: '목록', rows: [{ id: 2 }, { id: 1 }], columns: [{ field: 'id' }], gridProps: { onGridReady: ready, defaultColDef: { minWidth: 80 }, suppressColumnVirtualisation: true, getRowId: p => String(p.data.id) } } })
  await vi.waitFor(() => expect(ready).toHaveBeenCalledOnce(), { timeout: 3000 })
  expect(ready.mock.calls[0]![0].api.getDisplayedRowCount()).toBe(2)
  await wrapper.setProps({ rows: [{ id: 3 }], label: '바뀐 목록' })
  await nextTick()
  expect(ready.mock.calls[0]![0].api.getDisplayedRowCount()).toBe(1)
  expect(wrapper.get('[role="grid"]').attributes('aria-label')).toBe('바뀐 목록')
  wrapper.unmount()
  expect(ready.mock.calls[0]![0].api.isDestroyed()).toBe(true)
})
it('pins row actions to the end, keeps them out of sorting and resizing, and keeps caller classes', () => {
  const column = actionColumn<{ id: number }>('동작', { cellClass: ['extra'] })
  expect(column).toMatchObject({ headerName: '동작', pinned: 'right', lockPinned: true, sortable: false, resizable: false, suppressMovable: true, width: 72 })
  expect(column.cellClass).toEqual(['dds-data-grid__actions', 'extra'])
})
