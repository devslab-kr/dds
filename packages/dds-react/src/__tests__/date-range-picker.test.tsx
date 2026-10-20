import { StrictMode, useState, type ReactNode } from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { DateRangePicker, type DateRange } from "../date-range-picker";
import { DateRangePicker as RootDateRangePicker } from "../index";

// Every case runs under StrictMode: double effects must not double-emit or lose drafts.
const mount = (view: ReactNode) =>
  render(<StrictMode>{view}</StrictMode>).container;
const inputs = (host: HTMLElement) =>
  [...host.querySelectorAll<HTMLInputElement>(".dds-date-range-input")] as [
    HTMLInputElement,
    HTMLInputElement,
  ];
const type = (input: HTMLInputElement, text: string) =>
  fireEvent.input(input, { target: { value: text } });
const openContent = () =>
  document.querySelector<HTMLElement>(
    '.dds-date-range-content[data-state="open"]',
  );
const cell = (value: string) =>
  openContent()!.querySelector<HTMLElement>(
    `[data-part="table-cell-trigger"][data-value="${value}"]`,
  )!;
const escape = () =>
  fireEvent.keyDown(openContent()!, { key: "Escape", bubbles: true });

it("is exported from the root entry", () => {
  expect(RootDateRangePicker).toBe(DateRangePicker);
});

it("names the two inputs, groups them under the field label and displays Korean dates", () => {
  const host = mount(
    <DateRangePicker
      label="조회 기간"
      defaultValue={{ start: "2026-10-01", end: "2026-10-20" }}
    />,
  );
  const [start, end] = inputs(host);
  expect(start.value).toBe("2026/10/01");
  expect(end.value).toBe("2026/10/20");
  expect(start.getAttribute("aria-label")).toBe("시작일");
  expect(end.getAttribute("aria-label")).toBe("종료일");
  expect(end.id).toBe(`${start.id}-end`);
  const group = host.querySelector('[role="group"]')!;
  const label = document.getElementById(
    group.getAttribute("aria-labelledby")!,
  )!;
  expect(label.textContent).toBe("조회 기간");
  expect(label.getAttribute("for")).toBe(start.id);
  expect(
    host.querySelector('[data-part="trigger"]')!.getAttribute("aria-label"),
  ).toBe("조회 기간 달력 열기");
});

it("commits typed sides, rejects an end before the start without swapping, and never emits it", async () => {
  const change = vi.fn();
  const host = mount(
    <DateRangePicker
      label="Period"
      locale="en-US"
      defaultValue={{ start: "2026-10-05", end: "" }}
      onValueChange={change}
    />,
  );
  const [start, end] = inputs(host);
  type(end, "2026-10-02");
  expect(end.value).toBe("2026-10-02");
  expect(start.value).toBe("2026-10-05");
  expect(end.getAttribute("aria-invalid")).toBe("true");
  expect(start.getAttribute("aria-invalid")).toBeNull();
  await waitFor(() =>
    expect(end.validationMessage).toBe(
      "The end date must be on or after the start date.",
    ),
  );
  expect(host.querySelector('[role="alert"]')?.textContent).toBe(
    "The end date must be on or after the start date.",
  );
  expect(change).not.toHaveBeenCalled();
  type(start, "2026-10-01");
  await waitFor(() =>
    expect(change).toHaveBeenLastCalledWith({
      start: "2026-10-01",
      end: "2026-10-02",
    }),
  );
  expect(end.getAttribute("aria-invalid")).toBeNull();
  // Incomplete text is kept as a draft and not reported.
  type(end, "2026-10-1");
  expect(end.value).toBe("2026-10-1");
  expect(change).toHaveBeenCalledTimes(1);
  type(end, "");
  await waitFor(() =>
    expect(change).toHaveBeenLastCalledWith({ start: "2026-10-01", end: "" }),
  );
  expect(change).toHaveBeenCalledTimes(2);
});

it("keeps both drafts when the two inputs change before React renders", async () => {
  const change = vi.fn();
  const host = mount(
    <DateRangePicker label="Period" locale="en-US" onValueChange={change} />,
  );
  const [start, end] = inputs(host);
  // Two native input events in one task: the second must not read a stale start draft.
  act(() => {
    for (const [input, text] of [
      [start, "2026-10-03"],
      [end, "2026-10-04"],
    ] as const) {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(input, text);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  await waitFor(() =>
    expect(change).toHaveBeenLastCalledWith({
      start: "2026-10-03",
      end: "2026-10-04",
    }),
  );
  expect([start.value, end.value]).toEqual(["2026-10-03", "2026-10-04"]);
});

it("selects a period in the calendar, previews nothing on close and focuses the end input", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  function Controlled() {
    const [range, setRange] = useState<DateRange>({
      start: "2026-10-05",
      end: "2026-10-09",
    });
    return (
      <DateRangePicker
        label="Period"
        locale="en-US"
        value={range}
        onValueChange={(next) => {
          change(next);
          setRange(next);
        }}
        min="2026-10-03"
      />
    );
  }
  const host = mount(<Controlled />);
  const trigger = host.querySelector<HTMLButtonElement>(
    '[data-part="trigger"]',
  )!;
  await user.click(trigger);
  await waitFor(() => expect(openContent()).not.toBeNull());
  expect(cell("2026-10-05").hasAttribute("data-range-start")).toBe(true);
  expect(cell("2026-10-07").hasAttribute("data-in-range")).toBe(true);
  expect(cell("2026-10-09").hasAttribute("data-range-end")).toBe(true);
  expect(cell("2026-10-02").getAttribute("aria-disabled")).toBe("true");
  // A half-chosen period is not emitted, and closing restores the committed one.
  await user.click(cell("2026-10-12"));
  await waitFor(() =>
    expect(cell("2026-10-12").hasAttribute("data-selected")).toBe(true),
  );
  expect(change).not.toHaveBeenCalled();
  escape();
  await waitFor(() => expect(openContent()).toBeNull());
  await user.click(trigger);
  await waitFor(() => expect(openContent()).not.toBeNull());
  expect(cell("2026-10-05").hasAttribute("data-range-start")).toBe(true);
  await user.click(cell("2026-10-20"));
  await waitFor(() =>
    expect(cell("2026-10-20").hasAttribute("data-selected")).toBe(true),
  );
  await user.click(cell("2026-10-13"));
  await waitFor(() =>
    expect(change).toHaveBeenCalledWith({
      start: "2026-10-13",
      end: "2026-10-20",
    }),
  );
  expect(change).toHaveBeenCalledTimes(1);
  const [start, end] = inputs(host);
  expect(start.value).toBe("2026-10-13");
  expect(end.value).toBe("2026-10-20");
  await waitFor(() => expect(document.activeElement).toBe(end));
});

it("keeps focus inside the calendar when it opens in range mode", async () => {
  const user = userEvent.setup();
  const host = mount(
    <DateRangePicker
      label="Period"
      locale="en-US"
      defaultValue={{ start: "2026-10-05", end: "2026-10-09" }}
    />,
  );
  await user.click(host.querySelector<HTMLButtonElement>('[data-part="trigger"]')!);
  await waitFor(() => expect(openContent()).not.toBeNull());
  await waitFor(() =>
    expect(document.activeElement).toBe(cell("2026-10-05")),
  );
  await user.keyboard("{ArrowRight}");
  await waitFor(() =>
    expect(document.activeElement).toBe(cell("2026-10-06")),
  );
  expect(openContent()!.contains(document.activeElement)).toBe(true);
});

it("applies consumer presets, disables ones outside min/max, clears and returns Escape focus to the trigger", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  const host = mount(
    <DateRangePicker
      label="Period"
      locale="en-US"
      onValueChange={change}
      max="2026-12-31"
      presets={[
        { label: "October", value: { start: "2026-10-01", end: "2026-10-31" } },
        {
          label: "Next year",
          value: { start: "2027-01-01", end: "2027-01-31" },
        },
      ]}
    />,
  );
  const trigger = host.querySelector<HTMLButtonElement>(
    '[data-part="trigger"]',
  )!;
  await user.click(trigger);
  await waitFor(() => expect(openContent()).not.toBeNull());
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
  await user.click(buttons[0]!);
  await waitFor(() =>
    expect(change).toHaveBeenLastCalledWith({
      start: "2026-10-01",
      end: "2026-10-31",
    }),
  );
  await waitFor(() => expect(openContent()).toBeNull());
  await user.click(trigger);
  await waitFor(() => expect(openContent()).not.toBeNull());
  await user.click(
    openContent()!.querySelector<HTMLButtonElement>(
      '[data-part="clear-trigger"]',
    )!,
  );
  await waitFor(() =>
    expect(change).toHaveBeenLastCalledWith({ start: "", end: "" }),
  );
  const [start, end] = inputs(host);
  expect([start.value, end.value]).toEqual(["", ""]);
  if (!openContent()) await user.click(trigger);
  await waitFor(() => expect(openContent()).not.toBeNull());
  escape();
  await waitFor(() => expect(openContent()).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});

it("submits API dates under startName/endName, blocks required submission and restores defaults on reset", async () => {
  const host = mount(
    <form>
      <DateRangePicker
        label="조회 기간"
        startName="from"
        endName="to"
        required
        defaultValue={{ start: "2026-10-01", end: "2026-10-20" }}
      />
    </form>,
  );
  const form = host.querySelector("form")!;
  const [start, end] = inputs(host);
  expect(new FormData(form).get("from")).toBe("2026-10-01");
  expect(new FormData(form).get("to")).toBe("2026-10-20");
  // Display text never reaches the form data.
  expect([...new FormData(form).values()]).not.toContain("2026/10/01");
  type(end, "");
  await waitFor(() => expect(new FormData(form).get("to")).toBe(""));
  await waitFor(() => expect(form.checkValidity()).toBe(false));
  expect(end.validationMessage).toBe("시작일과 종료일을 입력해 주세요.");
  type(start, "2026/10/03");
  type(end, "2026/10/04");
  await waitFor(() =>
    expect(new FormData(form).get("to")).toBe("2026-10-04"),
  );
  await waitFor(() => expect(form.checkValidity()).toBe(true));
  act(() => form.reset());
  await waitFor(() => expect(start.value).toBe("2026/10/01"));
  expect(end.value).toBe("2026/10/20");
  expect(new FormData(form).get("from")).toBe("2026-10-01");
  expect(new FormData(form).get("to")).toBe("2026-10-20");
});

it("restores after the browser rewrites the inputs on a user reset", async () => {
  const user = userEvent.setup();
  const host = mount(
    <form>
      <DateRangePicker
        label="Period"
        locale="en-US"
        startName="from"
        endName="to"
        defaultValue={{ start: "2026-10-01", end: "2026-10-20" }}
      />
      <button type="reset">Reset</button>
    </form>,
  );
  const [start, end] = inputs(host);
  type(start, "2026-10-05");
  type(end, "2026-10-0");
  await user.click(host.querySelector<HTMLButtonElement>('[type="reset"]')!);
  await waitFor(() => expect(start.value).toBe("2026-10-01"));
  expect(end.value).toBe("2026-10-20");
  expect(new FormData(host.querySelector("form")!).get("from")).toBe(
    "2026-10-01",
  );
});

it("does not submit a form on Enter in either input", () => {
  const submit = vi.fn((event: { preventDefault(): void }) =>
    event.preventDefault(),
  );
  const host = mount(
    <form onSubmit={submit}>
      <DateRangePicker label="Period" locale="en-US" />
      <button type="submit">Send</button>
    </form>,
  );
  for (const input of inputs(host)) {
    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      input.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
  }
  expect(submit).not.toHaveBeenCalled();
});

it("locks typing and the calendar when disabled or read-only and reflects external invalid", async () => {
  const change = vi.fn();
  let unlock: () => void = () => {};
  function Locked() {
    const [readOnly, setReadOnly] = useState(true);
    unlock = () => setReadOnly(false);
    return (
      <>
        <DateRangePicker label="Disabled" disabled startName="from" />
        <DateRangePicker
          label="Locked"
          locale="en-US"
          readOnly={readOnly}
          invalid
          onValueChange={change}
          defaultValue={{ start: "2026-10-01", end: "2026-10-02" }}
        />
      </>
    );
  }
  const host = mount(<Locked />);
  const [disabledStart, disabledEnd, lockedStart] = [
    ...host.querySelectorAll<HTMLInputElement>(".dds-date-range-input"),
  ];
  expect(disabledStart!.disabled && disabledEnd!.disabled).toBe(true);
  const triggers = host.querySelectorAll<HTMLButtonElement>(
    '[data-part="trigger"]',
  );
  expect(triggers[0]!.disabled).toBe(true);
  expect(
    host.querySelector<HTMLInputElement>('input[name="from"]')!.disabled,
  ).toBe(true);
  expect(lockedStart!.readOnly).toBe(true);
  expect(lockedStart!.getAttribute("aria-invalid")).toBe("true");
  type(lockedStart!, "2026-09-01");
  expect(change).not.toHaveBeenCalled();
  act(() => unlock());
  type(lockedStart!, "2026-09-01");
  await waitFor(() =>
    expect(change).toHaveBeenCalledWith({
      start: "2026-09-01",
      end: "2026-10-02",
    }),
  );
});

it("keeps typed drafts across parent acknowledgements and resets on external values", async () => {
  let latest: DateRange = { start: "2026-10-01", end: "" };
  let setRange: (next: DateRange) => void = () => {};
  function Controlled() {
    const [range, set] = useState<DateRange>(latest);
    setRange = (next) => {
      latest = next;
      set(next);
    };
    return (
      <DateRangePicker label="기간" value={range} onValueChange={setRange} />
    );
  }
  const host = mount(<Controlled />);
  const [start, end] = inputs(host);
  type(start, "2026/10/02");
  await waitFor(() => expect(latest).toEqual({ start: "2026-10-02", end: "" }));
  type(end, "2026/10/0");
  // The parent echoes the value it already has: the partial end draft survives.
  act(() => setRange({ start: "2026-10-02", end: "" }));
  expect(end.value).toBe("2026/10/0");
  expect(start.value).toBe("2026/10/02");
  act(() => setRange({ start: "2026-11-01", end: "2026-11-30" }));
  await waitFor(() => expect(start.value).toBe("2026/11/01"));
  expect(end.value).toBe("2026/11/30");
});

it("re-displays complete drafts in a new locale and keeps partial ones", () => {
  function Switch({ locale }: { locale: string }) {
    return (
      <DateRangePicker
        label="Period"
        locale={locale}
        defaultValue={{ start: "2026-10-01", end: "" }}
      />
    );
  }
  const view = render(
    <StrictMode>
      <Switch locale="ko-KR" />
    </StrictMode>,
  );
  const [start, end] = inputs(view.container);
  type(end, "2026/10/0");
  view.rerender(
    <StrictMode>
      <Switch locale="en-US" />
    </StrictMode>,
  );
  expect(start.value).toBe("2026-10-01");
  expect(end.value).toBe("2026/10/0");
  expect(start.placeholder).toBe("YYYY-MM-DD");
});
