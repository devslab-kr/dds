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
