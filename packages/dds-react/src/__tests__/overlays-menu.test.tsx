import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { expect, it, onTestFinished, vi } from "vitest";
import { DropdownMenu } from "../dropdown-menu";
import { Popover } from "../popover";
import { StrictMode } from "react";
import userEvent from "@testing-library/user-event";

// Zag moves focus into a menu on the next animation frame, after the menu is
// already visible (a submenu opened from the keyboard is even highlighted by
// then). Slow frames turn "keys sent before focus arrived" from an occasional
// CI failure into one that happens every run.
function slowAnimationFrames(ms: number) {
  const timers = new Set<number>();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      callback(performance.now());
    }, ms);
    timers.add(id);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    timers.delete(id);
    window.clearTimeout(id);
  });
  onTestFinished(() => {
    for (const id of timers) window.clearTimeout(id);
    vi.unstubAllGlobals();
  });
}

// Keys go to the focused element, so a menu is ready for keys once focus is in it.
const expectFocusWithin = (element: HTMLElement) =>
  expect(element).toContainElement(document.activeElement as HTMLElement);

it.each([
  ["ltr", "normal"],
  ["rtl", "normal"],
  ["ltr", "slow"],
  ["rtl", "slow"],
] as const)(
  "opens and selects a %s submenu after StrictMode mounts with %s frames",
  async (dir, frames) => {
    if (frames === "slow") slowAnimationFrames(200);
    const selected = vi.fn(),
      user = userEvent.setup();
    render(
      <StrictMode>
        <DropdownMenu.Root dir={dir}>
          <DropdownMenu.Trigger>Parent actions</DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item value="first">First action</DropdownMenu.Item>
            <DropdownMenu.Submenu dir={dir} onSelect={selected}>
              <DropdownMenu.SubmenuTrigger>
                More actions
              </DropdownMenu.SubmenuTrigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item value="archive">
                  Archive action
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Submenu>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </StrictMode>,
    );
    await user.click(screen.getByRole("button", { name: "Parent actions" }));
    const parent = await screen.findByRole("menu", { name: "Parent actions" });
    await waitFor(() => expectFocusWithin(parent));
    await user.keyboard("{Home}{ArrowDown}");
    await waitFor(() => {
      const active = document.getElementById(
        parent.getAttribute("aria-activedescendant")!,
      );
      expect(active).toHaveTextContent("More actions");
    });
    await user.keyboard(dir === "rtl" ? "{ArrowLeft}" : "{ArrowRight}");
    const submenu = await screen.findByRole("menu", { name: "More actions" });
    expect(submenu).toHaveAttribute("dir", dir);
    // Until focus moves in, Enter lands on the parent's "More actions" item and
    // only reopens the submenu, so nothing is selected.
    await waitFor(() => {
      expectFocusWithin(submenu);
      const active = document.getElementById(
        submenu.getAttribute("aria-activedescendant")!,
      );
      expect(active).toHaveTextContent("Archive action");
    });
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(selected).toHaveBeenCalledExactlyOnceWith("archive"),
    );
  },
);

it("runs menu actions and skips disabled items", async () => {
  const selected = vi.fn();
  render(
    <DropdownMenu.Root defaultOpen>
      <DropdownMenu.Trigger>Actions</DropdownMenu.Trigger>
      <DropdownMenu.Content aria-label="Actions">
        <DropdownMenu.Item value="edit" onSelect={selected}>
          Edit
        </DropdownMenu.Item>
        <DropdownMenu.Item value="delete" disabled onSelect={selected}>
          Delete
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>,
  );
  fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
  expect(selected).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
  await waitFor(() => expect(selected).toHaveBeenCalledTimes(1));
});

it("labels popover content and closes through its explicit close button", async () => {
  render(
    <Popover.Root defaultOpen>
      <Popover.Trigger>Filters</Popover.Trigger>
      <Popover.Content>
        <Popover.Title>Filter options</Popover.Title>
        <Popover.Description>Choose a filter</Popover.Description>
        <Popover.CloseTrigger aria-label="Close filters">
          Close filters
        </Popover.CloseTrigger>
      </Popover.Content>
    </Popover.Root>,
  );
  expect(
    await screen.findByRole("dialog", { name: "Filter options" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("dialog", { name: "Filter options" }),
  ).toHaveAccessibleDescription("Choose a filter");
  fireEvent.click(screen.getByRole("button", { name: "Close filters" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});
