# @devslab/dds-table-vue

Native Vue 3 adapter for AG Grid Community 36.2.0, with the shared DDS semantic theme. Independent of `@devslab/dds-vue`: basic controls do not import the grid. Vue >=3.5 is a peer.

```sh
pnpm add @devslab/dds-table-vue vue
```

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { DataTable, type DataTableRef } from '@devslab/dds-table-vue'
import type { ColDef } from 'ag-grid-community'
import '@devslab/dds-table-vue/styles.css'
type Order = { id: string; amount: number }
const rows = ref<Order[]>([{ id: 'A', amount: 100 }])
const columns: ColDef<Order>[] = [{ field: 'id', filter: true, flex: 1 }, { field: 'amount', editable: true, flex: 1 }]
const table = ref<DataTableRef<Order> | null>(null)
</script>
<template>
  <DataTable ref="table" label="Orders" :rows="rows" :columns="columns"
    :grid-props="{ getRowId: p => p.data.id, rowSelection: { mode: 'multiRow' } }">
    <template #placeholder>Preparing orders</template>
  </DataTable>
</template>
```

Replace the `rows` array when data changes. `columns` accepts native `ColDef<T>[]`, including Vue cell renderers. Keep column/configuration references stable where practical. `label` names the enclosing region and grid; updates propagate. Grid-ready events are available as `@grid-ready` and `gridProps.onGridReady`, each called once. After readiness, `table.value.api` or `table.value.getApi()` exposes the native `GridApi<T>`.

`gridProps` accepts native `GridOptions<T>` except DDS-owned `rowData`/`columnDefs`, plus a local `modules` array. Default modules are `AllCommunityModule`; no global registration or Enterprise modules. Custom sets must include the modules required for their features and `RenderApiModule` for the grid label. Sorting/resizing default to enabled with a 120px column minimum. Filtering, editing and selection are native opt-ins. Supply `localeText` for translated grid UI.

`density="comfortable"` uses 40px rows/44px headers; `dense` uses 32px/36px. Explicit `gridProps.rowHeight`/`headerHeight` override density. The default container height is 480px; override `style` on DataTable. Other native DOM attributes apply to the enclosing region. Narrow screens retain minimum column widths and use native horizontal scrolling.

`ddsGridTheme` follows DDS semantic variables, including `[data-theme="dark"]`. Override with `gridProps.theme` or `ddsGridTheme.withParams(...)`. Import the package stylesheet once; it includes DDS tokens/core. Do not also load legacy AG Grid CSS with the default theme.

SSR emits a named, busy region and optional `placeholder` slot. The first hydration render matches; the grid mounts afterward. No grid rows are server rendered. Provide a separate server summary when required. Native `loading` drives the loading overlay and region busy state; empty rows use the native empty state.

Community sorting, filtering, resizing, editing, selection and virtualization remain AG Grid behavior. The default client-side model processes supplied rows only. For complete remote sorting/filtering, use the Community infinite row model, `rows=[]` and a datasource that implements those operations. Enterprise server-side rows, grouping and pivoting are not bundled; separately installed Enterprise integrations and licenses belong to the consumer.

Validation: root `verify:table-vue:test`, `verify:table-vue:release`, `verify:vue:browser`. Includes real sorting/filtering/resizing/selection, SSR and fresh packed Vue template checks. DDS uses the [source-available license](LICENSE); AG Grid Community has its own MIT license.
