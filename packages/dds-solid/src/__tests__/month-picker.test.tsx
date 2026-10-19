import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, expect, it, vi } from "vitest";
import { MonthPicker } from "../month-picker";
import { MonthPicker as RootMonthPicker } from "../index";
import { canonicalMonth, todayDate, validateMonth } from "../date-only";

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
const type = (input: HTMLInputElement, text: string) => {
  input.value = text;
  input.dispatchEvent(new InputEvent("input", { bubbles: true }));
};
const openContent = () =>
  document.querySelector<HTMLElement>(
    '.dds-month-picker-content[data-state="open"]',
  );
const month = (value: number) =>
  openContent()!.querySelector<HTMLElement>(
    `[data-part="table-cell-trigger"][data-value="${value}"]`,
  )!;

it("is exported from the root entry", () => {
  expect(RootMonthPicker).toBe(MonthPicker);
});

it("accepts the four typed month shapes and rejects impossible months", () => {
  for (const typed of ["2026-03", "2026/03", "2026.03", "202603"])
    expect(canonicalMonth(typed)).toBe("2026-03");
  expect(validateMonth("2026-13", false).reason).toBe("invalid");
  expect(validateMonth("2026/1", false).reason).toBe("incomplete");
  expect(validateMonth("", true).reason).toBe("required");
  expect(validateMonth("2026-02", false, "2026-03").reason).toBe("rangeUnderflow");
  expect(validateMonth("2026-12", false, undefined, "2026-11").reason).toBe(
    "rangeOverflow",
  );
});

it("labels the input, displays YYYY/MM in Korean and commits typed months as YYYY-MM", async () => {
  const change = vi.fn();
  const host = mount(() => (
    <MonthPicker label="청구 월" defaultValue="2026-10" onValueChange={change} />
  ));
  const input = host.querySelector<HTMLInputElement>("input:not([type=hidden])")!;
  expect(input.value).toBe("2026/10");
  expect(host.querySelector("label")!.getAttribute("for")).toBe(input.id);
  expect(input.placeholder).toBe("YYYY/MM");
  type(input, "2026.0");
  await Promise.resolve();
  expect(input.value).toBe("2026.0");
  expect(input.getAttribute("aria-invalid")).toBe("true");
  expect(change).not.toHaveBeenCalled();
  type(input, "202603");
  await vi.waitFor(() => expect(change).toHaveBeenLastCalledWith("2026-03"));
  expect(input.value).toBe("2026/03");
  expect(input.getAttribute("aria-invalid")).toBeNull();
  type(input, "2026-13");
  await Promise.resolve();
  expect(input.validationMessage).toBe(
    "YYYY/MM 형식의 유효한 범위 내 월을 입력해 주세요.",
  );
  expect(change).toHaveBeenCalledTimes(1);
});

it("pages by year, disables months outside min/max, selects a month and supports clear", async () => {
  const [value, setValue] = createSignal("2026-10");
  const change = vi.fn((next: string) => setValue(next));
  const host = mount(() => (
    <MonthPicker
      label="Billing month"
      locale="en-US"
      value={value()}
      onValueChange={change}
      min="2026-03"
      max="2027-02"
    />
  ));
  const trigger = host.querySelector<HTMLButtonElement>('[data-part="trigger"]')!;
  expect(trigger.getAttribute("aria-label")).toBe("Billing month Open calendar");
  trigger.click();
  await vi.waitFor(() => expect(openContent()).not.toBeNull());
  expect(openContent()!.querySelector(".dds-date-picker-year")!.textContent).toBe(
    "2026",
  );
  const cells = openContent()!.querySelectorAll('[data-part="table-cell-trigger"]');
  expect([...cells].map((cell) => cell.textContent)).toEqual([
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ]);
  expect(month(10).hasAttribute("data-selected")).toBe(true);
  expect(month(2).getAttribute("aria-disabled")).toBe("true");
  expect(month(3).getAttribute("aria-disabled")).toBeNull();
  openContent()!
    .querySelector<HTMLButtonElement>('[aria-label="Next year"]')!
    .click();
  await vi.waitFor(() =>
    expect(openContent()!.querySelector(".dds-date-picker-year")!.textContent).toBe(
      "2027",
    ),
  );
  expect(month(2).getAttribute("aria-disabled")).toBeNull();
  expect(month(3).getAttribute("aria-disabled")).toBe("true");
  month(1).click();
  await vi.waitFor(() => expect(change).toHaveBeenLastCalledWith("2027-01"));
  const input = host.querySelector<HTMLInputElement>("input:not([type=hidden])")!;
  expect(input.value).toBe("2027-01");
  await vi.waitFor(() => expect(document.activeElement).toBe(input));
  trigger.click();
  await vi.waitFor(() => expect(openContent()).not.toBeNull());
  openContent()!
    .querySelector<HTMLButtonElement>('[data-part="clear-trigger"]')!
    .click();
  await vi.waitFor(() => expect(change).toHaveBeenLastCalledWith(""));
  expect(input.value).toBe("");
});

it("marks the current month, offers This month and returns Escape focus to the trigger", async () => {
  const current = todayDate("Asia/Seoul").slice(0, 7);
  const change = vi.fn();
  const host = mount(() => (
    <MonthPicker label="청구 월" defaultValue="2020-01" onValueChange={change} />
  ));
  const trigger = host.querySelector<HTMLButtonElement>('[data-part="trigger"]')!;
  trigger.click();
  await vi.waitFor(() => expect(openContent()).not.toBeNull());
  expect(openContent()!.querySelector(".dds-date-picker-year")!.textContent).toBe(
    "2020년",
  );
  expect(month(1).textContent).toBe("1월");
  const thisMonth = [...openContent()!.querySelectorAll("button")].find(
    (button) => button.textContent === "이번 달",
  )!;
  thisMonth.click();
  await vi.waitFor(() => expect(change).toHaveBeenLastCalledWith(current));
  if (!openContent()) trigger.click();
  await vi.waitFor(() => expect(openContent()).not.toBeNull());
  expect(month(Number(current.slice(5, 7))).hasAttribute("data-today")).toBe(true);
  openContent()!.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  await vi.waitFor(() => expect(openContent()).toBeNull());
  await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
});

it("submits YYYY-MM under name, blocks required submission and restores the default on reset", async () => {
  const host = mount(() => (
    <form>
      <MonthPicker label="청구 월" name="month" required defaultValue="2026-10" />
    </form>
  ));
  const form = host.querySelector("form")!;
  const input = host.querySelector<HTMLInputElement>("input:not([type=hidden])")!;
  expect(new FormData(form).get("month")).toBe("2026-10");
  type(input, "");
  await vi.waitFor(() => expect(new FormData(form).get("month")).toBe(""));
  expect(form.checkValidity()).toBe(false);
  expect(input.validationMessage).toBe("월을 입력해 주세요.");
  type(input, "2026/11");
  await vi.waitFor(() => expect(new FormData(form).get("month")).toBe("2026-11"));
  form.reset();
  await vi.waitFor(() => expect(input.value).toBe("2026/10"));
  expect(new FormData(form).get("month")).toBe("2026-10");
});

it("locks disabled and read-only fields and keeps the input across label placements", async () => {
  const change = vi.fn();
  const [placement, setPlacement] = createSignal<"outside" | "inside" | "hidden">(
    "outside",
  );
  const host = mount(() => (
    <>
      <MonthPicker label="Disabled" disabled name="off" />
      <MonthPicker
        label="Locked"
        readOnly
        invalid
        labelPlacement={placement()}
        defaultValue="2026-10"
        onValueChange={change}
      />
    </>
  ));
  const [disabled, locked] = [
    ...host.querySelectorAll<HTMLInputElement>("input:not([type=hidden])"),
  ];
  expect(disabled!.disabled).toBe(true);
  expect(
    host.querySelector<HTMLButtonElement>('[data-part="trigger"]')!.disabled,
  ).toBe(true);
  expect(host.querySelector<HTMLInputElement>('input[name="off"]')!.disabled).toBe(
    true,
  );
  expect(locked!.getAttribute("aria-invalid")).toBe("true");
  type(locked!, "2026-01");
  await Promise.resolve();
  expect(change).not.toHaveBeenCalled();
  locked!.focus();
  setPlacement("inside");
  setPlacement("hidden");
  await Promise.resolve();
  expect(host.querySelectorAll("input:not([type=hidden])")[1]).toBe(locked);
  expect(document.activeElement).toBe(locked);
});
