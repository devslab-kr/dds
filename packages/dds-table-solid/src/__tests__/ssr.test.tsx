import { renderToString } from "solid-js/web";
import { expect, it } from "vitest";
import { DataTable } from "../data-table";
import type { Column } from "../columns";

type Row = { name: string };
const columns: Column<Row>[] = [{ id: "name", label: "Name", cell: (r) => r.name, rowHeader: true }];

it("server-renders rows without touching the DOM", () => {
  const html = renderToString(() => (
    <DataTable rows={[{ name: "alpha" }]} columns={columns} caption="Keys" labels={{ sortBy: "Sort by {column}", actions: "Actions", nextPage: "Next page" }} />
  ));
  expect(html).toContain("<table");
  expect(html).toContain("alpha");
});

it("server-renders optional selection and resizing without DOM measurements", () => {
  const html = renderToString(() => <DataTable rows={[{ name: "alpha" }]} columns={columns} caption="Keys"
    labels={{ sortBy: "Sort by {column}", actions: "Actions", nextPage: "Next page" }}
    resizing={{ label: "Resize {column}" }} selection={{ rowId: row => row.name, selectedId: "alpha", onSelect: () => {} }} />);
  expect(html).toContain('role="separator"'); expect(html).toContain('aria-selected="true"');
});
