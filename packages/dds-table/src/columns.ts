import type { JSX } from "solid-js";
import {
  coreCellsFeature,
  coreColumnsFeature,
  coreHeadersFeature,
  coreRowModelsFeature,
  coreRowsFeature,
  coreTablesFeature,
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
  type ColumnDef,
} from "@tanstack/solid-table";

export type Column<T> = {
  id: string;
  label: string;
  cell: (row: T) => JSX.Element;
  sortBy?: (row: T) => string | number | null;
  width?: string;
  fold?: boolean;
  numeric?: boolean;
  rowHeader?: boolean;
};

export type DataTableLabels = {
  /** Accessible name for a sort button; `{column}` is replaced with the column label. */
  sortBy: string;
  /** Header of the trailing actions column, rendered visually hidden. */
  actions: string;
  /** Label of the next-page link. */
  nextPage: string;
};

/**
 * The feature set every `DataTable` instance is built from: the core row
 * model plus client-side sorting. Built once (per `tableFeatures`'
 * recommendation to use it statically outside a component) so `toColumnDefs`
 * and `createTable` agree on the same `TFeatures` type.
 */
const baseFeatures = tableFeatures({
  coreTablesFeature,
  coreRowsFeature,
  coreColumnsFeature,
  coreHeadersFeature,
  coreCellsFeature,
  coreRowModelsFeature,
  rowSortingFeature,
});

/** The `TFeatures` type used everywhere a table/column type needs one. Kept
 *  separate from the `sortedRowModel` factory below: `createSortedRowModel`'s
 *  return type embeds `Table<TFeatures, TData>`, so folding it into the very
 *  type it closes over makes `TFeatures` self-referential — TypeScript's
 *  structural comparison of that recursive shape (observed while wiring this
 *  up) reports unrelated `ColumnDef`/`Column`/`HeaderContext` instantiations
 *  a few frames down a completely unrelated diff, because it can't resolve
 *  the cycle. Naming the narrower, non-recursive type here and using it as
 *  the explicit `TFeatures` argument everywhere avoids that. */
export type TableFeatureSet = typeof baseFeatures;

/**
 * Registering `rowSortingFeature` alone is not enough for sorting to reach
 * the screen — `sortedRowModel` is the factory `table.getRowModel()` actually
 * calls to produce sorted rows; without it, `state.sorting` changes but the
 * rendered row order never does. Added here, after `TableFeatureSet` is
 * already named, so its function type closes over the narrow type instead of
 * over itself.
 */
export const tableFeatureSet: TableFeatureSet & {
  sortedRowModel: ReturnType<typeof createSortedRowModel<TableFeatureSet, Record<string, unknown>>>;
} = {
  ...baseFeatures,
  sortedRowModel: createSortedRowModel<TableFeatureSet, Record<string, unknown>>(),
};

/** Turns our declarations into TanStack column defs. Sorting is enabled per
 *  column by the presence of `sortBy`; everything visual stays in our own
 *  markup, so the def carries only what the model needs.
 *
 *  `Column<T>` deliberately leaves `T` unconstrained (any row shape a
 *  consumer wants to render), but TanStack's `RowData` requires
 *  `Record<string, any> | Array<any>`. Every real row is one of those at
 *  runtime, so the helper is instantiated at `Record<string, any>` and the
 *  accessor casts its parameter back to `T` — a boundary cast, not a
 *  behavior change. */
export function toColumnDefs<T>(columns: readonly Column<T>[]): ColumnDef<TableFeatureSet, Record<string, unknown>, unknown>[] {
  const helper = createColumnHelper<TableFeatureSet, Record<string, unknown>>();
  return columns.map((column) =>
    // `TValue` is invariant on `ColumnDef` (it shows up contravariantly via
    // `footer`'s `HeaderContext`, covariantly via `accessorFn`'s return), so
    // a heterogeneous array of columns can only be typed uniformly at
    // `unknown` — the array element type `ColumnDef<..., unknown>` is not a
    // supertype of `ColumnDef<..., string | number | null>`. The return type
    // annotation below is what makes TanStack infer `TValue = unknown`
    // instead of narrowing to the ternary's actual `string | number | null`.
    helper.accessor((row): unknown => (column.sortBy ? column.sortBy(row as T) : null), {
      id: column.id,
      enableSorting: Boolean(column.sortBy),
      sortUndefined: "last",
    }),
  );
}
