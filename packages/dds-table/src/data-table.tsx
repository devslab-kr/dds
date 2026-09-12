import type { JSX } from "solid-js";
import type { Column, DataTableLabels } from "./columns";

export function DataTable<T>(props: { rows: readonly T[]; columns: readonly Column<T>[]; labels: DataTableLabels; caption: string }): JSX.Element {
  return <div class="dds-table-wrap"><table class="dds-table"><caption>{props.caption}</caption></table></div>;
}
