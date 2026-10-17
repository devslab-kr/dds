import { render } from "solid-js/web";
import { afterEach, expect, it, vi } from "vitest";
import { DropdownMenu } from "../dropdown-menu";
import { Popover } from "../popover";
it.each(["ltr", "rtl"] as const)(
  "opens and selects a %s submenu with a real active descendant",
  async (dir) => {
    const selected = vi.fn(),
      host = document.body.appendChild(document.createElement("div"));
    dispose = render(
      () => (
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
      ),
      host,
    );
    host.querySelector<HTMLButtonElement>("button")!.click();
    let parent!: HTMLElement;
    await vi.waitFor(() => {
      parent = document.querySelector<HTMLElement>(
        '[role="menu"][data-state="open"]',
      )!;
      expect(parent).toBeTruthy();
    });
    const key = (target: HTMLElement, key: string) =>
      target.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
      );
    key(parent, "Home");
    await vi.waitFor(() =>
      expect(
        document.getElementById(parent.getAttribute("aria-activedescendant")!)
          ?.textContent,
      ).toBe("First action"),
    );
    key(parent, "ArrowDown");
    await vi.waitFor(() =>
      expect(
        document.getElementById(parent.getAttribute("aria-activedescendant")!)
          ?.textContent,
      ).toBe("More actions"),
    );
    key(parent, dir === "rtl" ? "ArrowLeft" : "ArrowRight");
    let submenu!: HTMLElement;
    await vi.waitFor(() => {
      submenu = [
        ...document.querySelectorAll<HTMLElement>(
          '[role="menu"][data-state="open"]',
        ),
      ].find((element) => element !== parent)!;
      expect(submenu).toBeTruthy();
      expect(submenu.getAttribute("dir")).toBe(dir);
    });
    key(submenu, "Enter");
    await vi.waitFor(() =>
      expect(selected).toHaveBeenCalledExactlyOnceWith("archive"),
    );
  },
);
let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  document.body.replaceChildren();
});
it("runs menu actions and skips disabled items", async () => {
  const selected = vi.fn();
  const host = document.body.appendChild(document.createElement("div"));
  dispose = render(
    () => (
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
      </DropdownMenu.Root>
    ),
    host,
  );
  await vi.waitFor(() =>
    expect(document.querySelector('[role="menuitem"]')).not.toBeNull(),
  );
  (document.querySelector('[data-value="delete"]') as HTMLElement).click();
  expect(selected).not.toHaveBeenCalled();
  (document.querySelector('[data-value="edit"]') as HTMLElement).click();
  await vi.waitFor(() => expect(selected).toHaveBeenCalledTimes(1));
});
it("labels popover content and closes through its explicit close button", async () => {
  const host = document.body.appendChild(document.createElement("div"));
  dispose = render(
    () => (
      <Popover.Root defaultOpen>
        <Popover.Trigger>Filters</Popover.Trigger>
        <Popover.Content>
          <Popover.Title>Filter options</Popover.Title>
          <Popover.Description>Choose a filter</Popover.Description>
          <Popover.CloseTrigger>Close filters</Popover.CloseTrigger>
        </Popover.Content>
      </Popover.Root>
    ),
    host,
  );
  await vi.waitFor(() =>
    expect(document.querySelector('[role="dialog"]')).not.toBeNull(),
  );
  const content = document.querySelector('[role="dialog"]')!;
  expect(
    document.getElementById(content.getAttribute("aria-labelledby")!)
      ?.textContent,
  ).toBe("Filter options");
  await vi.waitFor(() =>
    expect(
      document.getElementById(content.getAttribute("aria-describedby")!)
        ?.textContent,
    ).toBe("Choose a filter"),
  );
  Array.from(document.querySelectorAll("button"))
    .find((b) => b.textContent === "Close filters")!
    .click();
  await vi.waitFor(() =>
    expect(
      document.querySelector('[role="dialog"]')?.getAttribute("data-state"),
    ).not.toBe("open"),
  );
});
