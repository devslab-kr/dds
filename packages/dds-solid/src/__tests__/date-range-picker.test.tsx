import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, expect, it, vi } from "vitest";
import { DateRangePicker, type DateRange } from "../date-range-picker";
import { DateRangePicker as RootDateRangePicker } from "../index";

let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.replaceChildren();
});
const mount = (view: () => unknown) => {
  const host = document.body.appendChild(document.createElement("div"));
  dispose = render(view as never, host);
  return host;
};
const inputs = (host: HTMLElement) =>
  [...host.querySelectorAll<HTMLInputElement>(".dds-date-range-input")] as [
    HTMLInputElement,
    HTMLInputElement,
  ];
const type = (input: HTMLInputElement, text: string) => {
  input.value = text;
  input.dispatchEvent(new InputEvent("input", { bubbles: true }));
};
const openContent = () =>
  document.querySelector<HTMLElement>(
    '.dds-date-range-content[data-state="open"]',
  );
const cell = (value: string) =>
  openContent()!.querySelector<HTMLElement>(
    `[data-part="table-cell-trigger"][data-value="${value}"]`,
  )!;

it("is exported from the root entry", () => {
  expect(RootDateRangePicker).toBe(DateRangePicker);
});

it("names the two inputs, groups them under the field label and displays Korean dates", () => {
  const host = mount(() => (
    <DateRangePicker
      label="조회 기간"
      defaultValue={{ start: "2026-10-01", end: "2026-10-20" }}
    />
  ));
  const [start, end] = inputs(host);
  expect(start.value).toBe("2026/10/01");
  expect(end.value).toBe("2026/10/20");
  expect(start.getAttribute("aria-label")).toBe("시작일");
  expect(end.getAttribute("aria-label")).toBe("종료일");
  const group = host.querySelector('[role="group"]')!;
  const label = document.getElementById(group.getAttribute("aria-labelledby")!)!;
  expect(label.textContent).toBe("조회 기간");
  expect(label.getAttribute("for")).toBe(start.id);
  expect(
    host.querySelector('[data-part="trigger"]')!.getAttribute("aria-label"),
  ).toBe("조회 기간 달력 열기");
});

it("commits typed sides, rejects an end before the start without swapping, and never emits it", async () => {
  const change = vi.fn();
  const host = mount(() => (
    <DateRangePicker
      label="Period"
      locale="en-US"
      defaultValue={{ start: "2026-10-05", end: "" }}
      onValueChange={change}
    />
  ));
  const [start, end] = inputs(host);
  type(end, "2026-10-02");
  await Promise.resolve();
  expect(end.value).toBe("2026-10-02");
  expect(start.value).toBe("2026-10-05");
  expect(end.getAttribute("aria-invalid")).toBe("true");
  expect(start.getAttribute("aria-invalid")).toBeNull();
  expect(end.validationMessage).toBe(
    "The end date must be on or after the start date.",
  );
  expect(host.querySelector('[role="alert"]')?.textContent).toBe(
    "The end date must be on or after the start date.",
  );
  expect(change).not.toHaveBeenCalled();
  type(start, "2026-10-01");
  await vi.waitFor(() =>
    expect(change).toHaveBeenLastCalledWith({
      start: "2026-10-01",
      end: "2026-10-02",
    }),
  );
  expect(end.getAttribute("aria-invalid")).toBeNull();
  // Incomplete text is kept as a draft and not reported.
  type(end, "2026-10-1");
  await Promise.resolve();
  expect(change).toHaveBeenCalledTimes(1);
  type(end, "");
  await vi.waitFor(() =>
    expect(change).toHaveBeenLastCalledWith({ start: "2026-10-01", end: "" }),
  );
});

it("selects a period in the calendar, previews nothing on close and focuses the end input", async () => {
  const [range, setRange] = createSignal<DateRange>({
    start: "2026-10-05",
    end: "2026-10-09",
  });
  const change = vi.fn((next: DateRange) => setRange(next));
  const host = mount(() => (
    <DateRangePicker
      label="Period"
      locale="en-US"
      value={range()}
      onValueChange={change}
      min="2026-10-03"
    />
  ));
  const trigger = host.querySelector<HTMLButtonElement>('[data-part="trigger"]')!;
  trigger.click();
  await vi.waitFor(() => expect(openContent()).not.toBeNull());
  expect(cell("2026-10-05").hasAttribute("data-range-start")).toBe(true);
  expect(cell("2026-10-07").hasAttribute("data-in-range")).toBe(true);
  expect(cell("2026-10-09").hasAttribute("data-range-end")).toBe(true);
  expect(cell("2026-10-02").getAttribute("aria-disabled")).toBe("true");
  // A half-chosen period is not emitted, and closing restores the committed one.
  cell("2026-10-12").click();
  await vi.waitFor(() =>
    expect(cell("2026-10-12").hasAttribute("data-selected")).toBe(true),
  );
  expect(change).not.toHaveBeenCalled();
  openContent()!.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  await vi.waitFor(() => expect(openContent()).toBeNull());
  trigger.click();
  await vi.waitFor(() => expect(openContent()).not.toBeNull());
  expect(cell("2026-10-05").hasAttribute("data-range-start")).toBe(true);
  cell("2026-10-20").click();
  await vi.waitFor(() =>
    expect(cell("2026-10-20").hasAttribute("data-selected")).toBe(true),
  );
  cell("2026-10-13").click();
  await vi.waitFor(() =>
    expect(change).toHaveBeenCalledWith({ start: "2026-10-13", end: "2026-10-20" }),
  );
  expect(change).toHaveBeenCalledTimes(1);
  const [start, end] = inputs(host);
  expect(start.value).toBe("2026-10-13");
  expect(end.value).toBe("2026-10-20");
  await vi.waitFor(() => expect(document.activeElement).toBe(end));
});

it("applies consumer presets, disables ones outside min/max, clears and returns Escape focus to the trigger", async () => {
  const change = vi.fn();
  const host = mount(() => (
    <DateRangePicker
      label="Period"
      locale="en-US"
      onValueChange={change}
      max="2026-12-31"
      presets={[
        { label: "October", value: { start: "2026-10-01", end: "2026-10-31" } },
        { label: "Next year", value: { start: "2027-01-01", end: "2027-01-31" } },
      ]}
    />
  ));
  const trigger = host.querySelector<HTMLButtonElement>('[data-part="trigger"]')!;
  trigger.click();
  await vi.waitFor(() => expect(openContent()).not.toBeNull());
  const buttons = [
    ...openContent()!.querySelectorAll<HTMLButtonElement>(
      '[role="group"][aria-label="Quick periods"] button',
    ),
  ];
  expect(buttons.map((button) => button.textContent)).toEqual([
    "October",
    "Next year",
  ]);
  expect(buttons[1]!.disabled).toBe(true);
  // Range mode has no single-date "Today" action.
  expect(openContent()!.textContent).not.toContain("Today");
  buttons[0]!.click();
  await vi.waitFor(() =>
    expect(change).toHaveBeenLastCalledWith({ start: "2026-10-01", end: "2026-10-31" }),
  );
  await vi.waitFor(() => expect(openContent()).toBeNull());
  trigger.click();
  await vi.waitFor(() => expect(openContent()).not.toBeNull());
  openContent()!
    .querySelector<HTMLButtonElement>('[data-part="clear-trigger"]')!
    .click();
  await vi.waitFor(() =>
    expect(change).toHaveBeenLastCalledWith({ start: "", end: "" }),
  );
  const [start, end] = inputs(host);
  expect([start.value, end.value]).toEqual(["", ""]);
  if (!openContent()) trigger.click();
  await vi.waitFor(() => expect(openContent()).not.toBeNull());
  openContent()!.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  await vi.waitFor(() => expect(openContent()).toBeNull());
  await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
});

it("submits API dates under startName/endName, blocks required submission and restores defaults on reset", async () => {
  const host = mount(() => (
    <form>
      <DateRangePicker
        label="조회 기간"
        startName="from"
        endName="to"
        required
        defaultValue={{ start: "2026-10-01", end: "2026-10-20" }}
      />
    </form>
  ));
  const form = host.querySelector("form")!;
  const [start, end] = inputs(host);
  expect(new FormData(form).get("from")).toBe("2026-10-01");
  expect(new FormData(form).get("to")).toBe("2026-10-20");
  // Display text never reaches the form data.
  expect([...new FormData(form).values()]).not.toContain("2026/10/01");
  type(end, "");
  await vi.waitFor(() => expect(new FormData(form).get("to")).toBe(""));
  expect(form.checkValidity()).toBe(false);
  expect(end.validationMessage).toBe("시작일과 종료일을 입력해 주세요.");
  type(start, "2026/10/03");
  type(end, "2026/10/04");
  await vi.waitFor(() => expect(new FormData(form).get("to")).toBe("2026-10-04"));
  expect(form.checkValidity()).toBe(true);
  form.reset();
  await vi.waitFor(() => expect(start.value).toBe("2026/10/01"));
  expect(end.value).toBe("2026/10/20");
  expect(new FormData(form).get("from")).toBe("2026-10-01");
  expect(new FormData(form).get("to")).toBe("2026-10-20");
});

it("does not submit a form on Enter in either input", () => {
  const submit = vi.fn((event: SubmitEvent) => event.preventDefault());
  const host = mount(() => (
    <form onSubmit={submit}>
      <DateRangePicker label="Period" locale="en-US" />
      <button type="submit">Send</button>
    </form>
  ));
  for (const input of inputs(host)) {
    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  }
});

it("locks typing and the calendar when disabled or read-only and reflects external invalid", async () => {
  const change = vi.fn();
  const [readOnly, setReadOnly] = createSignal(true);
  const host = mount(() => (
    <>
      <DateRangePicker label="Disabled" disabled startName="from" />
      <DateRangePicker
        label="Locked"
        locale="en-US"
        readOnly={readOnly()}
        invalid
        onValueChange={change}
        defaultValue={{ start: "2026-10-01", end: "2026-10-02" }}
      />
    </>
  ));
  const [disabledStart, disabledEnd, lockedStart] = [
    ...host.querySelectorAll<HTMLInputElement>(".dds-date-range-input"),
  ];
  expect(disabledStart!.disabled && disabledEnd!.disabled).toBe(true);
  const triggers = host.querySelectorAll<HTMLButtonElement>('[data-part="trigger"]');
  expect(triggers[0]!.disabled).toBe(true);
  expect(host.querySelector<HTMLInputElement>('input[name="from"]')!.disabled).toBe(true);
  expect(lockedStart!.readOnly).toBe(true);
  expect(lockedStart!.getAttribute("aria-invalid")).toBe("true");
  type(lockedStart!, "2026-09-01");
  await Promise.resolve();
  expect(change).not.toHaveBeenCalled();
  setReadOnly(false);
  type(lockedStart!, "2026-09-01");
  await vi.waitFor(() =>
    expect(change).toHaveBeenCalledWith({ start: "2026-09-01", end: "2026-10-02" }),
  );
});

it("keeps typed drafts across parent acknowledgements and resets on external values", async () => {
  const [range, setRange] = createSignal<DateRange>({ start: "2026-10-01", end: "" });
  const host = mount(() => (
    <DateRangePicker label="기간" value={range()} onValueChange={setRange} />
  ));
  const [start, end] = inputs(host);
  type(start, "2026/10/02");
  await Promise.resolve();
  expect(range()).toEqual({ start: "2026-10-02", end: "" });
  type(end, "2026/10/0");
  await Promise.resolve();
  // The parent echoes the value it already has: the partial end draft survives.
  setRange({ start: "2026-10-02", end: "" });
  await Promise.resolve();
  expect(end.value).toBe("2026/10/0");
  expect(start.value).toBe("2026/10/02");
  setRange({ start: "2026-11-01", end: "2026-11-30" });
  await vi.waitFor(() => expect(start.value).toBe("2026/11/01"));
  expect(end.value).toBe("2026/11/30");
});
