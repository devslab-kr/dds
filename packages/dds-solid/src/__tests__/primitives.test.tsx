import { render } from "@solidjs/web";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Button, Checkbox, Dialog, Field, Icon, IconButton, Radio, Select, Switch,
  Tab, TabList, TabPanel, Tabs, ToastProvider, Tooltip, useToast,
} from "../index";

let dispose: (() => void) | undefined;
afterEach(() => { vi.useRealTimers(); dispose?.(); dispose = undefined; document.body.replaceChildren(); });

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

  it("renders IconButton, Field, Select, and Icon native accessibility contracts", () => {
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => <>
      <IconButton aria-label="Open settings"><Icon name="tool" /></IconButton>
      <Field label="Country" helpText="Choose one" error="Required" required>{(control) => (
        <Select {...control}><option>Korea</option></Select>
      )}</Field>
    </>, host);
    expect(host.querySelector("button")?.getAttribute("aria-label")).toBe("Open settings");
    expect(host.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    const select = host.querySelector("select")!;
    expect(select.getAttribute("aria-invalid")).toBe("true");
    expect(select.getAttribute("aria-describedby")).toContain("error");
  });

  for (const [name, Control] of [["Checkbox", Checkbox], ["Radio", Radio], ["Switch", Switch]] as const) {
    it(`${name} supports controlled and uncontrolled state`, async () => {
      const host = document.body.appendChild(document.createElement("div"));
      let controlled = () => false;
      dispose = render(() => {
        const [value, setValue] = createSignal(false);
        controlled = value;
        return <>
          <Control label={`${name} uncontrolled`} defaultChecked />
          <Control label={`${name} controlled`} checked={value()} onCheckedChange={setValue} />
        </>;
      }, host);
      const inputs = [...host.querySelectorAll<HTMLInputElement>("input")];
      expect(inputs[0]?.checked).toBe(true);
      inputs[1]?.click();
      await Promise.resolve();
      expect(controlled()).toBe(true);
      expect(inputs[1]?.checked).toBe(true);
    });
  }

  it("Tooltip supports controlled and uncontrolled state", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    let controlled = () => false;
    dispose = render(() => {
      const [open, setOpen] = createSignal(false);
      controlled = open;
      return <>
        <Tooltip content="Uncontrolled help">{(trigger) => <button {...trigger}>One</button>}</Tooltip>
        <Tooltip content="Controlled help" open={open()} onOpenChange={setOpen}>{(trigger) => <button {...trigger}>Two</button>}</Tooltip>
      </>;
    }, host);
    const buttons = [...host.querySelectorAll("button")];
    buttons[0]?.focus();
    buttons[1]?.focus();
    await Promise.resolve();
    expect(host.querySelectorAll('[role="tooltip"]:not([hidden])')).toHaveLength(2);
    expect(controlled()).toBe(true);
  });

  it("ToastProvider uses a localized dismiss label and clears timer lifecycle", async () => {
    vi.useFakeTimers();
    let api!: ReturnType<typeof useToast>;
    const Capture = () => { api = useToast(); return null; };
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => <ToastProvider dismissLabel="Cerrar notificación" defaultDuration={1000}><Capture /></ToastProvider>, host);
    api.show({ message: "Guardado" });
    expect(host.querySelector("button")?.getAttribute("aria-label")).toBe("Cerrar notificación");
    vi.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(host.querySelector('[role="status"]')).toBeNull();
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

  it("Dialog completes the focus trap cycle and returns focus during lifecycle cleanup", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const opener = document.body.appendChild(document.createElement("button"));
    opener.focus();
    dispose = render(() => <Dialog defaultOpen title="Cycle"><button>First</button><button>Last</button></Dialog>, host);
    await Promise.resolve();
    const buttons = [...host.querySelectorAll<HTMLButtonElement>("button")];
    buttons[1]?.focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(document.activeElement).toBe(buttons[0]);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }));
    expect(document.activeElement).toBe(buttons[1]);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await Promise.resolve();
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
    tabs[1]!.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    expect(tabs[0]).toBe(document.activeElement);
    tabs[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    expect(tabs[1]).toBe(document.activeElement);
  });
});
