import { createFileRoute } from "@tanstack/solid-router";
import { DataTable } from "@devslab/dds-table";
import { createSignal, onMount } from "solid-js";
import "../../../dds-tokens/dist/tokens.css";
import "../../../dds-css/dist/dds.css";

type Row = { id: string; name: string; count: number };
const rows: Row[] = [
  { id: "a", name: "alpha", count: 2 },
  { id: "b", name: "beta", count: 10 },
];

export const Route = createFileRoute("/table")({ component: CanaryTable });

function CanaryTable() {
  const [selectedId, setSelectedId] = createSignal<string | null>(null);
  onMount(() => document.documentElement.setAttribute("data-canary-table-hydrated", "true"));
  return (
    <main data-hydration-key="canary-table">
      <DataTable
        rows={rows}
        caption="Canary table"
        labels={{ sortBy: "Sort by {column}", actions: "Actions", nextPage: "Next page" }}
        sort="client"
        resizing={{ label: "Resize {column}" }}
        selection={{ rowId: row => row.id, selectedId: selectedId(), onSelect: row => setSelectedId(row.id) }}
        columns={[
          { id: "name", label: "Name", cell: (row) => row.name, sortBy: (row) => row.name, rowHeader: true },
          { id: "count", label: "Count", cell: (row) => String(row.count), sortBy: (row) => row.count, numeric: true },
        ]}
      />
      <p role="status">Selected row: {selectedId() ?? "none"}</p>
    </main>
  );
}
