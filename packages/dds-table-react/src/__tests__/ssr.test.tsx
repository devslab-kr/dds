import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DataTable } from "../index";

describe("SSR grid boundary", () => {
  it("renders a stable named placeholder without promising server rows", () => {
    const markup = renderToString(<DataTable rows={[{ name: "Server-only row" }]} columns={[{ field: "name" }]} label="Orders" placeholder="Preparing orders" />);
    expect(markup).toContain('role="region"');
    expect(markup).toContain('aria-label="Orders"');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("Preparing orders");
    expect(markup).not.toContain("Server-only row");
    expect(markup).not.toContain('role="grid"');
    expect(renderToString(<DataTable rows={[]} columns={[]} label="Inventory" />)).toContain('aria-label="Inventory"');
  });
});
