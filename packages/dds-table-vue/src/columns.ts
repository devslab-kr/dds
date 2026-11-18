import type { ColDef } from 'ag-grid-community'

/**
 * The trailing column of per-row actions (a menu button, an edit link). It stays pinned to the end edge, so the
 * actions remain on screen when a narrow grid scrolls sideways; it is never sorted, resized, moved or filtered, and
 * its cells line their content up at the end. `label` names the column for screen readers only — the header shows
 * no text. Everything in `column` (cellRenderer, width, colId) is passed through and wins over these defaults.
 */
export function actionColumn<T>(label: string, column: ColDef<T> = {}): ColDef<T> {
  return {
    colId: 'actions',
    headerName: label,
    pinned: 'right',
    lockPinned: true,
    width: 72,
    minWidth: 56,
    sortable: false,
    resizable: false,
    suppressMovable: true,
    filter: false,
    ...column,
    headerClass: ['dds-data-grid__actions-header', ...asList(column.headerClass)],
    cellClass: ['dds-data-grid__actions', ...asList(column.cellClass)],
  } as ColDef<T>
}

function asList(value: unknown): string[] {
  return typeof value === 'string' ? [value] : Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}
