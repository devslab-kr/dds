import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { Combobox } from "../combobox";
import { SelectPicker } from "../select-picker";
import { TimePicker } from "../time-picker";
// jsdom has no scrolling geometry; actual virtual scrolling is tested in browsers.
HTMLElement.prototype.scrollTo = vi.fn();
const items = [
  { value: "a", label: "Apple" },
  { value: "b", label: "Banana" },
  { value: "c", label: "Cherry", disabled: true },
];
it("filters locally without committing typing, then submits the selected ID", async () => {
  const changed = vi.fn();
  const user = userEvent.setup();
  const { container } = render(
    <form>
      <Combobox
        label="Fruit"
        items={items}
        name="fruit"
        onValueChange={changed}
      />
    </form>,
  );
  await user.type(screen.getByRole("combobox"), "Ban");
  expect(changed).not.toHaveBeenCalled();
  await user.click(await screen.findByRole("option", { name: "Banana" }));
  expect(changed).toHaveBeenCalledExactlyOnceWith("b");
  expect(new FormData(container.querySelector("form")!).get("fruit")).toBe("b");
});
it("keeps externally selected labels across result replacement and restores on blur", async () => {
  const user = userEvent.setup();
  const { rerender } = render(
    <Combobox
      label="Fruit"
      items={items}
      value="a"
      selectedOption={items[0]}
      filterMode="external"
    />,
  );
  rerender(
    <Combobox
      label="Fruit"
      items={[items[1]!]}
      value="a"
      selectedOption={items[0]}
      filterMode="external"
    />,
  );
  expect(screen.getByRole("combobox")).toHaveValue("Apple");
  await user.clear(screen.getByRole("combobox"));
  await user.type(screen.getByRole("combobox"), "zzz");
  expect(
    await screen.findByRole("option", { name: "Banana" }),
  ).toBeInTheDocument();
  await user.tab();
  await waitFor(() =>
    expect(screen.getByRole("combobox")).toHaveValue("Apple"),
  );
});
it("clears each state once, redirects invalid focus, and resets uncontrolled forms", async () => {
  const selected = vi.fn(),
    input = vi.fn();
  const user = userEvent.setup();
  const { container } = render(
    <form>
      <Combobox
        label="Fruit"
        items={items}
        defaultValue="a"
        name="fruit"
        required
        clearable
        onValueChange={selected}
        onInputValueChange={input}
      />
      <button type="reset">Reset</button>
    </form>,
  );
  await user.click(screen.getByRole("button", { name: "선택 지우기" }));
  expect(selected).toHaveBeenCalledExactlyOnceWith("");
  expect(input).toHaveBeenCalledExactlyOnceWith("");
  expect(container.querySelector("form")!.checkValidity()).toBe(false);
  expect(screen.getByRole("combobox")).toHaveFocus();
  await user.click(screen.getByText("Reset"));
  await waitFor(() =>
    expect(screen.getByRole("combobox")).toHaveValue("Apple"),
  );
});
it("supports SelectPicker ID changes and prevents readOnly opening", async () => {
  const user = userEvent.setup();
  function Example() {
    const [value, setValue] = useState("a");
    return (
      <SelectPicker
        label="Fruit"
        items={items}
        value={value}
        onValueChange={setValue}
      />
    );
  }
  const { rerender } = render(<Example />);
  await user.click(screen.getByRole("combobox"));
  await user.click(await screen.findByRole("option", { name: "Banana" }));
  expect(screen.getByRole("combobox")).toHaveTextContent("Banana");
  rerender(<SelectPicker label="Fruit" items={items} value="a" readOnly />);
  await user.click(screen.getByRole("combobox"));
  expect(screen.getByRole("combobox")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});
it("announces distinct loading and error states and retries without submitting", async () => {
  const retry = vi.fn(),
    submit = vi.fn();
  const user = userEvent.setup();
  const { rerender } = render(
    <form onSubmit={submit}>
      <Combobox label="Fruit" items={[]} loading />
    </form>,
  );
  expect(screen.getByRole("status")).toHaveTextContent("불러오는 중");
  rerender(
    <form onSubmit={submit}>
      <Combobox label="Fruit" items={[]} error="Failed" onRetry={retry} />
    </form>,
  );
  expect(screen.getByRole("status")).toHaveTextContent("Failed");
  await user.click(screen.getByRole("button", { name: "다시 시도" }));
  expect(retry).toHaveBeenCalledOnce();
  expect(submit).not.toHaveBeenCalled();
});
it("keeps an IME Enter from committing an active option", async () => {
  const changed = vi.fn();
  const user = userEvent.setup();
  render(<Combobox label="Fruit" items={items} onValueChange={changed} />);
  const input = screen.getByRole("combobox");
  await user.click(input);
  await user.keyboard("{ArrowDown}");
  await screen.findByRole("listbox");
  await user.keyboard("{Home}");
  await waitFor(() => {
    const id = input.getAttribute("aria-activedescendant");
    expect(id).toBeTruthy();
    expect(document.getElementById(id!)).toHaveTextContent("Apple");
  });
  fireEvent.compositionStart(input);
  fireEvent.keyDown(input, { key: "Enter", code: "Enter", isComposing: true });
  expect(changed).not.toHaveBeenCalled();
  expect(screen.getByRole("listbox")).toBeVisible();
  fireEvent.compositionEnd(input);
  await user.keyboard("{Enter}");
  await waitFor(() => expect(changed).toHaveBeenCalledExactlyOnceWith("a"));
});
it("keeps 10000-option rendering bounded and mounts the keyboard active descendant", async () => {
  const many = Array.from({ length: 10000 }, (_, index) => ({
    value: `id-${index}`,
    label: `Item ${index}`,
  }));
  const user = userEvent.setup();
  render(
    <SelectPicker
      label="Large"
      items={many}
      virtualization={{ itemHeight: 32 }}
    />,
  );
  const trigger = screen.getByRole("combobox");
  await user.click(trigger);
  // The list takes focus on the next frame; an End still on the trigger is dropped.
  await waitFor(() => expect(screen.getByRole("listbox")).toHaveFocus());
  await user.keyboard("{End}");
  await waitFor(() => {
    const id = screen
      .getByRole("listbox")
      .getAttribute("aria-activedescendant");
    expect(id).toBeTruthy();
    expect(document.getElementById(id!)).toHaveTextContent("Item 9999");
    expect(document.getElementById(id!)!.style.height).toBe("40px");
  });
  expect(screen.getAllByRole("option").length).toBeLessThan(30);
  expect(document.querySelectorAll("option")).toHaveLength(0);
});
it("honors cancelled reset and keeps controlled display and ID after a native reset", async () => {
  const user = userEvent.setup();
  const { container, rerender } = render(
    <form onReset={(event) => event.preventDefault()}>
      <Combobox label="Fruit" items={items} defaultValue="a" clearable />
    </form>,
  );
  await user.click(screen.getByRole("button", { name: "선택 지우기" }));
  container.querySelector("form")!.reset();
  await Promise.resolve();
  expect(screen.getByRole("combobox")).toHaveValue("");
  rerender(
    <form>
      <Combobox label="Fruit" items={items} value="b" name="fruit" />
    </form>,
  );
  container.querySelector("form")!.reset();
  await waitFor(() =>
    expect(screen.getByRole("combobox")).toHaveValue("Banana"),
  );
  expect(new FormData(container.querySelector("form")!).get("fruit")).toBe("b");
});
it.each(["controlled", "default"] as const)(
  "resets an off-list %s selection to its supplied label",
  async (mode) => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Combobox
          label="Remote"
          items={[]}
          selectedOption={{ value: "remote", label: "Remote label" }}
          {...(mode === "controlled"
            ? { value: "remote" }
            : { defaultValue: "remote" })}
        />
      </form>,
    );
    await user.clear(screen.getByRole("combobox"));
    await user.type(screen.getByRole("combobox"), "draft");
    container.querySelector("form")!.reset();
    await waitFor(() =>
      expect(screen.getByRole("combobox")).toHaveValue("Remote label"),
    );
  },
);
it("restores a controlled query on blur, external selection and reset without duplicate notifications", async () => {
  const notify = vi.fn();
  const user = userEvent.setup();
  function Example({ selected = "a" }: { selected?: string }) {
    const [query, setQuery] = useState("Apple");
    return (
      <form>
        <Combobox
          label="Fruit"
          items={items}
          value={selected}
          inputValue={query}
          onInputValueChange={(next) => {
            notify(next);
            setQuery(next);
          }}
        />
      </form>
    );
  }
  const { container, rerender } = render(<Example />);
  await user.clear(screen.getByRole("combobox"));
  await user.type(screen.getByRole("combobox"), "draft");
  notify.mockClear();
  await user.tab();
  await waitFor(() =>
    expect(screen.getByRole("combobox")).toHaveValue("Apple"),
  );
  expect(notify).toHaveBeenCalledExactlyOnceWith("Apple");
  notify.mockClear();
  rerender(<Example selected="b" />);
  await waitFor(() =>
    expect(screen.getByRole("combobox")).toHaveValue("Banana"),
  );
  expect(notify).toHaveBeenCalledExactlyOnceWith("Banana");
  rerender(<Example selected="b" />);
  expect(notify).toHaveBeenCalledTimes(1);
  await user.clear(screen.getByRole("combobox"));
  await user.type(screen.getByRole("combobox"), "draft");
  notify.mockClear();
  container.querySelector("form")!.reset();
  await waitFor(() =>
    expect(screen.getByRole("combobox")).toHaveValue("Banana"),
  );
  expect(notify).toHaveBeenCalledExactlyOnceWith("Banana");
});
it.each([
  ["Combobox", <Combobox id="pickup-cutoff" items={items} />, 'input[role="combobox"]'],
  ["TimePicker", <TimePicker id="pickup-cutoff" />, 'input[role="combobox"]'],
  ["SelectPicker", <SelectPicker id="pickup-cutoff" items={items} />, 'button[role="combobox"]'],
] as const)("%s puts its id on the visible control so an outside label names it", (_, field, selector) => {
  // A form field that renders its own <label htmlFor={id}> and hands the control that id.
  const { container } = render(
    <>
      <label htmlFor="pickup-cutoff">마감 시간</label>
      {field}
    </>,
  );
  const control = container.querySelector<HTMLElement>(selector)!;
  expect(document.querySelectorAll('[id="pickup-cutoff"]')).toHaveLength(1);
  expect(document.getElementById("pickup-cutoff")).toBe(control);
  // The element a label click focuses and activates.
  expect(container.querySelector("label")!.control).toBe(control);
  expect(control).toHaveAccessibleName("마감 시간");
});
