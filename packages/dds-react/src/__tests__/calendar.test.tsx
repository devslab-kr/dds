import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Calendar } from "../calendar";

it("selects inline dates inclusively and navigates without committing", async () => {
  const change = vi.fn();
  const user = userEvent.setup();
  render(
    <Calendar
      label="일정"
      value="2026-10-12"
      onChange={change}
      min="2026-10-10"
      max="2026-11-20"
      messages={{
        nextMonth: "Next month",
        clear: "Clear",
        selectDate: (value) => `Choose ${value}`,
      }}
    />,
  );
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(screen.getByRole("group", { name: "일정" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Choose .*10.*10/ }));
  expect(change).toHaveBeenLastCalledWith("2026-10-10");
  change.mockClear();
  await user.click(screen.getByRole("button", { name: "Next month" }));
  expect(change).not.toHaveBeenCalled();
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: /Choose .*11.*20/ }),
    ).toBeInTheDocument(),
  );
});

it.each(["disabled", "readOnly"] as const)(
  "does not change a %s calendar",
  async (lock) => {
    const change = vi.fn();
    const user = userEvent.setup();
    render(
      <Calendar
        label="Date"
        locale="en-US"
        value="2026-10-12"
        onChange={change}
        {...{ [lock]: true }}
      />,
    );
    const day = screen.getByRole("button", { name: /October 13/ });
    await user.click(day);
    expect(change).not.toHaveBeenCalled();
  },
);

it.each(["Pacific/Kiritimati", "Etc/GMT+12"])(
  "uses %s for Today without shifting stored dates",
  async (timeZone) => {
    const change = vi.fn(),
      user = userEvent.setup();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const part = (type: string) => parts.find((p) => p.type === type)!.value;
    const expected = `${part("year")}-${part("month")}-${part("day")}`;
    render(
      <Calendar
        label="Date"
        value="2026-10-12"
        onChange={change}
        timeZone={timeZone}
        messages={{ today: "Today" }}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Today" }));
    await waitFor(() => expect(change).toHaveBeenCalledWith(expected));
  },
);

it("does not clamp Today to a future minimum date", async () => {
  const change = vi.fn(),
    user = userEvent.setup();
  render(
    <Calendar
      label="Date"
      value="2999-01-02"
      onChange={change}
      min="2999-01-01"
      messages={{ today: "Today" }}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Today" }));
  expect(change).not.toHaveBeenCalled();
});
