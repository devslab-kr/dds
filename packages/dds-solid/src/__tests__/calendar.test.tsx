import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, expect, it, vi } from "vitest";
import { Calendar } from "../calendar";
let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  document.body.replaceChildren();
});
it("selects inclusive endpoints, disables outside dates and navigates without committing", async () => {
  const host = document.body.appendChild(document.createElement("div"));
  const change = vi.fn();
  dispose = render(
    () => (
      <Calendar
        label="날짜"
        value="2026-10-12"
        onChange={change}
        min="2026-10-10"
        max="2026-11-20"
        messages={{ nextMonth: "Next" }}
      />
    ),
    host,
  );
  expect(host.querySelector("input")).toBeNull();
  expect(
    host.querySelector('[role="group"][aria-label="날짜"]'),
  ).not.toBeNull();
  const cell = (date: string) =>
    host.querySelector<HTMLElement>(
      `[data-part="table-cell-trigger"][data-value="${date}"]`,
    )!;
  expect(cell("2026-10-09").getAttribute("aria-disabled")).toBe("true");
  cell("2026-10-10").click();
  await vi.waitFor(() => expect(change).toHaveBeenCalledWith("2026-10-10"));
  change.mockClear();
  host.querySelector<HTMLButtonElement>('[aria-label="Next"]')!.click();
  await vi.waitFor(() => expect(cell("2026-11-20")).not.toBeNull());
  expect(change).not.toHaveBeenCalled();
  cell("2026-11-20").click();
  await vi.waitFor(() => expect(change).toHaveBeenCalledWith("2026-11-20"));
});
it.each(["disabled", "readOnly"] as const)(
  "blocks date and footer changes when %s",
  async (lock) => {
    const host = document.body.appendChild(document.createElement("div"));
    const change = vi.fn();
    dispose = render(
      () => (
        <Calendar
          label="날짜"
          value="2026-10-12"
          onChange={change}
          {...{ [lock]: true }}
        />
      ),
      host,
    );
    host
      .querySelector<HTMLElement>(
        '[data-part="table-cell-trigger"][data-value="2026-10-13"]',
      )!
      .click();
    host
      .querySelector<HTMLButtonElement>('[data-part="clear-trigger"]')!
      .click();
    await Promise.resolve();
    expect(change).not.toHaveBeenCalled();
  },
);
it.each(["Pacific/Kiritimati", "Etc/GMT+12"])(
  "uses %s for Today with date-only storage",
  async (timeZone) => {
    const host = document.body.appendChild(document.createElement("div"));
    const change = vi.fn();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const part = (type: string) => parts.find((p) => p.type === type)!.value;
    const expected = `${part("year")}-${part("month")}-${part("day")}`;
    dispose = render(
      () => (
        <Calendar
          label="Date"
          value="2026-10-12"
          onChange={change}
          timeZone={timeZone}
          messages={{ today: "Today" }}
        />
      ),
      host,
    );
    [...host.querySelectorAll("button")]
      .find((button) => button.textContent === "Today")!
      .click();
    await vi.waitFor(() => expect(change).toHaveBeenCalledWith(expected));
  },
);

it("never clamps Today to a future minimum", async () => {
  const host = document.body.appendChild(document.createElement("div"));
  const change = vi.fn();
  dispose = render(
    () => (
      <Calendar
        label="날짜"
        value="2999-01-02"
        onChange={change}
        min="2999-01-01"
        messages={{ today: "Today" }}
      />
    ),
    host,
  );
  const today = [...host.querySelectorAll("button")].find(
    (button) => button.textContent === "Today",
  )!;
  today.click();
  await Promise.resolve();
  expect(change).not.toHaveBeenCalled();
  expect(today.disabled).toBe(true);
});
