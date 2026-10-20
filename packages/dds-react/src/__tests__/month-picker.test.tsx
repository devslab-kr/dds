import { StrictMode, useState, type ReactNode } from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { MonthPicker } from "../month-picker";
import { MonthPicker as RootMonthPicker } from "../index";
import { canonicalMonth, todayDate, validateMonth } from "../date-only";

// Every case runs under StrictMode: double effects must not double-emit or lose drafts.
const mount = (view: ReactNode) =>
  render(<StrictMode>{view}</StrictMode>).container;
const type = (input: HTMLInputElement, text: string) =>
  fireEvent.input(input, { target: { value: text } });
const openContent = () =>
  document.querySelector<HTMLElement>(
    '.dds-month-picker-content[data-state="open"]',
  );
const month = (value: number) =>
  openContent()!.querySelector<HTMLElement>(
    `[data-part="table-cell-trigger"][data-value="${value}"]`,
  )!;
const textbox = (host: HTMLElement, index = 0) =>
  host.querySelectorAll<HTMLInputElement>("input:not([type=hidden])")[index]!;

it("is exported from the root entry", () => {
  expect(RootMonthPicker).toBe(MonthPicker);
});

it("accepts the four typed month shapes and rejects impossible months", () => {
  for (const typed of ["2026-03", "2026/03", "2026.03", "202603"])
    expect(canonicalMonth(typed)).toBe("2026-03");
  expect(validateMonth("2026-13", false).reason).toBe("invalid");
  expect(validateMonth("2026/1", false).reason).toBe("incomplete");
  expect(validateMonth("", true).reason).toBe("required");
  expect(validateMonth("2026-02", false, "2026-03").reason).toBe(
    "rangeUnderflow",
  );
  expect(validateMonth("2026-12", false, undefined, "2026-11").reason).toBe(
    "rangeOverflow",
  );
});

it("labels the input, displays YYYY/MM in Korean and commits typed months as YYYY-MM", async () => {
  const change = vi.fn();
  const host = mount(
    <MonthPicker label="청구 월" defaultValue="2026-10" onValueChange={change} />,
  );
  const input = textbox(host);
  expect(input.value).toBe("2026/10");
  expect(host.querySelector("label")!.getAttribute("for")).toBe(input.id);
  expect(input.placeholder).toBe("YYYY/MM");
  type(input, "2026.0");
  expect(input.value).toBe("2026.0");
  expect(input.getAttribute("aria-invalid")).toBe("true");
  expect(change).not.toHaveBeenCalled();
  type(input, "202603");
  await waitFor(() => expect(change).toHaveBeenLastCalledWith("2026-03"));
  expect(input.value).toBe("2026/03");
  expect(input.getAttribute("aria-invalid")).toBeNull();
  type(input, "2026-13");
  await waitFor(() =>
    expect(input.validationMessage).toBe(
      "YYYY/MM 형식의 유효한 범위 내 월을 입력해 주세요.",
    ),
  );
  expect(change).toHaveBeenCalledTimes(1);
});

it("pages by year, disables months outside min/max, selects a month and supports clear", async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  function Controlled() {
    const [value, setValue] = useState("2026-10");
    return (
      <MonthPicker
        label="Billing month"
        locale="en-US"
        value={value}
        onValueChange={(next) => {
          change(next);
          setValue(next);
        }}
        min="2026-03"
        max="2027-02"
      />
    );
  }
  const host = mount(<Controlled />);
  const trigger = host.querySelector<HTMLButtonElement>(
    '[data-part="trigger"]',
  )!;
  expect(trigger.getAttribute("aria-label")).toBe(
    "Billing month Open calendar",
  );
  await user.click(trigger);
  await waitFor(() => expect(openContent()).not.toBeNull());
  expect(
    openContent()!.querySelector(".dds-date-picker-year")!.textContent,
  ).toBe("2026");
  const cells = openContent()!.querySelectorAll(
    '[data-part="table-cell-trigger"]',
  );
  expect([...cells].map((cell) => cell.textContent)).toEqual([
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ]);
  expect(month(10).hasAttribute("data-selected")).toBe(true);
  expect(month(2).getAttribute("aria-disabled")).toBe("true");
  expect(month(3).getAttribute("aria-disabled")).toBeNull();
  await user.click(
    openContent()!.querySelector<HTMLButtonElement>('[aria-label="Next year"]')!,
  );
  await waitFor(() =>
    expect(
      openContent()!.querySelector(".dds-date-picker-year")!.textContent,
    ).toBe("2027"),
  );
  expect(month(2).getAttribute("aria-disabled")).toBeNull();
  expect(month(3).getAttribute("aria-disabled")).toBe("true");
  await user.click(month(1));
  await waitFor(() => expect(change).toHaveBeenLastCalledWith("2027-01"));
  const input = textbox(host);
  expect(input.value).toBe("2027-01");
  await waitFor(() => expect(document.activeElement).toBe(input));
  await user.click(trigger);
  await waitFor(() => expect(openContent()).not.toBeNull());
  await user.click(
    openContent()!.querySelector<HTMLButtonElement>(
      '[data-part="clear-trigger"]',
    )!,
  );
  await waitFor(() => expect(change).toHaveBeenLastCalledWith(""));
  expect(input.value).toBe("");
});

it("marks the current month, offers This month and returns Escape focus to the trigger", async () => {
  const user = userEvent.setup();
  const current = todayDate("Asia/Seoul").slice(0, 7);
  const change = vi.fn();
  const host = mount(
    <MonthPicker label="청구 월" defaultValue="2020-01" onValueChange={change} />,
  );
  const trigger = host.querySelector<HTMLButtonElement>(
    '[data-part="trigger"]',
  )!;
  await user.click(trigger);
  await waitFor(() => expect(openContent()).not.toBeNull());
  expect(
    openContent()!.querySelector(".dds-date-picker-year")!.textContent,
  ).toBe("2020년");
  expect(month(1).textContent).toBe("1월");
  const thisMonth = [...openContent()!.querySelectorAll("button")].find(
    (button) => button.textContent === "이번 달",
  )!;
  await user.click(thisMonth);
  await waitFor(() => expect(change).toHaveBeenLastCalledWith(current));
  if (!openContent()) await user.click(trigger);
  await waitFor(() => expect(openContent()).not.toBeNull());
  expect(month(Number(current.slice(5, 7))).hasAttribute("data-today")).toBe(
    true,
  );
  fireEvent.keyDown(openContent()!, { key: "Escape", bubbles: true });
  await waitFor(() => expect(openContent()).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});

it("submits YYYY-MM under name, blocks required submission and restores the default on reset", async () => {
  const host = mount(
    <form>
      <MonthPicker label="청구 월" name="month" required defaultValue="2026-10" />
    </form>,
  );
  const form = host.querySelector("form")!;
  const input = textbox(host);
  expect(new FormData(form).get("month")).toBe("2026-10");
  type(input, "");
  await waitFor(() => expect(new FormData(form).get("month")).toBe(""));
  await waitFor(() => expect(form.checkValidity()).toBe(false));
  expect(input.validationMessage).toBe("월을 입력해 주세요.");
  type(input, "2026/11");
  await waitFor(() =>
    expect(new FormData(form).get("month")).toBe("2026-11"),
  );
  act(() => form.reset());
  await waitFor(() => expect(input.value).toBe("2026/10"));
  expect(new FormData(form).get("month")).toBe("2026-10");
});

it("restores after the browser rewrites the input on a user reset", async () => {
  const user = userEvent.setup();
  const host = mount(
    <form>
      <MonthPicker label="Month" locale="en-US" name="month" defaultValue="2026-10" />
      <button type="reset">Reset</button>
    </form>,
  );
  const input = textbox(host);
  type(input, "2026-1");
  await user.click(host.querySelector<HTMLButtonElement>('[type="reset"]')!);
  await waitFor(() => expect(input.value).toBe("2026-10"));
  expect(new FormData(host.querySelector("form")!).get("month")).toBe(
    "2026-10",
  );
});

it("locks disabled and read-only fields and keeps the input across label placements", async () => {
  const change = vi.fn();
  let place: (next: "outside" | "inside" | "hidden") => void = () => {};
  function Fields() {
    const [placement, setPlacement] = useState<"outside" | "inside" | "hidden">(
      "outside",
    );
    place = setPlacement;
    return (
      <>
        <MonthPicker label="Disabled" disabled name="off" />
        <MonthPicker
          label="Locked"
          readOnly
          invalid
          labelPlacement={placement}
          defaultValue="2026-10"
          onValueChange={change}
        />
      </>
    );
  }
  const host = mount(<Fields />);
  const disabled = textbox(host, 0),
    locked = textbox(host, 1);
  expect(disabled.disabled).toBe(true);
  expect(
    host.querySelector<HTMLButtonElement>('[data-part="trigger"]')!.disabled,
  ).toBe(true);
  expect(
    host.querySelector<HTMLInputElement>('input[name="off"]')!.disabled,
  ).toBe(true);
  expect(locked.getAttribute("aria-invalid")).toBe("true");
  type(locked, "2026-01");
  expect(change).not.toHaveBeenCalled();
  act(() => locked.focus());
  act(() => place("inside"));
  act(() => place("hidden"));
  expect(textbox(host, 1)).toBe(locked);
  expect(document.activeElement).toBe(locked);
});
