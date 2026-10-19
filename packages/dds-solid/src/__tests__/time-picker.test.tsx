import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TimePicker } from "../index";
import {
  matchesTimeQuery,
  normalizeTime,
  parseTypedTime,
  timeOptions,
} from "../time-only";

HTMLElement.prototype.scrollTo = vi.fn();
let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.replaceChildren();
});

const mount = (view: () => any) => {
  const host = document.body.appendChild(document.createElement("div"));
  dispose = render(view, host);
  return host;
};
const field = (host: HTMLElement) =>
  host.querySelector<HTMLInputElement>('input[role="combobox"]')!;
// One animation frame in the test setup; Ark applies typed text after it.
const frame = () => new Promise((resolve) => setTimeout(resolve, 20));
const type = async (input: HTMLInputElement, text: string) => {
  input.focus();
  input.value = text;
  input.dispatchEvent(new InputEvent("input", { bubbles: true, data: text }));
  await frame();
};
const key = (input: HTMLInputElement, name: string) =>
  input.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true }));
// Options stay in the DOM (hidden) while the list is closed.
const options = () =>
  [...document.querySelectorAll<HTMLElement>('[role="option"]')].map(
    (option) => option.textContent,
  );
const isOpen = (host: HTMLElement) =>
  host.querySelector('input[role="combobox"]')!.getAttribute("aria-expanded") ===
    "true" &&
  document.querySelector('[data-scope="combobox"][data-part="content"]')?.getAttribute(
    "data-state",
  ) === "open";
const openList = async (host: HTMLElement) => {
  host.querySelector<HTMLButtonElement>(".dds-choice-trigger")!.click();
  await vi.waitFor(() => expect(isOpen(host)).toBe(true));
  await frame();
};

describe("time rules", () => {
  it("normalizes API values and leaves non-times alone", () => {
    expect(normalizeTime("09:30")).toBe("09:30");
    expect(normalizeTime("09:30:59")).toBe("09:30");
    expect(normalizeTime("23:59:00.000")).toBe("23:59");
    for (const value of ["", "9:30", "24:00", "12:60", "abc", "09:30:61"])
      expect(normalizeTime(value)).toBeNull();
  });
  it("reads complete typed times only", () => {
    expect(parseTypedTime("9:05")).toBe("09:05");
    expect(parseTypedTime(" 10:45:00 ")).toBe("10:45");
    expect(parseTypedTime("1045")).toBe("10:45");
    expect(parseTypedTime("10：45")).toBe("10:45");
    expect(parseTypedTime("10.45")).toBe("10:45");
    expect(parseTypedTime("930")).toBe("09:30");
    for (const text of ["10", "10:4", "103", "2400", "10:60", "1a:00", ""])
      expect(parseTypedTime(text)).toBeNull();
  });
  it("lists every step from 00:00 to the last one before midnight", () => {
    expect(timeOptions(10)).toHaveLength(144);
    expect(timeOptions(10).slice(0, 2)).toEqual(["00:00", "00:10"]);
    expect(timeOptions(10).at(-1)).toBe("23:50");
    expect(timeOptions(30)).toHaveLength(48);
    expect(timeOptions(45).slice(0, 3)).toEqual(["00:00", "00:45", "01:30"]);
    expect(timeOptions(0)).toHaveLength(1440);
  });
  it("matches partial typing by the start of the time", () => {
    const grid = timeOptions(10);
    const match = (query: string) =>
      grid.filter((option) => matchesTimeQuery(option, query));
    expect(match("10")).toEqual(["10:00", "10:10", "10:20", "10:30", "10:40", "10:50"]);
    expect(match("9")).toEqual(match("09"));
    expect(match("9")[0]).toBe("09:00");
    expect(match("930")).toEqual(["09:30"]);
    expect(match("9:3")).toEqual(["09:30"]);
    expect(match("103")).toEqual(["10:30"]);
    expect(match("23:5")).toEqual(["23:50"]);
    expect(match("abc")).toEqual([]);
    expect(match("")).toHaveLength(144);
  });
});

describe("TimePicker", () => {
  it("labels a combobox and lists ten-minute times with the selection centered on open", async () => {
    const host = mount(() => (
      <TimePicker label="마감 시간" value="10:30:00" onValueChange={() => {}} />
    ));
    const input = field(host);
    expect(input.value).toBe("10:30");
    const label = host.querySelector("label")!;
    expect(label.textContent).toBe("마감 시간");
    expect(label.htmlFor).toBe(input.id);
    expect(host.querySelector(".dds-choice-trigger")!.getAttribute("aria-label")).toBe(
      "시간 목록 열기",
    );
    await openList(host);
    expect(document.querySelector('[role="listbox"]')).not.toBeNull();
    expect(options()).toHaveLength(144);
    expect(
      document.querySelector('[role="option"][data-state="checked"]')?.textContent,
    ).toBe("10:30");
  });

  it("filters while typing and picks the first match with Enter", async () => {
    const changed = vi.fn();
    const host = mount(() => <TimePicker label="Time" onValueChange={changed} />);
    const input = field(host);
    await type(input, "10");
    await vi.waitFor(() =>
      expect(options()).toEqual(["10:00", "10:10", "10:20", "10:30", "10:40", "10:50"]),
    );
    await vi.waitFor(() =>
      expect(input.getAttribute("aria-activedescendant")).toBeTruthy(),
    );
    key(input, "Enter");
    await vi.waitFor(() => expect(changed).toHaveBeenCalledExactlyOnceWith("10:00"));
    await vi.waitFor(() => expect(input.value).toBe("10:00"));
  });

  it("accepts a typed time off the step with Enter and keeps it selected", async () => {
    const [time, setTime] = createSignal("09:00");
    const host = mount(() => (
      <TimePicker label="Time" value={time()} onValueChange={setTime} />
    ));
    const input = field(host);
    await type(input, "1045");
    await vi.waitFor(() => expect(options()).toEqual(["10:45"]));
    await vi.waitFor(() =>
      expect(input.getAttribute("aria-activedescendant")).toBeTruthy(),
    );
    key(input, "Enter");
    await vi.waitFor(() => expect(time()).toBe("10:45"));
    await vi.waitFor(() => expect(input.value).toBe("10:45"));
    await openList(host);
    expect(options()).toContain("10:45");
    expect(
      document.querySelector('[role="option"][data-state="checked"]')?.textContent,
    ).toBe("10:45");
  });

  it("shows an existing value that is off the step as selected without changing it", async () => {
    const changed = vi.fn();
    const host = mount(() => (
      <TimePicker label="Time" value="10:45" onValueChange={changed} />
    ));
    await openList(host);
    const listed = options();
    expect(listed.indexOf("10:45")).toBe(listed.indexOf("10:40") + 1);
    expect(listed).toHaveLength(145);
    expect(
      document.querySelector('[role="option"][data-state="checked"]')?.textContent,
    ).toBe("10:45");
    expect(changed).not.toHaveBeenCalled();
  });

  it("commits a typed time on blur and restores the field for partial or wrong text", async () => {
    const changed = vi.fn();
    const host = mount(() => (
      <TimePicker label="Time" defaultValue="08:00" onValueChange={changed} />
    ));
    const input = field(host);
    await type(input, "7:35");
    input.blur();
    await vi.waitFor(() => expect(changed).toHaveBeenCalledExactlyOnceWith("07:35"));
    expect(input.value).toBe("07:35");
    for (const text of ["7", "25:00", "abc"]) {
      await type(input, text);
      input.blur();
      await vi.waitFor(() => expect(input.value).toBe("07:35"));
    }
    expect(changed).toHaveBeenCalledOnce();
  });

  it("commits text that is still in flight when focus leaves (a fast Tab)", async () => {
    const changed = vi.fn();
    const host = mount(() => <TimePicker label="Time" onValueChange={changed} />);
    const input = field(host);
    input.focus();
    input.value = "1305";
    input.dispatchEvent(new InputEvent("input", { bubbles: true, data: "1305" }));
    input.blur();
    await vi.waitFor(() => expect(changed).toHaveBeenCalledExactlyOnceWith("13:05"));
    await vi.waitFor(() => expect(input.value).toBe("13:05"));
  });

  it("clears with the clear button and with an emptied field", async () => {
    const changed = vi.fn();
    const host = mount(() => (
      <TimePicker label="Time" defaultValue="10:00" clearable onValueChange={changed} />
    ));
    const input = field(host);
    const clear = host.querySelector<HTMLButtonElement>(".dds-choice-clear")!;
    expect(clear.getAttribute("aria-label")).toBe("시간 지우기");
    clear.click();
    expect(changed).toHaveBeenLastCalledWith("");
    expect(input.value).toBe("");
    expect(document.activeElement).toBe(input);
    await type(input, "11:20");
    input.blur();
    await vi.waitFor(() => expect(changed).toHaveBeenLastCalledWith("11:20"));
    await type(input, "");
    input.blur();
    await vi.waitFor(() => expect(changed).toHaveBeenLastCalledWith(""));
  });

  it("submits HH:MM, is invalid when required and empty, and resets to its default", async () => {
    const host = mount(() => (
      <form>
        <TimePicker label="Time" name="closing" defaultValue="18:00:00" required />
      </form>
    ));
    const form = host.querySelector("form")!;
    expect(new FormData(form).get("closing")).toBe("18:00");
    expect(form.checkValidity()).toBe(true);
    const input = field(host);
    await type(input, "");
    input.blur();
    await vi.waitFor(() => expect(new FormData(form).get("closing")).toBe(""));
    expect(form.checkValidity()).toBe(false);
    form.reset();
    await vi.waitFor(() => expect(input.value).toBe("18:00"));
    expect(new FormData(form).get("closing")).toBe("18:00");
  });

  it("marks wrong values and the invalid prop with aria-invalid", () => {
    const host = mount(() => (
      <>
        <TimePicker label="Broken" value="25:99" />
        <TimePicker label="Flagged" value="10:00" invalid />
        <TimePicker label="Fine" value="10:00" />
      </>
    ));
    const [broken, flagged, fine] = [
      ...host.querySelectorAll<HTMLInputElement>('input[role="combobox"]'),
    ];
    expect(broken!.value).toBe("25:99");
    expect(broken!.getAttribute("aria-invalid")).toBe("true");
    expect(flagged!.getAttribute("aria-invalid")).toBe("true");
    expect(fine!.hasAttribute("aria-invalid")).toBe(false);
  });

  it("does not open or change when disabled or read-only", async () => {
    const changed = vi.fn();
    const host = mount(() => (
      <>
        <TimePicker label="Disabled" value="10:00" disabled onValueChange={changed} />
        <TimePicker label="Read only" value="10:00" readOnly onValueChange={changed} />
      </>
    ));
    const [disabled, readOnly] = [
      ...host.querySelectorAll<HTMLInputElement>('input[role="combobox"]'),
    ];
    expect(disabled!.disabled).toBe(true);
    expect(readOnly!.readOnly).toBe(true);
    for (const trigger of host.querySelectorAll<HTMLButtonElement>(".dds-choice-trigger"))
      trigger.click();
    readOnly!.focus();
    key(readOnly!, "ArrowDown");
    readOnly!.blur();
    await frame();
    for (const input of [disabled!, readOnly!]) {
      expect(input.getAttribute("aria-expanded")).toBe("false");
      expect(input.value).toBe("10:00");
    }
    expect(changed).not.toHaveBeenCalled();
  });

  it("closes with Escape and keeps the value", async () => {
    const host = mount(() => <TimePicker label="Time" defaultValue="10:00" />);
    const input = field(host);
    await openList(host);
    expect(input.getAttribute("aria-expanded")).toBe("true");
    key(input, "Escape");
    await vi.waitFor(() => expect(input.getAttribute("aria-expanded")).toBe("false"));
    expect(input.value).toBe("10:00");
  });

  it("uses English text for English locales and honors a coarser step", async () => {
    const host = mount(() => <TimePicker label="Time" locale="en-US" step={30} />);
    expect(host.querySelector(".dds-choice-trigger")!.getAttribute("aria-label")).toBe(
      "Open time list",
    );
    await openList(host);
    expect(options()).toHaveLength(48);
    await type(field(host), "zz");
    await vi.waitFor(() => expect(host.textContent).toContain("No matching time"));
  });

  it("virtualizes a one-minute list", async () => {
    const host = mount(() => <TimePicker label="Time" step={1} value="12:00" />);
    await openList(host);
    expect(document.querySelectorAll('[role="option"]').length).toBeLessThan(60);
  });
});
