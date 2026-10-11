import { forwardRef, useEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef, type ReactNode, type Ref } from "react";
import { AgGridReact, type AgGridReactProps } from "ag-grid-react";
import { AllCommunityModule, type ColDef, type GridApi, type GridReadyEvent } from "ag-grid-community";
import { ddsGridTheme } from "./theme";

export type DataTableDensity = "comfortable" | "dense";
export type DataTableRef<T> = AgGridReact<T>;
export type DataTableGridProps<T> = Omit<AgGridReactProps<T>, "rowData" | "columnDefs">;
export interface DataTableProps<T> extends Omit<ComponentPropsWithoutRef<"div">, "children" | "aria-label" | "role"> {
  rows: readonly T[];
  columns: ColDef<T>[];
  label: string;
  density?: DataTableDensity;
  placeholder?: ReactNode;
  gridProps?: DataTableGridProps<T>;
  gridRef?: Ref<DataTableRef<T>>;
}
const communityModules = [AllCommunityModule];
function DataTableInner<T>({ rows, columns, label, density = "comfortable", placeholder, gridProps = {}, gridRef, className, style, ...rest }: DataTableProps<T>, ref: Ref<HTMLDivElement>) {
  const [mounted, setMounted] = useState(false);
  const api = useRef<GridApi<T> | null>(null);
  const rowData = useMemo(() => [...rows], [rows]);
  const defaultColDef = useMemo(() => ({ sortable: true, resizable: true, minWidth: 120, ...gridProps.gridOptions?.defaultColDef, ...gridProps.defaultColDef }), [gridProps.defaultColDef, gridProps.gridOptions?.defaultColDef]);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (api.current && !api.current.isDestroyed()) api.current.setGridAriaProperty("label", label); }, [label]);
  const onGridReady = (event: GridReadyEvent<T>) => {
    api.current = event.api;
    event.api.setGridAriaProperty("label", label);
    (gridProps.onGridReady ?? gridProps.gridOptions?.onGridReady)?.(event);
  };
  return <div {...rest} ref={ref} role="region" aria-label={label} aria-busy={!mounted || !!(gridProps.loading ?? gridProps.gridOptions?.loading)} className={["dds-data-grid", className].filter(Boolean).join(" ")} data-density={density} style={{ height: 480, ...style }}>
    {mounted ? <AgGridReact<T>
      modules={communityModules}
      {...gridProps} ref={gridRef} rowData={rowData} columnDefs={columns}
      theme={gridProps.theme ?? gridProps.gridOptions?.theme ?? ddsGridTheme}
      defaultColDef={defaultColDef}
      rowHeight={gridProps.rowHeight ?? gridProps.gridOptions?.rowHeight ?? (density === "dense" ? 32 : 40)}
      headerHeight={gridProps.headerHeight ?? gridProps.gridOptions?.headerHeight ?? (density === "dense" ? 36 : 44)}
      onGridReady={onGridReady}
    /> : placeholder}
  </div>;
}
export const DataTable = forwardRef(DataTableInner) as <T>(props: DataTableProps<T> & { ref?: Ref<HTMLDivElement> }) => ReactNode;
