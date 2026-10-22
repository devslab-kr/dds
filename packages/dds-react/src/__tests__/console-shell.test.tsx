import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { LeftNav } from "../left-nav";
import { ConsoleShell, type ConsoleNavGroup } from "../console-shell";
const base = {
  surface: "test", activePath: "/products", brand: { href: "/", name: "DevsLab", mark: "/mark.svg" },
  labels: { skip: "Skip", menuOpen: "Open menu", menuClose: "Close menu", nav: "Navigation", badge: "{count} items" },
  header: { title: "Products" }, children: "Content",
};
const nav: ConsoleNavGroup[] = [
  { id: "services", label: "Services", collapsible: true, items: [{ id: "products", href: "/products", label: "Products", icon: <svg data-testid="product-icon" /> }] },
  { id: "settings", label: "Settings", collapsible: true, items: [{ id: "policies", href: "/policies", label: "Policies" }] },
];
it("keeps legacy groups expanded without disclosure buttons", () => {
  render(<ConsoleShell {...base} nav={[{ label: "Legacy", items: nav[0]!.items }]} />);
  expect(screen.getByRole("link", { name: "Products" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Legacy" })).toBeNull();
});
it("opens the active group by default and toggles groups independently by keyboard", async () => {
  const user = userEvent.setup();
  render(<ConsoleShell {...base} nav={nav} />);
  const services = screen.getByRole("button", { name: "Services" });
  const settings = screen.getByRole("button", { name: "Settings" });
  expect(services).toHaveAttribute("aria-expanded", "true");
  expect(settings).toHaveAttribute("aria-expanded", "false");
  expect(document.getElementById(settings.getAttribute("aria-controls")!)).not.toBeVisible();
  settings.focus(); await user.keyboard("{Enter}");
  expect(screen.getByRole("link", { name: "Policies" })).toBeVisible();
  expect(services).toHaveAttribute("aria-expanded", "true");
  services.focus(); await user.keyboard(" ");
  expect(screen.queryByRole("link", { name: "Products" })).toBeNull();
  expect(services).toHaveFocus();
});
it("honors an empty default and hides decorative icons from accessible names", async () => {
  render(<ConsoleShell {...base} nav={nav} defaultExpandedGroups={[]} />);
  expect(screen.getByRole("button", { name: "Services" })).toHaveAttribute("aria-expanded", "false");
  await userEvent.click(screen.getByRole("button", { name: "Services" }));
  expect(screen.getByRole("link", { name: "Products" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByTestId("product-icon").parentElement).toHaveAttribute("aria-hidden", "true");
});
it("supports externally controlled state without changing it before the parent updates", async () => {
  const changed = vi.fn();
  const { rerender } = render(<ConsoleShell {...base} nav={nav} expandedGroups={[]} onExpandedGroupsChange={changed} />);
  await userEvent.click(screen.getByRole("button", { name: "Settings" }));
  expect(changed).toHaveBeenCalledWith(["settings"]);
  expect(screen.getByRole("button", { name: "Settings" })).toHaveAttribute("aria-expanded", "false");
  rerender(<ConsoleShell {...base} nav={nav} expandedGroups={["settings"]} onExpandedGroupsChange={changed} />);
  expect(screen.getByRole("link", { name: "Policies" })).toBeVisible();
});
it("assigns distinct disclosure targets to multiple shells", () => {
  render(<><ConsoleShell {...base} nav={nav} /><ConsoleShell {...base} nav={nav} /></>);
  const ids = screen.getAllByRole("button", { name: "Services" }).map(button => button.getAttribute("aria-controls"));
  expect(new Set(ids).size).toBe(2);
  for (const id of ids) expect(document.getElementById(id!)).not.toBeNull();
});

it("composes a standalone menu inside the shell navigation slot", async () => {
  const navigate = vi.fn();
  render(<ConsoleShell {...base} navigation={<LeftNav surface="test" activePath="/products" nav={nav} labels={base.labels} onNavigate={navigate} />} />);
  expect(screen.getAllByRole("navigation")).toHaveLength(1);
  await userEvent.click(screen.getByRole("link", { name: "Products" }));
  expect(navigate).toHaveBeenCalledOnce();
  await userEvent.click(screen.getByRole("button", { name: "Settings" }));
  expect(screen.getByRole("link", { name: "Policies" })).toBeVisible();
});
