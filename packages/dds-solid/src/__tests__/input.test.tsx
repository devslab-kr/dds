import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Input, InputGroup } from "../input";
import { Field } from "../controls";
let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  document.body.replaceChildren();
});
function mount(view: () => any) {
  const host = document.body.appendChild(document.createElement("div"));
  dispose = render(view, host);
  return host;
}
function edit(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new InputEvent("input", { bubbles: true }));
}
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
    let input!: HTMLInputElement;
    const host = mount(() => (
      <Input
        ref={input}
        label="Value"
        type={type}
        name="value"
        defaultValue="12"
      />
    ));
    expect(host.querySelector("input")).toBe(input);
    expect(input.type).toBe(type);
    expect(input.name).toBe("value");
    expect(host.querySelector("label")?.htmlFor).toBe(input.id);
  });
  it("keeps controlled values owned by the parent and follows external updates", () => {
    const [value, setValue] = createSignal("A");
    const change = vi.fn();
    const host = mount(() => (
      <Input label="Name" value={value()} onValueChange={change} />
    ));
    const input = host.querySelector("input")!;
    edit(input, "AB");
    expect(change).toHaveBeenCalledExactlyOnceWith("AB");
    expect(input.value).toBe("A");
    setValue("C");
    expect(input.value).toBe("C");
  });
  it("types native form data and clears once without pointer blur, invalidating required", () => {
    const change = vi.fn();
    const native = vi.fn();
    const blur = vi.fn();
    const host = mount(() => (
      <form>
        <Input
          label="Name"
          name="name"
          required
          clearable
          clearLabel="비우기"
          onValueChange={change}
          onInput={native}
          onBlur={blur}
        />
      </form>
    ));
    const input = host.querySelector("input")!;
    input.focus();
    edit(input, "Kim");
    expect(new FormData(input.form!).get("name")).toBe("Kim");
    expect(native).toHaveBeenCalledOnce();
    change.mockClear();
    const button = host.querySelector("button")!;
    const pointer = new MouseEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
    });
    button.dispatchEvent(pointer);
    expect(pointer.defaultPrevented).toBe(true);
    button.click();
    expect(change).toHaveBeenCalledExactlyOnceWith("");
    expect(blur).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(input);
    expect(input.checkValidity()).toBe(false);
    expect(host.querySelector("button")).toBeNull();
  });
  it.each(["readonly", "disabled"] as const)(
    "does not clear %s input",
    (prop) => {
      const host = mount(() => (
        <Input
          label="Locked"
          defaultValue="safe"
          clearable
          {...{ [prop]: true }}
        />
      ));
      expect(host.querySelector("button")).toBeNull();
      expect(host.querySelector("input")!.value).toBe("safe");
    },
  );
  it("resets native uncontrolled values and button visibility without notifying edits", async () => {
    const change = vi.fn();
    const host = mount(() => (
      <form>
        <Input
          label="Name"
          defaultValue="initial"
          clearable
          onValueChange={change}
        />
      </form>
    ));
    const input = host.querySelector("input")!;
    edit(input, "");
    change.mockClear();
    input.form!.reset();
    await vi.waitFor(() => expect(input.value).toBe("initial"));
    expect(host.querySelector("button")?.getAttribute("aria-label")).toBe(
      "내용 지우기",
    );
    expect(change).not.toHaveBeenCalled();
  });
  it("changes floating/hidden label placement without replacing input or selection", () => {
    const [placement, setPlacement] = createSignal<"inside" | "hidden">(
      "inside",
    );
    const host = mount(() => (
      <Input label="Name" labelPlacement={placement()} defaultValue="initial" />
    ));
    const input = host.querySelector("input")!;
    input.focus();
    input.setSelectionRange(1, 3);
    setPlacement("hidden");
    expect(host.querySelector("input")).toBe(input);
    expect(input.selectionStart).toBe(1);
    expect(document.activeElement).toBe(input);
    expect(host.querySelector("label")?.htmlFor).toBe(input.id);
  });
  it("preserves Field linkage and InputGroup consumer slots", () => {
    const host = mount(() => (
      <Field label="Email" helpText="Work address">
        {(attrs) => (
          <InputGroup
            start={<span>@</span>}
            end={<button type="submit">Send</button>}
          >
            <Input {...attrs} type="email" />
          </InputGroup>
        )}
      </Field>
    ));
    const input = host.querySelector("input")!;
    expect(host.querySelectorAll("label")).toHaveLength(1);
    expect(host.querySelector("label")?.htmlFor).toBe(input.id);
    expect(
      document.getElementById(input.getAttribute("aria-describedby")!)
        ?.textContent,
    ).toBe("Work address");
    expect(host.querySelector("button")?.type).toBe("submit");
  });
  it("prevents composing Enter while preserving the native key handler and Escape", () => {
    const key = vi.fn();
    const host = mount(() => <Input aria-label="Search" onKeyDown={key} />);
    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      isComposing: true,
      bubbles: true,
      cancelable: true,
    });
    host.querySelector("input")!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(key).toHaveBeenCalledOnce();
    const escape = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    host.querySelector("input")!.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(false);
  });
  it("keeps a controlled value on reset and respects cancelled resets", async () => {
    const change = vi.fn();
    const host = mount(() => (
      <form>
        <Input
          label="Name"
          value="owned"
          defaultValue="baseline"
          onValueChange={change}
        />
      </form>
    ));
    const input = host.querySelector("input")!;
    input.form!.reset();
    await vi.waitFor(() => expect(input.value).toBe("owned"));
    expect(change).not.toHaveBeenCalled();
    input.form!.addEventListener("reset", (event) => event.preventDefault());
    input.value = "temporary";
    input.form!.reset();
    await Promise.resolve();
    expect(input.value).toBe("temporary");
  });
  it("keeps clear keyboard focusable and out of native form submission", () => {
    const host = mount(() => (
      <form>
        <Input label="Name" defaultValue="initial" clearable />
      </form>
    ));
    const button = host.querySelector("button")!;
    expect(button.type).toBe("button");
    expect(button.tabIndex).toBe(0);
    button.focus();
    button.click();
    expect(document.activeElement).toBe(host.querySelector("input"));
    expect(host.querySelector("input")!.value).toBe("");
  });
  it("follows changing external form ownership when restoring controlled values on reset", async () => {
    const [form, setForm] = createSignal("form-a");
    const [value, setValue] = createSignal("A");
    const host = mount(() => (
      <>
        <form id="form-a" />
        <form id="form-b" />
        <Input
          label="Name"
          form={form()}
          value={value()}
          defaultValue="baseline"
        />
      </>
    ));
    const input = host.querySelector("input")!;
    setForm("form-b");
    setValue("B");
    expect(input.form?.id).toBe("form-b");
    input.form!.reset();
    await vi.waitFor(() => expect(input.value).toBe("B"));
  });
});
