import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";
import { DataTable } from "../data-table";
import type { Column } from "../columns";

type Row = { name: string; count: number };
const rows: Row[] = [{ name: "beta", count: 2 }, { name: "alpha", count: 10 }];
const labels = { sortBy: "Sort by {column}", actions: "Actions", nextPage: "Next page" };
const columns: Column<Row>[] = [
  { id: "name", label: "Name", cell: (r) => r.name, sortBy: (r) => r.name, rowHeader: true },
  { id: "count", label: "Count", cell: (r) => String(r.count), sortBy: (r) => r.count, numeric: true, fold: true },
];

let dispose: (() => void) | undefined;
afterEach(() => { dispose?.(); dispose = undefined; document.body.replaceChildren(); });

describe("DataTable", () => {
  it("renders a row per item and marks the row header", () => {
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => <DataTable rows={rows} columns={columns} caption="Keys" labels={labels} />, host);
    expect(host.querySelectorAll("tbody tr")).toHaveLength(2);
    expect(host.querySelector("tbody th")?.getAttribute("scope")).toBe("row");
  });

  it("sorts on the client when sort is client, and reverses on a second press", () => {
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => <DataTable rows={rows} columns={columns} caption="Keys" labels={labels} sort="client" />, host);
    const button = host.querySelector("thead button") as HTMLButtonElement;
    button.click();
    expect([...host.querySelectorAll("tbody th")].map((n) => n.textContent)).toEqual(["alpha", "beta"]);
    button.click();
    expect([...host.querySelectorAll("tbody th")].map((n) => n.textContent)).toEqual(["beta", "alpha"]);
    expect(host.querySelector("thead th")?.getAttribute("aria-sort")).toBe("descending");
  });

  it("offers no sort buttons for a server-ordered table and states the order", () => {
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => (
      <DataTable rows={rows} columns={columns} caption="Jobs" labels={labels} sort={{ statedOrder: "Newest first" }} />
    ), host);
    expect(host.querySelectorAll("thead button")).toHaveLength(0);
    expect(host.querySelector(".dds-table__order")?.textContent).toBe("Newest first");
  });

  it("folds the marked column in both the colgroup and the cells", () => {
    const withWidths = columns.map((c) => ({ ...c, width: "50%" }));
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => <DataTable rows={rows} columns={withWidths} caption="Keys" labels={labels} />, host);
    expect(host.querySelectorAll("col[data-fold]")).toHaveLength(1);
    expect(host.querySelectorAll("tbody td[data-fold]")).toHaveLength(2);
    expect(host.querySelector("table")?.classList.contains("dds-table--fixed")).toBe(true);
  });

  it("renders the next page as a link, not a button", () => {
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => (
      <DataTable rows={rows} columns={columns} caption="Jobs" labels={labels} page={{ nextHref: "/admin/jobs?cursor=abc" }} />
    ), host);
    const link = host.querySelector(".dds-table__pagination a") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/admin/jobs?cursor=abc");
    expect(link.textContent).toBe("Next page");
  });

  it("renders the empty slot instead of a table when there are no rows", () => {
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => (
      <DataTable rows={[]} columns={columns} caption="Keys" labels={labels} empty={<p data-empty>Nothing yet</p>} />
    ), host);
    expect(host.querySelector("table")).toBeNull();
    expect(host.querySelector("[data-empty]")).not.toBeNull();
  });

  it("puts the actions slot in a trailing column with a visually hidden header", () => {
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => (
      <DataTable rows={rows} columns={columns} caption="Keys" labels={labels} actions={(r) => <button>{`Revoke ${r.name}`}</button>} />
    ), host);
    const headers = [...host.querySelectorAll("thead th")];
    expect(headers.at(-1)?.textContent).toBe("Actions");
    expect(host.querySelectorAll("tbody td .dds-table__actions button")).toHaveLength(2);
  });

  it("renders no detail row at all when detail returns nothing for a row", () => {
    // Regression pin: `<Show when={props.detail}>` used to test the PROP,
    // not its result — a caller that renders an expandable panel as
    // `detail={(row) => expanded() === row.id ? <Panel/> : null}` got a
    // blank bordered <tr><td colspan> under every collapsed row.
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => (
      <DataTable rows={rows} columns={columns} caption="Keys" labels={labels} detail={() => null} />
    ), host);
    expect(host.querySelectorAll("tbody tr")).toHaveLength(rows.length);
  });

  it("renders one detail row per row when detail returns content", () => {
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => (
      <DataTable rows={rows} columns={columns} caption="Keys" labels={labels} detail={(r) => <p>{`Detail for ${r.name}`}</p>} />
    ), host);
    expect(host.querySelectorAll("tbody tr")).toHaveLength(rows.length * 2);
    expect(host.querySelectorAll("tbody tr td[colspan]")).toHaveLength(rows.length);
  });

  it("keeps the stated order and the next-page link when a page has no rows", () => {
    // A cursor-paged admin list can land on an empty page (e.g. after a
    // filter narrows the result set) and still need a way forward and a
    // statement of what order it was in — the product cannot supply either
    // from outside the component once <Show> hides them too.
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => (
      <DataTable
        rows={[]}
        columns={columns}
        caption="Jobs"
        labels={labels}
        sort={{ statedOrder: "Newest first" }}
        page={{ nextHref: "/admin/jobs?cursor=next" }}
        empty={<p data-empty>Nothing on this page</p>}
      />
    ), host);
    expect(host.querySelector("table")).toBeNull();
    expect(host.querySelector("[data-empty]")).not.toBeNull();
    expect(host.querySelector(".dds-table__order")?.textContent).toBe("Newest first");
    const link = host.querySelector(".dds-table__pagination a") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/admin/jobs?cursor=next");
  });

  it("marks a column that is both rowHeader and numeric on the <th> the same way as a <td>", () => {
    // Regression pin: the rowHeader branch carried data-fold but not
    // data-numeric, so a rowHeader+numeric column silently lost tabular
    // figures and right-alignment.
    type NumericKeyRow = { id: number };
    const numericKeyRows: NumericKeyRow[] = [{ id: 1 }, { id: 2 }];
    const numericKeyColumns: Column<NumericKeyRow>[] = [
      { id: "id", label: "ID", cell: (r) => String(r.id), rowHeader: true, numeric: true },
    ];
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => <DataTable rows={numericKeyRows} columns={numericKeyColumns} caption="Keys" labels={labels} />, host);
    const rowHeaderCell = host.querySelector("tbody th");
    expect(rowHeaderCell?.getAttribute("scope")).toBe("row");
    expect(rowHeaderCell?.hasAttribute("data-numeric")).toBe(true);
  });

  it("does not corrupt the sort label when a column's label contains a $-sequence", () => {
    // Regression pin: `labels.sortBy.replace("{column}", column.label)` is a
    // STRING pattern replace — "$&"/"$$"/"$`"/"$'" in a consumer's label
    // would be interpreted as replacement patterns, not literal text, if
    // the fix ever regresses to a plain string-pattern .replace.
    type PriceRow = { amount: number };
    const priceRows: PriceRow[] = [{ amount: 1 }];
    const priceColumns: Column<PriceRow>[] = [
      { id: "amount", label: "Amount ($&)", cell: (r) => String(r.amount), sortBy: (r) => r.amount },
    ];
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => <DataTable rows={priceRows} columns={priceColumns} caption="Keys" labels={labels} sort="client" />, host);
    const button = host.querySelector("thead button") as HTMLButtonElement;
    expect(button.getAttribute("aria-label")).toBe("Sort by Amount ($&)");
  });

  it("sorts text case-insensitively (auto '\"text\"' resolution, not raw code-point order)", () => {
    // Regression pin for the missing `sortFns` slot: without registering
    // `sortFn_text`, TanStack's `sortFn: "auto"` falls back to `sortFn_basic`,
    // which compares raw values — "Zebra" < "alpha" by char code (90 < 97).
    type MixedCaseRow = { name: string };
    const mixedRows: MixedCaseRow[] = [{ name: "Zebra" }, { name: "alpha" }];
    const mixedColumns: Column<MixedCaseRow>[] = [
      { id: "name", label: "Name", cell: (r) => r.name, sortBy: (r) => r.name, rowHeader: true },
    ];
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => <DataTable rows={mixedRows} columns={mixedColumns} caption="Keys" labels={labels} sort="client" />, host);
    const button = host.querySelector("thead button") as HTMLButtonElement;
    button.click();
    expect([...host.querySelectorAll("tbody th")].map((n) => n.textContent)).toEqual(["alpha", "Zebra"]);
  });

  it("sorts a null sortBy value last, ascending (sortUndefined: \"last\")", () => {
    // Regression pin for the null/undefined boundary: `sortBy` returns `null`
    // for "no value" per our declared contract, but `createSortedRowModel`'s
    // comparator only honors `sortUndefined` for `=== void 0`. A bare `null`
    // falls through to the real comparator instead, which (for this numeric
    // fixture) sorts the empty row FIRST ascending, not last.
    //
    // Numeric columns start their first sort press descending (auto sort
    // direction), so a second press is what reaches ascending order — same
    // toggle cycle the existing "reverses on a second press" test exercises.
    type MaybeRow = { name: string; score: number | null };
    const maybeRows: MaybeRow[] = [
      { name: "unknown", score: null },
      { name: "low", score: 5 },
      { name: "high", score: 10 },
    ];
    const maybeColumns: Column<MaybeRow>[] = [
      { id: "name", label: "Name", cell: (r) => r.name, rowHeader: true },
      { id: "score", label: "Score", cell: (r) => (r.score === null ? "—" : String(r.score)), sortBy: (r) => r.score, numeric: true },
    ];
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => <DataTable rows={maybeRows} columns={maybeColumns} caption="Keys" labels={labels} sort="client" />, host);
    const button = host.querySelector("thead button") as HTMLButtonElement;
    button.click();
    button.click();
    expect([...host.querySelectorAll("tbody th")].map((n) => n.textContent)).toEqual(["low", "high", "unknown"]);
  });
});
