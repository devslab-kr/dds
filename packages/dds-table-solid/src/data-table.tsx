import { createMemo, createSignal, onCleanup, onMount, For, Show, type JSX } from "solid-js";
import { createTable } from "@tanstack/solid-table";
import { tableFeatureSet, toColumnDefs, type Column, type DataTableLabels, type TableFeatureSet } from "./columns";

export type SortValue = { id: string; desc: boolean } | null;
export type SortMode = "client" | { statedOrder: string } | { value: SortValue; onChange: (value: SortValue) => void; statedOrder?: string };
export type ColumnResizing = {
  label: string;
  minWidth?: number;
  maxWidth?: number;
  onChange?: (widths: Readonly<Record<string, number>>, reason: "resize" | "reset") => void;
};
export type RowSelection<T> = { rowId: (row: T) => string; selectedId?: string | null; onSelect: (row: T) => void };

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
  resizing?: ColumnResizing;
  selection?: RowSelection<T>;
}): JSX.Element {
  const clientSorted = () => props.sort === "client";
  const controlledSort = () => typeof props.sort === "object" && "onChange" in props.sort ? props.sort : undefined;
  const sortable = () => clientSorted() || Boolean(controlledSort());
  const statedOrder = () => (typeof props.sort === "object" ? props.sort.statedOrder : undefined);
  const [widths, setWidths] = createSignal<Record<string, number>>({});
  const fixed = () => Boolean(props.resizing) || props.columns.some((column) => column.width !== undefined);
  const headers = new Map<string, HTMLTableCellElement>();
  const [measurements, setMeasurements] = createSignal<Record<string, number>>({});
  onMount(() => {
    if (!props.resizing || typeof ResizeObserver === "undefined") return;
    const measure = () => setMeasurements(Object.fromEntries([...headers].map(([id, node]) => [id, node.getBoundingClientRect().width])));
    const observer = new ResizeObserver(measure);
    headers.forEach(node => observer.observe(node)); measure();
    onCleanup(() => observer.disconnect());
  });
  const minWidth = () => props.resizing?.minWidth ?? 80;
  const maxWidth = () => Math.max(minWidth(), props.resizing?.maxWidth ?? 1200);
  const clamp = (width: number) => Math.max(minWidth(), Math.min(maxWidth(), width));
  const measuredWidth = (column: Column<T>) => widths()[column.id] ?? clamp(measurements()[column.id] || headers.get(column.id)?.getBoundingClientRect().width ||
    (column.width?.endsWith("px") ? Number.parseFloat(column.width) : minWidth()));
  const columnWidth = (column: Column<T>) => widths()[column.id] !== undefined ? `${widths()[column.id]}px` : column.width;
  let cancelDrag: (() => void) | undefined;
  onCleanup(() => cancelDrag?.());
  function resetWidths() {
    cancelDrag?.(); setWidths({}); props.resizing?.onChange?.({}, "reset");
  }
  function resizeKey(event: KeyboardEvent, column: Column<T>) {
    const step = event.shiftKey ? 50 : 12;
    const next = event.key === "ArrowLeft" ? measuredWidth(column) - step : event.key === "ArrowRight" ? measuredWidth(column) + step
      : event.key === "Home" ? minWidth() : event.key === "End" ? maxWidth() : undefined;
    if (next === undefined && event.key !== "Escape") return;
    event.preventDefault(); event.stopPropagation();
    if (event.key === "Escape") resetWidths();
    else { cancelDrag?.(); const updated = { ...widths(), [column.id]: clamp(next!) }; setWidths(updated); props.resizing?.onChange?.(updated, "resize"); }
  }
  function beginResize(event: PointerEvent, column: Column<T>) {
    if (event.button !== 0 || !props.resizing) return;
    event.preventDefault(); event.stopPropagation(); cancelDrag?.();
    const before = widths();
    const initial = Object.fromEntries(props.columns.map(c => [c.id, measuredWidth(c)]));
    const start = event.clientX; const pointerId = event.pointerId;
    const rtl = getComputedStyle(headers.get(column.id)!).direction === "rtl";
    const cleanup = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", finish); window.removeEventListener("pointercancel", cancel); cancelDrag = undefined; };
    const move = (e: PointerEvent) => { if (e.pointerId === pointerId) setWidths({ ...initial, [column.id]: clamp(initial[column.id]! + (e.clientX - start) * (rtl ? -1 : 1)) }); };
    const finish = (e: PointerEvent) => { if (e.pointerId !== pointerId) return; move(e); cleanup(); props.resizing?.onChange?.(widths(), "resize"); };
    const cancel = (e?: PointerEvent) => { if (e && e.pointerId !== pointerId) return; cleanup(); setWidths(before); };
    cancelDrag = cancel;
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", finish); window.addEventListener("pointercancel", cancel);
  }
  const interactive = (event: Event) => event.target instanceof Element && Boolean(event.target.closest('button,a,input,select,textarea,summary,[contenteditable],[role="button"],[role="link"]'));

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
    const external = controlledSort();
    const current = external ? external.value : table.store.state.sorting?.[0];
    if (!current || current.id !== id) return "none";
    return current.desc ? "descending" : "ascending";
  };
  function toggleSort(id: string) {
    const external = controlledSort();
    if (!external) { table.getColumn(id)?.toggleSorting(); return; }
    const current = external.value?.id === id ? external.value : null;
    external.onChange(current?.desc ? null : { id, desc: current !== null });
  }

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
            style={{ "min-inline-size": props.minWidth, "table-layout": props.resizing ? "fixed" : undefined,
              width: Object.keys(widths()).length === props.columns.length && !props.actions ? `${Object.values(widths()).reduce((a, b) => a + b, 0)}px` : undefined }}
          >
            <caption class="dds-visually-hidden">{props.caption}</caption>
            <Show when={fixed()}>
              <colgroup>
                <For each={props.columns}>{(column) => <col data-fold={column.fold ? "" : undefined} style={{ width: columnWidth(column) }} />}</For>
                <Show when={props.actions}><col /></Show>
              </colgroup>
            </Show>
            <thead>
              <tr>
                <For each={props.columns}>{(column) => (
                  <th ref={node => headers.set(column.id, node)} scope="col" data-column={column.id} data-fold={column.fold ? "" : undefined} data-numeric={column.numeric ? "" : undefined} aria-sort={sortable() && column.sortBy ? sortState(column.id) : undefined}>
                    <Show when={sortable() && column.sortBy} fallback={column.label}>
                      <button
                        type="button"
                        class="dds-table__sort"
                        data-action="sort"
                        aria-label={fillLabel(props.labels.sortBy, column.label)}
                        onClick={() => toggleSort(column.id)}
                      >
                        {column.label}
                        <span class="dds-table__sort-mark" aria-hidden="true" data-sort-state={sortState(column.id)} />
                      </button>
                    </Show>
                    <Show when={props.resizing && column.resizable !== false}>
                      <span role="separator" tabindex={0} class="dds-table__resize" aria-orientation="vertical"
                        aria-label={fillLabel(props.resizing!.label, column.label)} aria-valuemin={minWidth()} aria-valuemax={maxWidth()}
                        aria-valuenow={measuredWidth(column)} onPointerDown={event => beginResize(event, column)}
                        onDblClick={event => { event.preventDefault(); event.stopPropagation(); resetWidths(); }}
                        onKeyDown={event => resizeKey(event, column)} />
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
                  <tr tabindex={props.selection ? 0 : undefined}
                    aria-selected={props.selection ? props.selection.selectedId === props.selection.rowId(row) : undefined}
                    onClick={event => { if (!interactive(event)) props.selection?.onSelect(row); }}
                    onKeyDown={event => { if (props.selection && (event.key === "Enter" || event.key === " ") && !interactive(event)) { event.preventDefault(); props.selection.onSelect(row); } }}>
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
