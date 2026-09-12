import axe from "axe-core";
import { render } from "solid-js/web";
import { afterEach, expect, it } from "vitest";

import { DataTable } from "../data-table";
import type { Column } from "../columns";

type Row = { name: string; count: number };
const rows: Row[] = [{ name: "beta", count: 2 }, { name: "alpha", count: 10 }];
const labels = { sortBy: "Sort by {column}", actions: "Actions", nextPage: "Next page" };
const columns: Column<Row>[] = [
  { id: "name", label: "Name", cell: (r) => r.name, sortBy: (r) => r.name, rowHeader: true },
  { id: "count", label: "Count", cell: (r) => String(r.count), sortBy: (r) => r.count, numeric: true },
];

let dispose: (() => void) | undefined;
afterEach(() => { dispose?.(); dispose = undefined; document.body.replaceChildren(); });

it("a sortable DataTable has no detectable axe violations", async () => {
  const host = document.body.appendChild(document.createElement("main"));
  dispose = render(() => <DataTable rows={rows} columns={columns} caption="Keys" labels={labels} sort="client" />, host);
  const result = await axe.run(host, { rules: { "color-contrast": { enabled: false } } });
  expect(result.violations).toEqual([]);
});
