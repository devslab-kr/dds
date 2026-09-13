import { createMemo, For, Show, type JSX } from "solid-js";
import { createTable } from "@tanstack/solid-table";
import { tableFeatureSet, toColumnDefs, type Column, type DataTableLabels, type TableFeatureSet } from "./columns";

export type SortMode = "client" | { statedOrder: string };

/** Fills the `{column}` placeholder in a consumer-supplied label template.
 *  A function replacer, not `template.replace("{column}", value)` — a
 *  string replacement value is subject to special `$&`/`$$`/`` $` ``/`$'`
 *  patterns, and this console has currency columns whose labels can contain
 *  a literal `$`. */
function fillLabel(template: string, value: string): string {
  return template.replace("{column}", () => value);
}

export function DataTable<T>(props: {
  rows: readonly T[];
  columns: readonly Column<T>[];
  caption: string;
  labels: DataTableLabels;
  sort?: SortMode;
  density?: "comfortable" | "dense";
  scroll?: "auto" | "tall";
  minWidth?: string;
  actions?: (row: T) => JSX.Element;
  detail?: (row: T) => JSX.Element;
  page?: { nextHref?: string | undefined };
  empty?: JSX.Element;
}): JSX.Element {
  const clientSorted = () => props.sort === "client";
  const statedOrder = () => (typeof props.sort === "object" ? props.sort.statedOrder : undefined);
  const fixed = () => props.columns.some((column) => column.width !== undefined);

  /* `toColumnDefs` builds fresh column objects on every read; a table model
     that sees a new column identity on every access can lose sorting state
     or re-render in a loop, so the defs are memoized on `props.columns`. */
  const columnDefs = createMemo(() => toColumnDefs(props.columns));

  /* TanStack's `RowData` requires `Record<string, any> | Array<any>`, which
     an unconstrained `T` can't satisfy structurally. Every row is one of
     those at runtime, so the table is instantiated at `Record<string,
     unknown>` and cast back to `T` where rows come back out (in `ordered`). */
  const table = createTable<TableFeatureSet, Record<string, unknown>>({
    features: tableFeatureSet,
    get data() { return props.rows as readonly Record<string, unknown>[]; },
    get columns() { return columnDefs(); },
    enableSorting: true,
  });

  /* The model sorts; our own markup renders. A server-ordered table never
     reaches this path — `sort` is then an object and no header is a button. */
  const ordered = createMemo(() => (clientSorted() ? table.getRowModel().rows.map((row) => row.original as T) : [...props.rows]));

  const sortState = (id: string) => {
    const current = table.store.state.sorting?.[0];
    if (!current || current.id !== id) return "none";
    return current.desc ? "descending" : "ascending";
  };

  return (
    <>
      {/* The stated order and the pagination link are not part of the "is
          there a table to show" question — a cursor-paged list can land on
          an empty page and still needs to say what order it was in and
          offer a way forward. Only the table itself (and its wrap) falls
          back to `empty` when there are no rows. */}
      <Show when={statedOrder()}>{(order) => <p class="dds-table__order">{order()}</p>}</Show>
      <Show when={props.rows.length > 0} fallback={props.empty}>
        <div class={props.scroll === "tall" ? "dds-table-wrap dds-table-wrap--tall" : "dds-table-wrap"}>
          <table
            class={`dds-table${props.density === "dense" ? " dds-table--dense" : ""}${fixed() ? " dds-table--fixed" : ""}`}
            style={props.minWidth ? { "min-inline-size": props.minWidth } : undefined}
          >
            <caption class="dds-visually-hidden">{props.caption}</caption>
            <Show when={fixed()}>
              <colgroup>
                <For each={props.columns}>{(column) => <col data-fold={column.fold ? "" : undefined} style={column.width ? { width: column.width } : undefined} />}</For>
                <Show when={props.actions}><col /></Show>
              </colgroup>
            </Show>
            <thead>
              <tr>
                <For each={props.columns}>{(column) => (
                  <th scope="col" data-column={column.id} data-fold={column.fold ? "" : undefined} data-numeric={column.numeric ? "" : undefined} aria-sort={clientSorted() && column.sortBy ? sortState(column.id) : undefined}>
                    <Show when={clientSorted() && column.sortBy} fallback={column.label}>
                      <button
                        type="button"
                        class="dds-table__sort"
                        data-action="sort"
                        aria-label={fillLabel(props.labels.sortBy, column.label)}
                        onClick={() => table.getColumn(column.id)?.toggleSorting()}
                      >
                        {column.label}
                        <span class="dds-table__sort-mark" aria-hidden="true" data-sort-state={sortState(column.id)} />
                      </button>
                    </Show>
                  </th>
                )}</For>
                <Show when={props.actions}>
                  <th scope="col"><span class="dds-visually-hidden">{props.labels.actions}</span></th>
                </Show>
              </tr>
            </thead>
            <tbody>
              <For each={ordered()}>{(row) => (
                <>
                  <tr>
                    <For each={props.columns}>{(column) => (
                      <Show
                        when={column.rowHeader}
                        fallback={<td data-fold={column.fold ? "" : undefined} data-numeric={column.numeric ? "" : undefined}>{column.cell(row)}</td>}
                      >
                        <th scope="row" data-fold={column.fold ? "" : undefined} data-numeric={column.numeric ? "" : undefined}>{column.cell(row)}</th>
                      </Show>
                    )}</For>
                    <Show when={props.actions}>{(actions) => <td><div class="dds-table__actions">{actions()(row)}</div></td>}</Show>
                  </tr>
                  {/* Test the detail CONTENT, not the prop: a caller renders
                      an expandable panel as
                      `detail={(row) => expanded() === row.id ? <Panel/> : null}`,
                      so a non-expanded row must produce no detail <tr> at
                      all rather than a blank bordered one. */}
                  <Show when={props.detail?.(row)}>{(node) => (
                    <tr><td colSpan={props.columns.length + (props.actions ? 1 : 0)}>{node()}</td></tr>
                  )}</Show>
                </>
              )}</For>
            </tbody>
          </table>
        </div>
      </Show>
      <nav class="dds-table__pagination" hidden={!props.page?.nextHref} aria-label={props.labels.nextPage}>
        <Show when={props.page?.nextHref}>{(href) => <a class="dds-btn dds-btn--secondary" href={href()}>{props.labels.nextPage}</a>}</Show>
      </nav>
    </>
  );
}
