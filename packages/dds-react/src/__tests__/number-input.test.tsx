import { StrictMode, useState } from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NumberInput, normalizeNumberText } from "../number-input";

const tick = () =>
  act(() => new Promise<void>((resolve) => setTimeout(resolve, 40)));
const field = (host: HTMLElement) =>
  host.querySelector<HTMLInputElement>('input[role="spinbutton"]')!;
function type(input: HTMLInputElement, value: string) {
  act(() => {
    input.value = value;
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
  });
}
function key(input: HTMLInputElement, name: string) {
  const event = new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true });
  act(() => {
    input.dispatchEvent(event);
  });
  return event;
}
async function focus(input: HTMLInputElement) {
  act(() => input.focus());
  await tick();
}
async function blur(input: HTMLInputElement) {
  act(() => input.blur());
  await tick();
}
function press(button: HTMLButtonElement) {
  act(() => {
    button.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }));
    button.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, button: 0 }));
  });
}

describe("NumberInput", () => {
  it("labels a spinbutton, formats with thousands separators and describes its unit", () => {
    const { container: host } = render(
      <NumberInput label="금액" defaultValue={1234567} suffix="원" min={0} max={9999999} />,
    );
    const input = field(host);
    const label = host.querySelector("label")!;
    expect(label.htmlFor).toBe(input.id);
    expect(input.closest(".dds-number-input")!.id).toBe(`${input.id}-root`);
    expect(label.textContent).toBe("금액");
    expect(input.value).toBe("1,234,567");
    expect(input.getAttribute("aria-valuenow")).toBe("1234567");
    expect(input.getAttribute("aria-valuemin")).toBe("0");
    expect(input.getAttribute("aria-valuemax")).toBe("9999999");
    expect(input.inputMode).toBe("numeric");
    const suffix = document.getElementById(input.getAttribute("aria-describedby")!)!;
    expect(suffix.textContent).toBe("원");
    expect(input.getAttribute("aria-valuetext")).toBe("1,234,567 원");
  });

  it("gives each instance its own IDs under StrictMode", () => {
    const { container: host } = render(
      <StrictMode>
        <NumberInput label="하나" suffix="원" />
        <NumberInput label="둘" suffix="원" />
      </StrictMode>,
    );
    const ids = [...host.querySelectorAll("[id]")].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const label of host.querySelectorAll("label"))
      expect(document.getElementById(label.htmlFor)?.getAttribute("role")).toBe("spinbutton");
  });

  it("names its steppers in the locale and falls back to English outside Korean", () => {
    const { container: host } = render(
      <>
        <NumberInput label="수량" />
        <NumberInput label="Quantity" locale="en-US" messages={{ increase: "More" }} />
      </>,
    );
    const names = [...host.querySelectorAll("button")].map((button) => button.getAttribute("aria-label"));
    expect(names).toEqual(["값 줄이기", "값 늘리기", "Decrease", "More"]);
    expect(host.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("emits numbers for user edits, null for an empty field, and never 0 for empty", async () => {
    const change = vi.fn();
    const { container: host } = render(<NumberInput label="수량" onValueChange={change} />);
    const input = field(host);
    expect(input.value).toBe("");
    await focus(input);
    type(input, "1234");
    await tick();
    expect(change).toHaveBeenLastCalledWith(1234);
    type(input, "");
    await tick();
    expect(change).toHaveBeenLastCalledWith(null);
    await blur(input);
    expect(input.value).toBe("");
    expect(change).toHaveBeenCalledTimes(2);
  });

  it("reformats on blur without emitting a second change for the same number, also under StrictMode", async () => {
    for (const strict of [false, true]) {
      const change = vi.fn();
      const control = <NumberInput label="수량" onValueChange={change} />;
      const view = render(strict ? <StrictMode>{control}</StrictMode> : control);
      const input = field(view.container);
      await focus(input);
      type(input, "1234");
      await tick();
      await blur(input);
      expect(input.value).toBe("1,234");
      expect(change).toHaveBeenCalledExactlyOnceWith(1234);
      view.unmount();
    }
  });

  it("keeps controlled values owned by the parent and follows external updates", async () => {
    const change = vi.fn();
    let setValue: (next: number | null) => void = () => {};
    function Parent() {
      const [value, set] = useState<number | null>(5);
      setValue = set;
      return <NumberInput label="수량" value={value} onValueChange={change} />;
    }
    const { container: host } = render(<Parent />);
    const input = field(host);
    await focus(input);
    type(input, "7");
    await tick();
    expect(change).toHaveBeenLastCalledWith(7);
    // The parent declined 7: leaving the field shows the parent's value again.
    await blur(input);
    expect(input.value).toBe("5");
    act(() => setValue(3000));
    await tick();
    expect(input.value).toBe("3,000");
    act(() => setValue(null));
    await tick();
    expect(input.value).toBe("");
    expect(change).toHaveBeenCalledOnce();
  });

  it("steps with arrows, ten steps with PageUp/PageDown, and jumps to bounds with Home/End", async () => {
    const change = vi.fn();
    const { container: host } = render(
      <NumberInput label="수량" defaultValue={10} step={2} min={0} max={100} onValueChange={change} />,
    );
    const input = field(host);
    await focus(input);
    expect(key(input, "ArrowUp").defaultPrevented).toBe(true);
    await tick();
    expect(change).toHaveBeenLastCalledWith(12);
    key(input, "ArrowDown");
    await tick();
    expect(change).toHaveBeenLastCalledWith(10);
    expect(key(input, "PageUp").defaultPrevented).toBe(true);
    await tick();
    expect(change).toHaveBeenLastCalledWith(30);
    key(input, "PageDown");
    await tick();
    expect(change).toHaveBeenLastCalledWith(10);
    key(input, "End");
    await tick();
    expect(change).toHaveBeenLastCalledWith(100);
    key(input, "ArrowUp");
    await tick();
    expect(change).toHaveBeenCalledTimes(5);
    key(input, "Home");
    await tick();
    expect(change).toHaveBeenLastCalledWith(0);
  });

  it("leaves Home and End to the caret when there is no bound", async () => {
    const change = vi.fn();
    const { container: host } = render(
      <NumberInput label="수량" defaultValue={10} onValueChange={change} />,
    );
    const input = field(host);
    await focus(input);
    expect(key(input, "Home").defaultPrevented).toBe(false);
    expect(key(input, "End").defaultPrevented).toBe(false);
    await tick();
    expect(change).not.toHaveBeenCalled();
  });

  it("does not change on mouse wheel", async () => {
    const change = vi.fn();
    const { container: host } = render(
      <NumberInput label="수량" defaultValue={10} onValueChange={change} />,
    );
    const input = field(host);
    await focus(input);
    const wheel = new WheelEvent("wheel", { deltaY: -100, bubbles: true, cancelable: true });
    act(() => {
      input.dispatchEvent(wheel);
    });
    await tick();
    expect(wheel.defaultPrevented).toBe(false);
    expect(change).not.toHaveBeenCalled();
  });

  it("clamps to min/max on blur and is invalid while out of range", async () => {
    const change = vi.fn();
    const { container: host } = render(
      <NumberInput label="수량" min={1} max={50} onValueChange={change} />,
    );
    const input = field(host);
    const control = host.querySelector(".dds-number-input__control")!;
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    await focus(input);
    type(input, "80");
    await tick();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(control.hasAttribute("data-invalid")).toBe(true);
    await blur(input);
    expect(change).toHaveBeenLastCalledWith(50);
    expect(input.value).toBe("50");
    expect(input.hasAttribute("aria-invalid")).toBe(false);
  });

  it("stays valid while empty even when min is above zero", () => {
    const { container: host } = render(<NumberInput label="수량" min={1} />);
    expect(field(host).hasAttribute("aria-invalid")).toBe(false);
  });

  it("disables the stepper at its bound and steps with the buttons", async () => {
    const change = vi.fn();
    const { container: host } = render(
      <NumberInput label="수량" defaultValue={0} min={0} max={2} onValueChange={change} />,
    );
    const [decrease, increase] = [...host.querySelectorAll<HTMLButtonElement>("button")];
    expect(decrease!.disabled).toBe(true);
    expect(increase!.disabled).toBe(false);
    press(increase!);
    await tick();
    expect(change).toHaveBeenLastCalledWith(1);
    expect(decrease!.disabled).toBe(false);
  });

  it("refuses letters and converts full-width digits", async () => {
    const change = vi.fn();
    const { container: host } = render(<NumberInput label="수량" onValueChange={change} />);
    const input = field(host);
    await focus(input);
    type(input, "12a");
    await tick();
    expect(input.value).toBe("");
    expect(change).not.toHaveBeenCalled();
    type(input, "１２３");
    await tick();
    expect(change).toHaveBeenLastCalledWith(123);
    expect(input.value).toBe("123");
    expect(normalizeNumberText("－１，２３４．５")).toBe("-1,234.5");
  });

  it("refuses a disallowed character before it is inserted", async () => {
    const { container: host } = render(<NumberInput label="수량" min={0} />);
    const input = field(host);
    await focus(input);
    const letter = new InputEvent("beforeinput", { data: "a", bubbles: true, cancelable: true });
    const digit = new InputEvent("beforeinput", { data: "５", bubbles: true, cancelable: true });
    const minus = new InputEvent("beforeinput", { data: "-", bubbles: true, cancelable: true });
    input.dispatchEvent(letter);
    input.dispatchEvent(digit);
    input.dispatchEvent(minus);
    expect(letter.defaultPrevented).toBe(true);
    expect(digit.defaultPrevented).toBe(false);
    expect(minus.defaultPrevented).toBe(true);
  });

  it("waits for IME composition to finish before reading the text", async () => {
    const change = vi.fn();
    const { container: host } = render(<NumberInput label="수량" onValueChange={change} />);
    const input = field(host);
    await focus(input);
    act(() => {
      input.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    });
    type(input, "４５");
    await tick();
    expect(change).not.toHaveBeenCalled();
    expect(input.value).toBe("４５");
    act(() => {
      input.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "４５" }));
    });
    await tick();
    expect(change).toHaveBeenLastCalledWith(45);
  });

  it("accepts fractions only when the format allows them", async () => {
    const change = vi.fn();
    const { container: host } = render(
      <>
        <NumberInput label="정수" onValueChange={change} />
        <NumberInput label="소수" formatOptions={{ maximumFractionDigits: 2 }} onValueChange={change} />
      </>,
    );
    const [whole, decimal] = [...host.querySelectorAll<HTMLInputElement>('input[role="spinbutton"]')];
    await focus(whole!);
    type(whole!, "1.5");
    await tick();
    expect(change).not.toHaveBeenCalled();
    await focus(decimal!);
    expect(decimal!.inputMode).toBe("decimal");
    type(decimal!, "1.25");
    await tick();
    expect(change).toHaveBeenLastCalledWith(1.25);
  });

  it("refuses a minus sign when min is not negative", async () => {
    const change = vi.fn();
    const { container: host } = render(<NumberInput label="수량" min={0} onValueChange={change} />);
    const input = field(host);
    await focus(input);
    type(input, "-5");
    await tick();
    expect(input.value).toBe("");
    expect(change).not.toHaveBeenCalled();
  });

  it("does not change while read-only or disabled", async () => {
    const change = vi.fn();
    const { container: host } = render(
      <>
        <NumberInput label="읽기" defaultValue={3} readOnly onValueChange={change} />
        <NumberInput label="잠금" defaultValue={3} disabled onValueChange={change} />
      </>,
    );
    const [readonly, disabled] = [...host.querySelectorAll<HTMLInputElement>('input[role="spinbutton"]')];
    expect(readonly!.readOnly).toBe(true);
    expect(disabled!.disabled).toBe(true);
    await focus(readonly!);
    key(readonly!, "ArrowUp");
    key(readonly!, "PageUp");
    await tick();
    expect(change).not.toHaveBeenCalled();
    for (const button of host.querySelectorAll<HTMLButtonElement>("button")) expect(button.disabled).toBe(true);
    expect(host.querySelector(".dds-number-input")!.hasAttribute("data-readonly")).toBe(true);
  });

  it("submits the plain number, not the formatted text, and resets to its default", async () => {
    const change = vi.fn();
    const { container: host } = render(
      <form>
        <NumberInput label="금액" name="amount" defaultValue={1500} suffix="원" onValueChange={change} />
        <NumberInput label="비어 있음" name="empty" />
      </form>,
    );
    const form = host.querySelector("form")!;
    const input = field(host);
    expect(input.name).toBe("");
    expect(new FormData(form).get("amount")).toBe("1500");
    expect(new FormData(form).get("empty")).toBe("");
    await focus(input);
    type(input, "123456");
    await tick();
    await blur(input);
    expect(input.value).toBe("123,456");
    expect(new FormData(form).get("amount")).toBe("123456");
    change.mockClear();
    act(() => form.reset());
    await tick();
    expect(input.value).toBe("1,500");
    expect(new FormData(form).get("amount")).toBe("1500");
    expect(change).not.toHaveBeenCalled();
  });

  it("blocks form submission while required and empty", () => {
    const { container: host } = render(
      <form>
        <NumberInput label="수량" name="count" required />
      </form>,
    );
    const form = host.querySelector("form")!;
    expect(field(host).required).toBe(true);
    expect(form.checkValidity()).toBe(false);
  });

  it("hides its label visually but keeps it, or takes aria-label without one", () => {
    const { container: host } = render(
      <>
        <NumberInput label="숨김" labelPlacement="hidden" />
        <NumberInput aria-label="수량" placeholder="0" />
      </>,
    );
    const [hidden, bare] = [...host.querySelectorAll<HTMLElement>(".dds-number-input")];
    expect(hidden!.dataset.labelPlacement).toBe("hidden");
    expect(hidden!.querySelector("label")?.textContent).toBe("숨김");
    const input = field(bare!);
    expect(input.getAttribute("aria-label")).toBe("수량");
    expect(input.placeholder).toBe("0");
  });
});
