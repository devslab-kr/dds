import "@testing-library/jest-dom/vitest";
import { createSignal, type JSX } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, expect, it, vi } from "vitest";
import { Combobox } from "../combobox";
import { SelectPicker } from "../select-picker";
import { TimePicker } from "../time-picker";
HTMLElement.prototype.scrollTo = vi.fn();
let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  document.body.replaceChildren();
});
const items = [
  { value: "a", label: "Apple" },
  { value: "b", label: "Banana" },
];
it("keeps selected labels outside replacement results and does not commit drafts", async () => {
  const host = document.body.appendChild(document.createElement("div"));
  const [options, setOptions] = createSignal(items);
  const changed = vi.fn();
  dispose = render(
    () => (
      <Combobox
        label="Fruit"
        items={options()}
        value="a"
        selectedOption={items[0]!}
        filterMode="external"
        onValueChange={changed}
      />
    ),
    host,
  );
  setOptions([items[1]!]);
  const input = host.querySelector(
    'input[role="combobox"]',
  ) as HTMLInputElement;
  expect(input.value).toBe("Apple");
  input.value = "zzz";
  input.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: "zzz",
    }),
  );
  await vi.waitFor(() =>
    expect(document.querySelector('[role="option"]')?.textContent).toContain(
      "Banana",
    ),
  );
  expect(changed).not.toHaveBeenCalled();
});
it("clears once, preserves ID form data, focuses visible input on invalid and resets", async () => {
  const host = document.body.appendChild(document.createElement("div"));
  const changed = vi.fn(),
    inputChanged = vi.fn();
  dispose = render(
    () => (
      <form>
        <Combobox
          label="Fruit"
          items={items}
          defaultValue="a"
          name="fruit"
          required
          clearable
          onValueChange={changed}
          onInputValueChange={inputChanged}
        />
      </form>
    ),
    host,
  );
  expect(new FormData(host.querySelector("form")!).get("fruit")).toBe("a");
  host.querySelector<HTMLButtonElement>(".dds-choice-clear")!.click();
  expect(changed).toHaveBeenCalledExactlyOnceWith("");
  expect(inputChanged).toHaveBeenCalledExactlyOnceWith("");
  expect(host.querySelector("form")!.checkValidity()).toBe(false);
  expect(document.activeElement).toBe(host.querySelector('[role="combobox"]'));
  host.querySelector("form")!.reset();
  await vi.waitFor(() =>
    expect(
      (host.querySelector('[role="combobox"]') as HTMLInputElement).value,
    ).toBe("Apple"),
  );
});
it("does not open a readOnly picker and localizes loading/error/retry", () => {
  const host = document.body.appendChild(document.createElement("div"));
  const retry = vi.fn();
  dispose = render(
    () => (
      <>
        <SelectPicker label="Fruit" items={items} value="a" readOnly />
        <Combobox label="Search" items={[]} error="Failed" onRetry={retry} />
      </>
    ),
    host,
  );
  host.querySelector<HTMLButtonElement>('[role="combobox"]')!.click();
  expect(
    host.querySelector('[role="combobox"]')?.getAttribute("aria-expanded"),
  ).toBe("false");
  expect(host.textContent).toContain("Failed");
  host.querySelector<HTMLButtonElement>(".dds-choice-retry")!.click();
  expect(retry).toHaveBeenCalledOnce();
});
it("filters locally and commits only the chosen ID, with IME Enter protection", async () => {
  const host = document.body.appendChild(document.createElement("div"));
  const changed = vi.fn();
  dispose = render(
    () => <Combobox label="Fruit" items={items} onValueChange={changed} />,
    host,
  );
  const input = host.querySelector<HTMLInputElement>('[role="combobox"]')!;
  input.focus();
  input.value = "Ban";
  input.dispatchEvent(new InputEvent("input", { bubbles: true, data: "Ban" }));
  await vi.waitFor(() =>
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(1),
  );
  expect(changed).not.toHaveBeenCalled();
  input.dispatchEvent(
    new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
  );
  input.dispatchEvent(
    new CompositionEvent("compositionstart", { bubbles: true }),
  );
  input.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      isComposing: true,
    }),
  );
  expect(changed).not.toHaveBeenCalled();
  input.dispatchEvent(
    new CompositionEvent("compositionend", { bubbles: true }),
  );
  document.querySelector<HTMLElement>('[role="option"]')!.click();
  await vi.waitFor(() => expect(changed).toHaveBeenCalledExactlyOnceWith("b"));
});
it("pins a far keyboard-active option without rendering a hidden native option list", async () => {
  const host = document.body.appendChild(document.createElement("div"));
  const many = Array.from({ length: 10000 }, (_, index) => ({
    value: `id-${index}`,
    label: `Item ${index}`,
  }));
  dispose = render(
    () => (
      <SelectPicker
        label="Large"
        items={many}
        virtualization={{ itemHeight: 32 }}
      />
    ),
    host,
  );
  host.querySelector<HTMLButtonElement>('[role="combobox"]')!.click();
  await vi.waitFor(() =>
    expect(document.querySelector('[role="listbox"]')).not.toBeNull(),
  );
  document
    .querySelector<HTMLElement>('[role="listbox"]')!
    .dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
  await vi.waitFor(() => {
    const id = document
      .querySelector('[role="listbox"]')
      ?.getAttribute("aria-activedescendant");
    expect(id).toBeTruthy();
    expect(document.getElementById(id!)?.textContent).toContain("Item 9999");
    expect(document.getElementById(id!)!.style.height).toBe("40px");
  });
  expect(document.querySelectorAll('[role="option"]').length).toBeLessThan(30);
  expect(document.querySelectorAll("option")).toHaveLength(0);
});
it("honors cancelled reset and preserves the controlled value after native reset", async () => {
  const host = document.body.appendChild(document.createElement("div"));
  const [cancel, setCancel] = createSignal(true);
  const [selected, setSelected] = createSignal<string | undefined>(undefined);
  dispose = render(
    () => (
      <form
        onReset={(event) => {
          if (cancel()) event.preventDefault();
        }}
      >
        <Combobox
          label="Fruit"
          items={items}
          {...(selected() === undefined ? {} : { value: selected()! })}
          defaultValue="a"
          name="fruit"
          clearable
        />
      </form>
    ),
    host,
  );
  host.querySelector<HTMLButtonElement>(".dds-choice-clear")!.click();
  host.querySelector("form")!.reset();
  await Promise.resolve();
  expect(host.querySelector<HTMLInputElement>('[role="combobox"]')!.value).toBe(
    "",
  );
  setCancel(false);
  setSelected("b");
  host.querySelector("form")!.reset();
  await vi.waitFor(() =>
    expect(
      host.querySelector<HTMLInputElement>('[role="combobox"]')!.value,
    ).toBe("Banana"),
  );
  expect(new FormData(host.querySelector("form")!).get("fruit")).toBe("b");
});
it.each(["controlled", "default"] as const)(
  "resets an off-list %s selection to its supplied label",
  async (mode) => {
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(
      () => (
        <form>
          <Combobox
            label="Remote"
            items={[]}
            selectedOption={{ value: "remote", label: "Remote label" }}
            {...(mode === "controlled"
              ? { value: "remote" }
              : { defaultValue: "remote" })}
          />
        </form>
      ),
      host,
    );
    const input = host.querySelector<HTMLInputElement>('[role="combobox"]')!;
    input.value = "draft";
    input.dispatchEvent(
      new InputEvent("input", { bubbles: true, data: "draft" }),
    );
    host.querySelector("form")!.reset();
    await vi.waitFor(() => expect(input.value).toBe("Remote label"));
  },
);
it("restores controlled query after blur, changed selection and reset with one notification", async () => {
  const host = document.body.appendChild(document.createElement("div"));
  const [query, setQuery] = createSignal("Apple"),
    [selected, setSelected] = createSignal("a");
  const notify = vi.fn();
  dispose = render(
    () => (
      <form>
        <Combobox
          label="Fruit"
          items={items}
          value={selected()}
          inputValue={query()}
          onInputValueChange={(next) => {
            notify(next);
            setQuery(next);
          }}
        />
      </form>
    ),
    host,
  );
  const input = host.querySelector<HTMLInputElement>('[role="combobox"]')!;
  input.focus();
  input.value = "draft";
  input.dispatchEvent(
    new InputEvent("input", { bubbles: true, data: "draft" }),
  );
  await vi.waitFor(() => expect(query()).toBe("draft"));
  notify.mockClear();
  input.blur();
  await vi.waitFor(() => expect(input.value).toBe("Apple"));
  expect(notify).toHaveBeenCalledExactlyOnceWith("Apple");
  notify.mockClear();
  setSelected("b");
  await vi.waitFor(() => expect(input.value).toBe("Banana"));
  expect(notify).toHaveBeenCalledExactlyOnceWith("Banana");
  input.value = "draft";
  input.dispatchEvent(
    new InputEvent("input", { bubbles: true, data: "draft" }),
  );
  await vi.waitFor(() => expect(query()).toBe("draft"));
  notify.mockClear();
  host.querySelector("form")!.reset();
  await vi.waitFor(() => expect(input.value).toBe("Banana"));
  expect(notify).toHaveBeenCalledExactlyOnceWith("Banana");
});
it("moves its reset bridge when the associated form changes", async () => {
  const host = document.body.appendChild(document.createElement("div"));
  const [form, setForm] = createSignal("form-a");
  dispose = render(
    () => (
      <>
        <form id="form-a" />
        <form id="form-b" />
        <Combobox
          label="Fruit"
          items={items}
          value="b"
          name="fruit"
          form={form()}
        />
      </>
    ),
    host,
  );
  setForm("form-b");
  const input = host.querySelector<HTMLInputElement>('[role="combobox"]')!;
  input.value = "draft";
  input.dispatchEvent(
    new InputEvent("input", { bubbles: true, data: "draft" }),
  );
  host.querySelector<HTMLFormElement>("#form-b")!.reset();
  await vi.waitFor(() => expect(input.value).toBe("Banana"));
  expect(
    new FormData(host.querySelector<HTMLFormElement>("#form-b")!).get("fruit"),
  ).toBe("b");
});
it.each<[string, (id: string) => JSX.Element, string]>([
  ["Combobox", (id) => <Combobox id={id} items={items} />, 'input[role="combobox"]'],
  ["TimePicker", (id) => <TimePicker id={id} />, 'input[role="combobox"]'],
  ["SelectPicker", (id) => <SelectPicker id={id} items={items} />, 'button[role="combobox"]'],
])("%s puts its id on the visible control so an outside label names it", (_, field, selector) => {
  // A form field that renders its own <label for={id}> (FM's Field) and hands the control that id.
  const host = document.body.appendChild(document.createElement("div"));
  dispose = render(
    () => (
      <>
        <label for="pickup-cutoff">마감 시간</label>
        {field("pickup-cutoff")}
      </>
    ),
    host,
  );
  const control = host.querySelector<HTMLElement>(selector)!;
  expect(document.querySelectorAll('[id="pickup-cutoff"]')).toHaveLength(1);
  expect(document.getElementById("pickup-cutoff")).toBe(control);
  // The element a label click focuses and activates.
  expect(host.querySelector("label")!.control).toBe(control);
  expect(control).toHaveAccessibleName("마감 시간");
});
