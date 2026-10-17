import { createRef } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Input, InputGroup } from "../input";
import { Field } from "../controls";

describe("Input", () => {
  it.each([
    "text",
    "search",
    "email",
    "tel",
    "url",
    "password",
    "number",
  ] as const)("forwards native %s semantics and ref", (type) => {
    const ref = createRef<HTMLInputElement>();
    render(
      <Input
        ref={ref}
        label="Value"
        type={type}
        name="value"
        defaultValue="12"
      />,
    );
    expect(ref.current).toBe(screen.getByLabelText("Value"));
    expect(ref.current).toHaveAttribute("type", type);
    expect(ref.current?.name).toBe("value");
  });
  it("keeps controlled values owned by the parent and accepts external updates", async () => {
    const change = vi.fn();
    const view = render(
      <Input label="Name" value="A" onValueChange={change} />,
    );
    await userEvent.type(screen.getByLabelText("Name"), "B");
    expect(change).toHaveBeenLastCalledWith("AB");
    expect(screen.getByLabelText("Name")).toHaveValue("A");
    view.rerender(<Input label="Name" value="C" onValueChange={change} />);
    expect(screen.getByLabelText("Name")).toHaveValue("C");
  });
  it("types, submits native data, clears once without a prior blur and invalidates required", async () => {
    const change = vi.fn();
    const native = vi.fn();
    const blur = vi.fn();
    render(
      <form>
        <Input
          label="Name"
          name="name"
          required
          clearable
          clearLabel="비우기"
          onValueChange={change}
          onChange={native}
          onBlur={blur}
        />
      </form>,
    );
    const input = screen.getByLabelText("Name") as HTMLInputElement;
    await userEvent.type(input, "Kim");
    expect(new FormData(input.form!).get("name")).toBe("Kim");
    expect(native).toHaveBeenCalledTimes(3);
    change.mockClear();
    await userEvent.click(screen.getByRole("button", { name: "비우기" }));
    expect(change).toHaveBeenCalledExactlyOnceWith("");
    expect(blur).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(input);
    expect(input.checkValidity()).toBe(false);
    expect(screen.queryByRole("button", { name: "비우기" })).toBeNull();
  });
  it.each(["readOnly", "disabled"] as const)(
    "does not clear %s input",
    (prop) => {
      render(
        <Input
          label="Locked"
          defaultValue="safe"
          clearable
          {...{ [prop]: true }}
        />,
      );
      expect(screen.queryByRole("button")).toBeNull();
      expect(screen.getByLabelText("Locked")).toHaveValue("safe");
    },
  );
  it("resets uncontrolled native values and clear visibility without a change notification", async () => {
    const change = vi.fn();
    render(
      <form>
        <Input
          label="Name"
          defaultValue="initial"
          clearable
          onValueChange={change}
        />
      </form>,
    );
    const input = screen.getByLabelText("Name") as HTMLInputElement;
    await userEvent.clear(input);
    change.mockClear();
    input.form!.reset();
    await waitFor(() => expect(input).toHaveValue("initial"));
    expect(screen.getByRole("button", { name: "내용 지우기" })).toBeTruthy();
    expect(change).not.toHaveBeenCalled();
  });
  it("changes label placement without replacing the focused input or losing selection", async () => {
    const view = render(
      <Input label="Name" labelPlacement="inside" defaultValue="initial" />,
    );
    const input = screen.getByLabelText("Name") as HTMLInputElement;
    input.focus();
    input.setSelectionRange(1, 3);
    view.rerender(
      <Input label="Name" labelPlacement="hidden" defaultValue="initial" />,
    );
    expect(screen.getByLabelText("Name")).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(1);
  });
  it("preserves Field descriptions and group slots without duplicating the label", () => {
    render(
      <Field label="Email" helpText="Work address">
        {(attrs) => (
          <InputGroup
            start={<span>@</span>}
            end={<button type="submit">Send</button>}
          >
            <Input {...attrs} type="email" />
          </InputGroup>
        )}
      </Field>,
    );
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "Work address",
    );
    expect(screen.getAllByLabelText("Email")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute(
      "type",
      "submit",
    );
  });
  it("prevents composing Enter submission while preserving native keyboard handlers", () => {
    const key = vi.fn();
    render(<Input aria-label="Search" onKeyDown={key} />);
    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      isComposing: true,
      bubbles: true,
      cancelable: true,
    });
    screen.getByLabelText("Search").dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(key).toHaveBeenCalledOnce();
    const escape = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    screen.getByLabelText("Search").dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(false);
  });
  it("keeps a controlled value during native reset and respects a cancelled reset", async () => {
    const change = vi.fn();
    const view = render(
      <form>
        <Input
          label="Name"
          value="owned"
          defaultValue="baseline"
          onValueChange={change}
        />
      </form>,
    );
    const input = screen.getByLabelText("Name") as HTMLInputElement;
    input.form!.reset();
    await waitFor(() => expect(input).toHaveValue("owned"));
    expect(change).not.toHaveBeenCalled();
    view.unmount();
    render(
      <form onReset={(event) => event.preventDefault()}>
        <Input label="Name" defaultValue="baseline" />
      </form>,
    );
    const uncontrolled = screen.getByLabelText("Name") as HTMLInputElement;
    await userEvent.clear(uncontrolled);
    await userEvent.type(uncontrolled, "edited");
    uncontrolled.form!.reset();
    await Promise.resolve();
    expect(uncontrolled).toHaveValue("edited");
  });
  it("lets keyboard users activate clear without submitting the form", async () => {
    const submit = vi.fn((event) => event.preventDefault());
    render(
      <form onSubmit={submit}>
        <Input label="Name" defaultValue="initial" clearable />
      </form>,
    );
    const input = screen.getByLabelText("Name");
    input.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "내용 지우기" }),
    );
    await userEvent.keyboard("{Enter}");
    expect(input).toHaveValue("");
    expect(document.activeElement).toBe(input);
    expect(submit).not.toHaveBeenCalled();
  });
});
