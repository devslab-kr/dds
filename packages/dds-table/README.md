# @devslab/dds-table

Declarative data table for DDS, built on TanStack Table (pinned to the exact
version `9.2.4` — see `docs/decisions.md` D-021 for why an exact pin). One
component, `DataTable`, plus the `Column<T>` and `DataTableLabels` types used
to describe it. The table itself decides nothing about words, routes, or
what "next page" means — every string a visitor can read is a prop.

```sh
pnpm add @devslab/dds-table
```

```tsx
import { DataTable, type Column, type DataTableLabels } from "@devslab/dds-table";

type Job = { id: string; name: string; count: number };

const columns: Column<Job>[] = [
  { id: "name", label: "Name", cell: (row) => row.name, sortBy: (row) => row.name, rowHeader: true },
  { id: "count", label: "Count", cell: (row) => String(row.count), sortBy: (row) => row.count, numeric: true, fold: true },
];

const labels: DataTableLabels = {
  sortBy: "Sort by {column}",
  actions: "Actions",
  nextPage: "Next page",
};

<DataTable rows={jobs} columns={columns} caption="Jobs" labels={labels} sort="client" />;
```

## `Column<T>`

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | `string` | Stable column identity — used for the sort key and the `data-fold`/`data-column` attributes. |
| `label` | `string` | Header text (and the sort button's visible label). |
| `cell` | `(row: T) => JSX.Element` | Renders the cell body. Visual markup stays yours; the column def TanStack sees carries nothing but the sort accessor. |
| `sortBy?` | `(row: T) => string \| number \| null` | Present → the column is sortable (in `sort="client"` mode only) and gets a sort button. Absent → a plain header, never a button. Return `null` for "no value"; those rows sort last (`sortUndefined: "last"`), never first. |
| `width?` | `string` | A CSS width. Setting it on any column switches the whole table to `table-layout: fixed` and emits a `<colgroup>`. |
| `fold?` | `boolean` | Marks the column droppable on narrow viewports (see Folding below). |
| `numeric?` | `boolean` | Right-aligns the column and applies tabular figures. |
| `rowHeader?` | `boolean` | Renders this column's cell as `<th scope="row">` instead of `<td>` — exactly one column per table should set it. |

## Sorting: `sort`

```ts
type SortMode = "client" | { statedOrder: string };
```

- **`sort="client"`** — the table holds its whole list in memory. Columns
  with `sortBy` render a sort button; clicking one asks TanStack Table to
  reorder the rows already in hand. This is safe precisely because "all the
  rows" and "the rows shown" are the same set.
- **`sort={{ statedOrder: "…" }}`** — for a table that shows a server-ordered,
  cursor-paged slice. No column renders a sort button in this mode, even if
  its `sortBy` is set: a client-side sort could only reorder the rows on the
  current page, while the table's real order is whatever the backend query
  produced across pages the browser has never seen. A button that did that
  would look like it sorted the data and would actually misreport it. Instead
  the table prints the actual order as text above itself (`.dds-table__order`)
  — `statedOrder` is that sentence, e.g. `"Newest first"`, supplied by the
  consumer because DDS does not know the backend's ordering vocabulary.

There is no third mode that lets a server-ordered table opt into client
sorting for "just this column" — the failure mode (silently reporting a
per-page order as the whole list's order) is the same regardless of how many
columns are involved.

## Paging: `page`

```ts
page?: { nextHref?: string }
```

`nextHref` renders the next-page control as `<a class="dds-btn dds-btn--secondary" href="…">`, wrapped in a labeled `<nav>` — never a `<button onClick>`. A cursor-paginated list is just a URL with a different query string, and a real link keeps that working with JavaScript disabled, on a slow connection before hydration, and in a browser's native "open in new tab". Omitting `nextHref` (or the whole `page` prop) hides the pagination `<nav>` entirely rather than rendering a disabled control.

## Folding: `fold`

Columns marked `fold: true` disappear below a fixed breakpoint
(`@media (max-width: 56.25rem)` in `dds-css`'s `table.css`) via a plain CSS
rule on `[data-fold]` — there is no JavaScript column-visibility state, no
resize observer, and no per-viewport re-render. The column is always present
in the DOM; the browser decides whether to paint it. This means folding
survives SSR (a server-rendered narrow viewport already hides the column,
correctly, before any script runs) and costs nothing to keep in sync with
sorting or paging state, because there is no state to keep in sync.

## Labels are required, not defaulted

`DataTableLabels` has no optional fields and `DataTable` ships no fallback
strings:

```ts
type DataTableLabels = {
  sortBy: string;   // "{column}" is replaced with the column's label
  actions: string;  // header of the trailing actions column (visually hidden)
  nextPage: string; // accessible name and text of the next-page link
};
```

DDS does not choose the language a consumer's users read in, so it does not
ship English (or any other) copy for a screen reader to announce. A consumer
that forgets a label gets a TypeScript error, not a silently English or
silently blank control.

## What this package does not export

`DataTable` is the only component. The row/cell primitives TanStack Table's
own docs build tables from (a `Th`, a `Td`, a `useDataTable` hook) are
deliberately unexported — there is exactly one consumer today, and a second
API surface to keep stable is a cost paid before anything needs it. When a
second consumer needs a table shape `DataTable`'s props cannot express,
export the primitives then.

Client-side pagination and filtering (TanStack Table's `getPaginationRowModel`
et al.) are similarly not wired in: this component's callers are always
either a small in-memory list (`sort="client"`) or an already-paged server
response (`page.nextHref`), so neither feature would ever fire — it would only
sit in every consumer's bundle.
