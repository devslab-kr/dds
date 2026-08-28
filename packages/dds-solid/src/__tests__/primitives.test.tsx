import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import { Button, Checkbox, Dialog, Tab, TabList, TabPanel, Tabs } from "../index";

let dispose: (() => void) | undefined;
afterEach(() => { dispose?.(); dispose = undefined; document.body.replaceChildren(); });

describe("native control behavior", () => {
  it("renders loading Button with native disabled semantics", () => {
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => <Button loading>Save</Button>, host);
    const button = host.querySelector("button")!;
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
  });

  it("supports controlled checkbox state", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    let value = false;
    dispose = render(() => {
      const [checked, setChecked] = createSignal(false);
      return <Checkbox label="Agree" checked={checked()} onCheckedChange={(next) => { value = next; setChecked(next); }} />;
    }, host);
    const checkbox = host.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    checkbox.click();
    await Promise.resolve();
    expect(value).toBe(true);
    expect(checkbox.checked).toBe(true);
  });
});

describe("keyboard lifecycle", () => {
  it("closes Dialog on Escape and returns focus", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const opener = document.body.appendChild(document.createElement("button"));
    opener.focus();
    let opened = () => true;
    dispose = render(() => {
      const [isOpen, setOpen] = createSignal(true);
      opened = isOpen;
      return <Dialog open={isOpen()} onOpenChange={setOpen} title="Confirm"><button>Inside</button></Dialog>;
    }, host);
    await Promise.resolve();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await Promise.resolve();
    expect(opened()).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it("moves Tabs with arrow keys and exposes linked panels", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => <Tabs defaultValue="one"><TabList><Tab value="one">One</Tab><Tab value="two">Two</Tab></TabList><TabPanel value="one">First</TabPanel><TabPanel value="two">Second</TabPanel></Tabs>, host);
    const tabs = [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    tabs[0]!.focus();
    tabs[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await Promise.resolve();
    expect(tabs[1]!.getAttribute("aria-selected")).toBe("true");
    expect(host.querySelector<HTMLElement>('[role="tabpanel"]:not([hidden])')?.textContent).toBe("Second");
  });
});
