import { createRef } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { act } from "react";
import { AgGridReact } from "ag-grid-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataTable, ddsGridTheme } from "../index";

afterEach(cleanup);
describe("DDS grid integration", () => {
  it("forwards native API, row changes and a custom React cell renderer", async () => {
    const gridRef = createRef<AgGridReact<{ name: string }>>();
    const regionRef = createRef<HTMLDivElement>();
    const columns = [{ field: "name" as const, cellRenderer: ({ value }: { value: string }) => <strong>{value}</strong> }];
    const onGridReady = vi.fn();
    const view = render(<DataTable ref={regionRef} gridRef={gridRef} rows={[{ name: "Alpha" }]} columns={columns} label="Names" gridProps={{ onGridReady, suppressColumnVirtualisation: true }} />);
    await waitFor(() => expect(gridRef.current?.api.getDisplayedRowCount()).toBe(1));
    expect(regionRef.current).toBe(screen.getByRole("region", { name: "Names" }));
    expect(onGridReady).toHaveBeenCalledOnce();
    expect(screen.getByText("Alpha").tagName).toBe("STRONG");
    expect(screen.getByRole("grid").getAttribute("aria-label")).toBe("Names");
    const api = gridRef.current!.api;
    view.rerender(<DataTable ref={regionRef} gridRef={gridRef} rows={[{ name: "Beta" }, { name: "Gamma" }]} columns={columns} label="Updated names" density="dense" />);
    await waitFor(() => expect(api.getDisplayedRowCount()).toBe(2));
    expect(api.getDisplayedRowAtIndex(0)?.data?.name).toBe("Beta");
    expect(screen.getByRole("grid").getAttribute("aria-label")).toBe("Updated names");
    expect(api.getGridOption("rowHeight")).toBe(32);
    view.unmount();
    expect(api.isDestroyed()).toBe(true);
    expect(gridRef.current).toBeNull();
    expect(regionRef.current).toBeNull();
  });

  it("honors native theme and column configuration while naming loading and empty grids", async () => {
    const gridRef = createRef<AgGridReact<{ name: string }>>();
    const theme = ddsGridTheme.withParams({ fontSize: 18 });
    const view = render(<DataTable rows={[]} columns={[{ field: "name" }]} label="Empty results" gridRef={gridRef} gridProps={{ gridOptions: { theme }, defaultColDef: { sortable: false, minWidth: 200 }, loading: true }} />);
    await waitFor(() => expect(gridRef.current?.api).toBeDefined());
    expect(screen.getByRole("region", { name: "Empty results" }).getAttribute("aria-busy")).toBe("true");
    expect(gridRef.current!.api.getGridOption("theme")).toBe(theme);
    expect(gridRef.current!.api.getColumn("name")?.getColDef().sortable).toBe(false);
    expect(gridRef.current!.api.getColumn("name")?.getColDef().minWidth).toBe(200);
    view.rerender(<DataTable rows={[]} columns={[{ field: "name" }]} label="Empty results" gridRef={gridRef} gridProps={{ loading: false }} />);
    await waitFor(() => expect(screen.getByRole("region", { name: "Empty results" }).getAttribute("aria-busy")).toBe("false"));
    expect(gridRef.current!.api.getDisplayedRowCount()).toBe(0);
  });

  it("hydrates the named SSR placeholder before mounting AG Grid", async () => {
    const ui = <DataTable rows={[]} columns={[]} label="Hydrated orders" placeholder="Preparing" />;
    const container = document.createElement("div");
    container.innerHTML = renderToString(ui);
    document.body.append(container);
    const recoverable = vi.fn();
    const initialRegion = container.firstElementChild;
    let root: ReturnType<typeof hydrateRoot>;
    await act(async () => { root = hydrateRoot(container, ui, { onRecoverableError: recoverable }); });
    await waitFor(() => expect(container.querySelector('[role="grid"]')).not.toBeNull());
    expect(container.firstElementChild).toBe(initialRegion);
    expect(recoverable).not.toHaveBeenCalled();
    await act(async () => root!.unmount());
    container.remove();
  });

  it("preserves React 19 callback ref cleanup on the native grid", async () => {
    const cleanupRef = vi.fn();
    let instance: AgGridReact<{ name: string }> | null = null;
    const view = render(<DataTable<{ name: string }> rows={[]} columns={[{ field: "name" }]} label="Callback refs" gridRef={(grid) => { instance = grid; return cleanupRef; }} />);
    await waitFor(() => expect(instance?.api).toBeDefined());
    view.unmount();
    expect(cleanupRef).toHaveBeenCalledOnce();
  });
});
