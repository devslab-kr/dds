# @devslab/dds-table-react

DDS styling and an SSR-safe React boundary for **AG Grid Community 36.2.0**. This package is independent of `@devslab/dds-react`; importing React primitives does not import AG Grid. React and React DOM 18.3 or 19 are peers.

```tsx
import { useRef } from "react";
import { DataTable, type DataTableRef } from "@devslab/dds-table-react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import "@devslab/dds-tokens/tokens.css";
import "@devslab/dds-css/dds.css";
import "@devslab/dds-table-react/styles.css";

type Order = { id: string; amount: number };
const columns: ColDef<Order>[] = [
  { field: "id", filter: true },
  { field: "amount", editable: true,
    cellRenderer: ({ value }: ICellRendererParams<Order, number>) => <strong>{value}</strong> },
];
export function Orders({ rows }: { rows: readonly Order[] }) {
  const gridRef = useRef<DataTableRef<Order>>(null);
  return <DataTable rows={rows} columns={columns} label="Orders"
    placeholder="Preparing orders" gridRef={gridRef}
    gridProps={{ getRowId: ({ data }) => data.id, rowSelection: { mode: "multiRow" },
      onGridReady: ({ api }) => console.log(api.getDisplayedRowCount()),
      localeText: { noRowsToShow: "No orders" } }} />;
}
```

`rows` accepts immutable array references and copies the array for AG Grid. Replace the array when data changes; keep columns and native configuration stable when practical. `columns` is native `ColDef<T>[]`, including React cell renderers. `label` is required and names both the enclosing region and the mounted grid. All copy and translations belong to the caller; pass `localeText` for AG Grid's built-in UI.

`gridProps` is the exported `DataTableGridProps<T>` alias for native `AgGridReactProps<T>`, excluding `rowData` and `columnDefs`. It accepts AG callbacks, editing/selection/filter options, custom renderers, `gridOptions`, `modules`, and themes. DDS defaults are local `AllCommunityModule`, sortable/resizable columns with `minWidth: 120`, and `ddsGridTheme`. Direct native properties override equivalent `gridOptions` values. Custom module sets must include modules required for their features and `RenderApiModule` for the required accessible label. DDS does not globally register modules or add selection/filtering/editing beyond native options.

`gridRef` is a normal React ref to `AgGridReact<T>`; access `gridRef.current.api` after `onGridReady`. It supports object refs and callback refs, including React 19 ref cleanup. The component's `ref` points to its enclosing `HTMLDivElement`. DOM props (`id`, `className`, `style`, event handlers) apply to that region.

`density` defaults to `"comfortable"` (40px rows, 44px headers); `"dense"` uses 32px rows and 36px headers. Explicit native `rowHeight`/`headerHeight` override density. Default height is 480px; use `style={{ height: 640 }}` to change it. The grid fills available width and retains minimum column widths, using AG Grid's horizontal scrolling on narrow screens. Choose native `domLayout` and container dimensions together if changing its layout.

The exported `ddsGridTheme` maps semantic DDS CSS variables to AG Grid's supported theme parameters. It follows the closest DDS token scope, including `[data-theme="dark"]`. Override with `gridProps.theme`, `gridProps.gridOptions.theme`, or `ddsGridTheme.withParams(...)`. AG Grid generates its own theme CSS; do not load legacy AG Grid CSS alongside this default theme. [AG Grid theme parameters](https://www.ag-grid.com/react-data-grid/theming-parameters/) support CSS variable color expressions.

SSR and worker imports are browser-global safe. Server rendering and the first hydration render emit the same named `role="region"` placeholder with `aria-busy="true"`, a stable height, and optional caller-provided `placeholder`. A React effect then mounts AG Grid. Server markup contains no rendered grid rows or HTML table; provide a separate server summary if the page requires one. Native `loading` marks the mounted region busy and drives AG Grid's loading overlay. Empty arrays use AG Grid's native empty state. In React Server Component frameworks, use this component within a client component.

Community sorting, filtering, resizing, editing, selection, virtualization, and the infinite row model remain AG Grid behavior. The default client-side row model processes only the supplied rows: it cannot sort/filter an entire remote result when `rows` is one loaded page. For remote data, choose the Community infinite row model with a datasource and implement remote sorting/filtering in its `getRows` handler. Pass `rows={[]}` and configure the native datasource; `rows`/`columns` remain DDS-owned inputs. The Enterprise server-side row model, grouping, pivoting, and other commercial features are not bundled. Consumers who separately install/register Enterprise modules own their license and integration. [AG Grid row models](https://www.ag-grid.com/react-data-grid/row-models/) documents these boundaries.

Published ESM, declarations, and the explicit CSS export contain no Solid runtime dependency. DDS's source-available license is in [LICENSE](./LICENSE); AG Grid Community has its own MIT license.
