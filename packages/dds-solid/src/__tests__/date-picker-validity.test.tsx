import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, expect, it, vi } from "vitest";
import { DatePicker } from "../date-picker";
let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  document.body.replaceChildren();
});
it("preserves invalid drafts and reports required/range validity without committing", async () => {
  const host = document.body.appendChild(document.createElement("div"));
  const change = vi.fn(),
    validity = vi.fn();
  dispose = render(
    () => (
      <DatePicker
        label="날짜"
        value="2024-02-29"
        onChange={change}
        required
        min="2024-02-01"
        onValidityChange={validity}
      />
    ),
    host,
  );
  const input = host.querySelector("input")!;
  expect(input.value).toBe("2024/02/29");
  input.value = "2023/02/29";
  input.dispatchEvent(new InputEvent("input", { bubbles: true }));
  await vi.waitFor(() =>
    expect(validity).toHaveBeenLastCalledWith(
      expect.objectContaining({
        inputValue: "2023/02/29",
        reason: "invalid",
        value: null,
      }),
    ),
  );
  expect(input.value).toBe("2023/02/29");
  expect(change).not.toHaveBeenCalled();
  expect(input.checkValidity()).toBe(false);
  input.value = "";
  input.dispatchEvent(new InputEvent("input", { bubbles: true }));
  await vi.waitFor(() =>
    expect(validity).toHaveBeenLastCalledWith(
      expect.objectContaining({ reason: "required" }),
    ),
  );
  expect(change).toHaveBeenCalledWith("");
});
it("keeps partial drafts on delayed repeated acknowledgements and resets on external dates", async () => {
  const host = document.body.appendChild(document.createElement("div"));
  const [value, setValue] = createSignal("2026-10-12");
  const change = vi.fn();
  dispose = render(
    () => <DatePicker label="날짜" value={value()} onChange={change} />,
    host,
  );
  const input = host.querySelector("input")!;
  for (const next of ["2026/10/13", "2026/10/14", "2026/10/13", "2026/1"]) {
    input.value = next;
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
  }
  for (const echo of ["2026-10-13", "2026-10-14", "2026-10-13"]) {
    setValue(echo);
    await Promise.resolve();
    expect(input.value).toBe("2026/1");
  }
  setValue("2026-10-20");
  await vi.waitFor(() => expect(input.value).toBe("2026/10/20"));
});

it("changes locale without transient invalidity or redundant callback identity reports", async () => {
  const host = document.body.appendChild(document.createElement("div"));
  const validity = vi.fn();
  const [locale, setLocale] = createSignal("ko-KR");
  const [callback, setCallback] = createSignal((state: unknown) =>
    validity(state),
  );
  dispose = render(
    () => (
      <DatePicker
        label="날짜"
        value="2024-02-29"
        onChange={() => {}}
        locale={locale()}
        onValidityChange={callback()}
      />
    ),
    host,
  );
  const input = host.querySelector("input")!;
  await vi.waitFor(() => expect(validity).toHaveBeenCalledTimes(1));
  setCallback(() => (state: unknown) => validity(state));
  await Promise.resolve();
  expect(validity).toHaveBeenCalledTimes(1);
  setLocale("en-US");
  await vi.waitFor(() => expect(input.value).toBe("2024-02-29"));
  expect(validity.mock.calls.every(([state]) => state.valid)).toBe(true);
  expect(host.querySelector("input")).toBe(input);
});

it("keeps a focused input mounted when label placement changes", async () => {
  const host = document.body.appendChild(document.createElement("div"));
  const [placement, setPlacement] = createSignal<
    "outside" | "inside" | "hidden"
  >("outside");
  dispose = render(
    () => (
      <DatePicker
        label="날짜"
        value="2024-02-29"
        onChange={() => {}}
        labelPlacement={placement()}
      />
    ),
    host,
  );
  const input = host.querySelector("input")!;
  input.focus();
  input.setSelectionRange(2, 4);
  setPlacement("inside");
  setPlacement("hidden");
  await Promise.resolve();
  expect(host.querySelector("input")).toBe(input);
  expect(document.activeElement).toBe(input);
  expect(input.selectionStart).toBe(2);
});
