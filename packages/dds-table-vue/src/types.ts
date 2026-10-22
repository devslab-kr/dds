import type { ColDef, GridApi, GridOptions, Module } from 'ag-grid-community'
export type DataTableDensity = 'comfortable' | 'dense'
export type DataTableGridProps<T = any> = Omit<GridOptions<T>, 'rowData' | 'columnDefs'> & { modules?: Module[] }
export interface DataTableProps<T = any> { rows: readonly T[]; columns: ColDef<T>[]; label: string; density?: DataTableDensity; gridProps?: DataTableGridProps<T> }
export interface DataTableRef<T = any> { readonly api: GridApi<T> | null; getApi(): GridApi<T> | null }
