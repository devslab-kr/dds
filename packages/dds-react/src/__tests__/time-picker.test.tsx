import { StrictMode, useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TimePicker } from "../time-picker";
import {
  matchesTimeQuery,
  normalizeTime,
  parseTypedTime,
  timeOptions,
} from "../time-only";

// jsdom has no scrolling geometry; centering is checked in real browsers.
HTMLElement.prototype.scrollTo = vi.fn();

// One key per call, like real keystrokes: user-event typing a whole string
// resets its tracked caret when the controlled combobox re-renders (the
// existing Combobox does the same in jsdom); real typing is covered in browsers.
const typeKeys = async (user: ReturnType<typeof userEvent.setup>, input: HTMLElement, text: string) => {
  for (const key of text) await user.type(input, key);
};
const listed = () =>
  screen.queryAllByRole("option").map((option) => option.textContent);
const checked = () =>
  document.querySelector('[role="option"][data-state="checked"]')?.textContent;
const openList = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /시간 목록 열기|Open time list/ }));
  await waitFor(() =>
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-expanded", "true"),
  );
};

describe("time rules (shared with Solid)", () => {
  it("normalizes, parses and matches the same way as the Solid build", () => {
    expect(normalizeTime("09:30:59")).toBe("09:30");
    expect(parseTypedTime("1045")).toBe("10:45");
    expect(parseTypedTime("103")).toBeNull();
    expect(timeOptions(10)).toHaveLength(144);
    expect(timeOptions(10).filter((t) => matchesTimeQuery(t, "10"))).toEqual([
      "10:00", "10:10", "10:20", "10:30", "10:40", "10:50",
    ]);
  });
});

describe("TimePicker", () => {
  it("labels a combobox, shows HH:MM for HH:MM:SS and opens with the selection checked", async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    render(<TimePicker label="마감 시간" value="10:30:00" onValueChange={changed} />);
    const input = screen.getByRole("combobox", { name: "마감 시간" });
    expect(input).toHaveValue("10:30");
    await openList(user);
    expect(listed()).toHaveLength(144);
    expect(checked()).toBe("10:30");
    expect(changed).not.toHaveBeenCalled();
  });

  it("filters while typing and picks the first match with Enter", async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    render(<TimePicker label="Time" onValueChange={changed} />);
    const input = screen.getByRole("combobox");
    await user.type(input, "10");
    await waitFor(() =>
      expect(listed()).toEqual(["10:00", "10:10", "10:20", "10:30", "10:40", "10:50"]),
    );
    await waitFor(() => expect(input).toHaveAttribute("aria-activedescendant"));
    await user.keyboard("{Enter}");
    await waitFor(() => expect(changed).toHaveBeenCalledExactlyOnceWith("10:00"));
    await waitFor(() => expect(input).toHaveValue("10:00"));
  });

  it("accepts a typed time off the step and keeps it selected", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [time, setTime] = useState("09:00");
      return (
        <>
          <TimePicker label="Time" value={time} onValueChange={setTime} />
          <output aria-label="value">{time}</output>
        </>
      );
    }
    render(<Controlled />);
    const input = screen.getByRole("combobox");
    await user.clear(input);
    await typeKeys(user, input, "1045");
    await waitFor(() => expect(listed()).toEqual(["10:45"]));
    await waitFor(() => expect(input).toHaveAttribute("aria-activedescendant"));
    await user.keyboard("{Enter}");
    await waitFor(() => expect(screen.getByLabelText("value")).toHaveTextContent("10:45"));
    await openList(user);
    expect(checked()).toBe("10:45");
  });

  it("lists an existing off-step value in its place, selected", async () => {
    const user = userEvent.setup();
    render(<TimePicker label="Time" value="10:45" />);
    await openList(user);
    const all = listed();
    expect(all).toHaveLength(145);
    expect(all.indexOf("10:45")).toBe(all.indexOf("10:40") + 1);
    expect(checked()).toBe("10:45");
  });

  it("commits typed text on blur, including a fast Tab, and restores partial or wrong text", async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    render(
      <>
        <TimePicker label="Time" defaultValue="08:00" onValueChange={changed} />
        <button type="button">after</button>
      </>,
    );
    const input = screen.getByRole("combobox");
    // A value set and blurred in the same tick: the DOM text must win.
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "7:35" } });
    fireEvent.blur(input);
    await waitFor(() => expect(changed).toHaveBeenCalledExactlyOnceWith("07:35"));
    await waitFor(() => expect(input).toHaveValue("07:35"));
    for (const text of ["7", "25:00", "abc"]) {
      await user.clear(input);
      await typeKeys(user, input, text);
      await user.tab();
      await waitFor(() => expect(input).toHaveValue("07:35"));
    }
    expect(changed).toHaveBeenCalledOnce();
  });

  it("clears with the button and with an emptied field", async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    render(
      <>
        <TimePicker label="Time" defaultValue="10:00" clearable onValueChange={changed} />
        <button type="button">after</button>
      </>,
    );
    const input = screen.getByRole("combobox");
    await user.click(screen.getByRole("button", { name: "시간 지우기" }));
    expect(changed).toHaveBeenLastCalledWith("");
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
    await typeKeys(user, input, "11:20");
    await user.tab();
    await waitFor(() => expect(changed).toHaveBeenLastCalledWith("11:20"));
    await user.clear(input);
    await user.tab();
    await waitFor(() => expect(changed).toHaveBeenLastCalledWith(""));
  });

  it("submits HH:MM, is invalid when required and empty, and resets to its default", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <TimePicker label="Time" name="closing" defaultValue="18:00:00" required />
        <button type="button">after</button>
      </form>,
    );
    const form = container.querySelector("form")!;
    const input = screen.getByRole("combobox");
    expect(new FormData(form).get("closing")).toBe("18:00");
    expect(form.checkValidity()).toBe(true);
    await user.clear(input);
    await user.tab();
    await waitFor(() => expect(new FormData(form).get("closing")).toBe(""));
    expect(form.checkValidity()).toBe(false);
    form.reset();
    await waitFor(() => expect(input).toHaveValue("18:00"));
    expect(new FormData(form).get("closing")).toBe("18:00");
  });

  it("marks wrong values and the invalid prop with aria-invalid", () => {
    render(
      <>
        <TimePicker label="Broken" value="25:99" />
        <TimePicker label="Flagged" value="10:00" invalid />
        <TimePicker label="Fine" value="10:00" />
      </>,
    );
    expect(screen.getByRole("combobox", { name: "Broken" })).toHaveValue("25:99");
    expect(screen.getByRole("combobox", { name: "Broken" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("combobox", { name: "Flagged" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("combobox", { name: "Fine" })).not.toHaveAttribute("aria-invalid");
  });

  it("does not open or change when disabled or read-only", async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    render(
      <>
        <TimePicker label="Disabled" value="10:00" disabled onValueChange={changed} />
        <TimePicker label="Read only" value="10:00" readOnly onValueChange={changed} />
      </>,
    );
    const disabled = screen.getByRole("combobox", { name: "Disabled" });
    const readOnly = screen.getByRole("combobox", { name: "Read only" });
    expect(disabled).toBeDisabled();
    expect(readOnly).toHaveAttribute("readonly");
    for (const trigger of document.querySelectorAll<HTMLButtonElement>(".dds-choice-trigger"))
      fireEvent.click(trigger);
    readOnly.focus();
    await user.keyboard("{ArrowDown}");
    await user.tab();
    for (const input of [disabled, readOnly]) {
      expect(input).toHaveAttribute("aria-expanded", "false");
      expect(input).toHaveValue("10:00");
    }
    expect(changed).not.toHaveBeenCalled();
  });

  it("uses English text, honors a coarser step and virtualizes a one-minute list", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<TimePicker label="Time" locale="en-US" step={30} />);
    await openList(user);
    expect(listed()).toHaveLength(48);
    await user.type(screen.getByRole("combobox"), "zz");
    await waitFor(() => expect(document.body).toHaveTextContent("No matching time"));
    unmount();
    render(<TimePicker label="Time" step={1} value="12:00" />);
    await openList(user);
    expect(listed().length).toBeLessThan(60);
  });

  it("works under StrictMode", async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    render(
      <StrictMode>
        <TimePicker label="Time" defaultValue="09:00" onValueChange={changed} />
      </StrictMode>,
    );
    await openList(user);
    await user.click(screen.getByRole("option", { name: "09:10" }));
    await waitFor(() => expect(changed).toHaveBeenCalledExactlyOnceWith("09:10"));
    expect(screen.getByRole("combobox")).toHaveValue("09:10");
  });
});
