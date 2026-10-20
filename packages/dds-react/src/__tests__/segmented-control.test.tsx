import { StrictMode, useState } from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl, validateSegmentedItems } from "../segmented-control";

const tick = () =>
  act(() => new Promise<void>((resolve) => setTimeout(resolve, 20)));
const items = [
  { value: "day", label: "일" },
  { value: "week", label: "주" },
  { value: "month", label: "월" },
];
const radio = (host: HTMLElement, value: string) =>
  host.querySelector<HTMLInputElement>(`input[type="radio"][value="${value}"]`)!;
const segment = (host: HTMLElement, value: string) =>
  radio(host, value).closest<HTMLElement>(".dds-segmented__item")!;
const choose = async (input: HTMLInputElement) => {
  fireEvent.click(input);
  await tick();
};

describe("SegmentedControl", () => {
  it("is a labelled radio group whose segments are named by their text", () => {
    const { container: host } = render(
      <SegmentedControl label="보기" items={items} defaultValue="week" />,
    );
    const group = host.querySelector('[role="radiogroup"]')!;
    const label = host.querySelector(".dds-segmented__label")!;
    expect(group.getAttribute("aria-labelledby")).toBe(label.id);
    expect(label.textContent).toBe("보기");
    const week = radio(host, "week");
    expect(week.checked).toBe(true);
    expect(
      document.getElementById(week.getAttribute("aria-labelledby")!)?.textContent,
    ).toBe("주");
    expect(segment(host, "week").dataset.state).toBe("checked");
    expect(segment(host, "day").dataset.state).toBe("unchecked");
  });

  it("gives each instance its own part IDs, so labels and radios never collide", () => {
    const { container: host } = render(
      <StrictMode>
        <SegmentedControl label="보기" items={items} defaultValue="day" />
        <SegmentedControl label="모드" items={items} defaultValue="day" />
        <SegmentedControl id="period" label="기간" items={items} defaultValue="day" />
      </StrictMode>,
    );
    const ids = [...host.querySelectorAll("[id]")].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    const groups = [...host.querySelectorAll('[role="radiogroup"]')];
    expect(
      groups.map(
        (group) =>
          document.getElementById(group.getAttribute("aria-labelledby")!)?.textContent,
      ),
    ).toEqual(["보기", "모드", "기간"]);
    expect(groups[2]!.id).toBe("period");
    // Unnamed groups still keep their radios in separate native groups.
    const names = groups.map(
      (group) => group.querySelector<HTMLInputElement>('input[type="radio"]')!.name,
    );
    expect(new Set(names).size).toBe(3);
  });

  it("names an unlabelled group from aria-label without a dangling label reference", () => {
    const { container: host } = render(
      <SegmentedControl aria-label="기간" items={items} defaultValue="day" />,
    );
    const group = host.querySelector('[role="radiogroup"]')!;
    expect(group.getAttribute("aria-label")).toBe("기간");
    expect(group.hasAttribute("aria-labelledby")).toBe(false);
    expect(host.querySelector(".dds-segmented__label")).toBeNull();
  });

  it("selects uncontrolled values and reports each user choice once, also under StrictMode", async () => {
    for (const strict of [false, true]) {
      const change = vi.fn();
      const control = (
        <SegmentedControl label="보기" items={items} defaultValue="day" onValueChange={change} />
      );
      const view = render(strict ? <StrictMode>{control}</StrictMode> : control);
      const host = view.container;
      await choose(radio(host, "month"));
      expect(change).toHaveBeenCalledExactlyOnceWith("month");
      expect(segment(host, "month").dataset.state).toBe("checked");
      expect(segment(host, "day").dataset.state).toBe("unchecked");
      view.unmount();
    }
  });

  it("keeps controlled values owned by the parent and follows external updates", async () => {
    const change = vi.fn();
    let setValue: (next: string) => void = () => {};
    function Parent() {
      const [value, set] = useState("day");
      setValue = set;
      return (
        <SegmentedControl label="보기" items={items} value={value} onValueChange={change} />
      );
    }
    const { container: host } = render(<Parent />);
    await choose(radio(host, "week"));
    expect(change).toHaveBeenCalledExactlyOnceWith("week");
    expect(segment(host, "day").dataset.state).toBe("checked");
    act(() => setValue("month"));
    await tick();
    expect(segment(host, "month").dataset.state).toBe("checked");
    expect(radio(host, "month").checked).toBe(true);
    expect(change).toHaveBeenCalledOnce();
  });

  it("does not change while disabled, read-only, or on a disabled segment", async () => {
    const change = vi.fn();
    const { container: host } = render(
      <>
        <div id="disabled"><SegmentedControl label="A" name="a" items={items} defaultValue="day" disabled onValueChange={change} /></div>
        <div id="readonly"><SegmentedControl label="B" name="b" items={items} defaultValue="day" readOnly onValueChange={change} /></div>
        <div id="item"><SegmentedControl label="C" name="c" items={[...items.slice(0, 2), { value: "month", label: "월", disabled: true }]} defaultValue="day" onValueChange={change} /></div>
      </>,
    );
    const disabled = host.querySelector<HTMLElement>("#disabled")!;
    const readonly = host.querySelector<HTMLElement>("#readonly")!;
    const item = host.querySelector<HTMLElement>("#item")!;
    expect(radio(disabled, "week").disabled).toBe(true);
    expect(radio(readonly, "week").disabled).toBe(true);
    expect(radio(item, "month").disabled).toBe(true);
    expect(segment(item, "month").hasAttribute("data-disabled")).toBe(true);
    fireEvent.click(radio(disabled, "week"));
    fireEvent.click(radio(readonly, "week"));
    fireEvent.click(radio(item, "month"));
    await tick();
    expect(change).not.toHaveBeenCalled();
    expect(segment(readonly, "day").dataset.state).toBe("checked");
  });

  it("submits the selected item ID and restores the first choice on form reset", async () => {
    const { container: host } = render(
      <form>
        <SegmentedControl label="보기" name="view" items={items} defaultValue="week" />
      </form>,
    );
    const form = host.querySelector("form")!;
    expect(new FormData(form).get("view")).toBe("week");
    await choose(radio(host, "month"));
    expect(new FormData(form).get("view")).toBe("month");
    act(() => form.reset());
    await tick();
    expect(new FormData(form).get("view")).toBe("week");
    expect(segment(host, "week").dataset.state).toBe("checked");
  });

  it("marks size, full width, invalid and required on the group", () => {
    const { container: host } = render(
      <SegmentedControl label="보기" name="view" items={items} size="sm" fullWidth invalid required />,
    );
    const group = host.querySelector<HTMLElement>(".dds-segmented")!;
    expect(group.dataset.size).toBe("sm");
    expect(group.hasAttribute("data-full-width")).toBe(true);
    expect(group.hasAttribute("data-invalid")).toBe(true);
    expect(group.getAttribute("aria-required")).toBe("true");
    expect(radio(host, "day").required).toBe(true);
    expect(segment(host, "day").title).toBe("일");
  });

  it("rejects empty and duplicate item values", () => {
    expect(() => validateSegmentedItems([])).toThrow(/must not be empty/);
    expect(() => validateSegmentedItems([{ value: "", label: "A" }])).toThrow(/nonempty and unique/);
    expect(() =>
      validateSegmentedItems([
        { value: "a", label: "A" },
        { value: "a", label: "B" },
      ]),
    ).toThrow(/nonempty and unique/);
  });
});
