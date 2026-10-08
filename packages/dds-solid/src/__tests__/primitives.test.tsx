import { render } from "solid-js/web";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Button, Checkbox, Dialog, Field, Icon, IconButton, Radio, RadioGroup, Select, Switch,
  Tab, TabList, TabPanel, Tabs, ToastProvider, Tooltip, useToast,
} from "../index";
import { createStatusPill } from "../status-pill";
import { ConsoleShell, type ConsoleNavItem } from "../console-shell";

let dispose: (() => void) | undefined;
afterEach(() => { vi.useRealTimers(); dispose?.(); dispose = undefined; document.body.replaceChildren(); });

describe("native control behavior", () => {
  it("composes the tab root onto the consumer layout without an extra wrapper", () => {
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => <Tabs defaultValue="a" unstyled asChild={attrs => <div {...attrs} class="consumer-layout" />}>
      <main><TabList><Tab value="a">A</Tab></TabList><TabPanel value="a">Page</TabPanel></main>
    </Tabs>, host);
    expect(host.children).toHaveLength(1);
    expect(host.firstElementChild?.className).toBe("consumer-layout");
    expect(host.querySelector(".consumer-layout > main")).not.toBeNull();
    expect(host.querySelector('[role="tab"]')?.getAttribute("aria-selected")).toBe("true");
  });
  it("supports manual tabs, consumer IDs and custom native triggers without changing selection on arrow focus", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const changed = vi.fn();
    const clicked = vi.fn();
    let custom!: HTMLButtonElement;
    dispose = render(() => <Tabs defaultValue="a" activationMode="manual" onValueChange={changed}
      tabId={value => `consumer-tab-${value}`} panelId={value => `consumer-panel-${value}`}>
      <TabList unstyled><Tab value="a" unstyled>A</Tab><Tab value="b" unstyled ref={custom} onClick={clicked}
        asChild={attrs => <button {...attrs} data-custom="true">B</button>} /></TabList>
      <TabPanel value="a" style="display:flex">First</TabPanel><TabPanel value="b" style={{ display: "grid" }}>Second</TabPanel>
    </Tabs>, host);
    const first = host.querySelector<HTMLButtonElement>('#consumer-tab-a')!;
    first.focus();
    first.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await vi.waitFor(() => expect(document.activeElement).toBe(custom));
    expect(changed).not.toHaveBeenCalled();
    expect(first.getAttribute("aria-selected")).toBe("true");
    expect(host.querySelector<HTMLDivElement>('#consumer-panel-a')!.style.display).toBe("flex");
    expect(host.querySelector<HTMLDivElement>('#consumer-panel-b')!.style.display).toBe("none");
    expect(custom.id).toBe("consumer-tab-b");
    expect(custom.classList.contains("dds-tab")).toBe(false);
    expect(host.querySelector('[role="tablist"]')?.classList.contains("dds-tabs")).toBe(false);
    custom.click();
    await vi.waitFor(() => expect(changed).toHaveBeenCalledWith("b"));
    expect(custom.getAttribute("aria-controls")).toBe("consumer-panel-b");
    await vi.waitFor(() => expect(host.querySelector<HTMLDivElement>('#consumer-panel-a')!.style.display).toBe("none"));
    expect(host.querySelector<HTMLDivElement>('#consumer-panel-b')!.style.display).toBe("grid");
    expect(clicked).toHaveBeenCalledOnce();
  });
  it("preserves checkable consumer ARIA, focus handlers and click bubbling", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const clicked = vi.fn();
    const focused = vi.fn();
    dispose = render(() => <div onClick={clicked}><span id="custom-label">Custom</span><Checkbox label="Agree" aria-labelledby="custom-label" aria-invalid="true" onFocusIn={focused} /></div>, host);
    const input = host.querySelector("input")!;
    input.focus(); input.click();
    await Promise.resolve();
    expect(input.getAttribute("aria-labelledby")).toBe("custom-label");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(focused).toHaveBeenCalledOnce();
    expect(clicked).toHaveBeenCalledOnce();
  });

  it("keeps multiple toast providers independent with unique region IDs", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    let one!: ReturnType<typeof useToast>;
    let two!: ReturnType<typeof useToast>;
    const One = () => { one = useToast(); return null; };
    const Two = () => { two = useToast(); return null; };
    dispose = render(() => <><ToastProvider defaultDuration={0}><One /></ToastProvider><ToastProvider defaultDuration={0}><Two /></ToastProvider></>, host);
    one.show({ message: "First" }); two.show({ message: "Second" });
    await Promise.resolve();
    const regions = [...host.querySelectorAll(".dds-toast-region")];
    expect(new Set(regions.map((region) => region.id)).size).toBe(2);
    one.clear();
    await Promise.resolve();
    expect(regions[0]?.textContent).toBe("");
    expect(regions[1]?.textContent).toContain("Second");
    expect(regions[0]?.getAttribute("aria-label")).toBe("");
  });

  it("preserves the legacy zero-argument tooltip trigger callbacks", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    let focus!: () => void;
    let blur!: () => void;
    dispose = render(() => <Tooltip content="Legacy">{(trigger) => {
      focus = trigger.onFocus; blur = trigger.onBlur;
      return <button {...trigger}>Legacy trigger</button>;
    }}</Tooltip>, host);
    focus();
    await vi.waitFor(() => expect(host.querySelector('[role="tooltip"]:not([hidden])')?.textContent).toBe("Legacy"));
    blur();
    await vi.waitFor(() => expect(host.querySelector('[role="tooltip"]:not([hidden])')).toBeNull());
  });
  it("submits grouped radios and resets native checkable values", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => <form>
      <Checkbox name="agree" label="Agree" defaultChecked />
      <Switch name="enabled" label="Enabled" defaultChecked />
      <RadioGroup name="choice" label="Choice" defaultValue="a" options={[{ value: "a", label: "A" }, { value: "b", label: "B" }]} />
    </form>, host);
    const form = host.querySelector("form")!;
    const checkboxes = [...form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
    checkboxes.forEach((input) => input.click());
    form.querySelector<HTMLInputElement>('input[value="b"]')!.click();
    await vi.waitFor(() => expect(new FormData(form).get("choice")).toBe("b"));
    expect(new FormData(form).has("agree")).toBe(false);
    form.reset();
    await vi.waitFor(() => expect(checkboxes.every((input) => input.checked)).toBe(true));
    await vi.waitFor(() => expect(new FormData(form).get("choice")).toBe("a"));
  });
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
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    buttons[0]?.focus();
    buttons[1]?.focus();
    await vi.waitFor(() => expect(controlled()).toBe(true));
    await vi.waitFor(() => expect(host.querySelectorAll('[role="tooltip"]:not([hidden])')).toHaveLength(1));
    const visibleTooltips = host.querySelectorAll('[role="tooltip"]:not([hidden])');
    expect(visibleTooltips).toHaveLength(1);
    expect(visibleTooltips[0]?.textContent).toBe("Controlled help");
    expect(controlled()).toBe(true);
  });

  it("ToastProvider uses a localized dismiss label and clears timer lifecycle", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date", "performance"] });
    let api!: ReturnType<typeof useToast>;
    const Capture = () => { api = useToast(); return null; };
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => <ToastProvider dismissLabel="Cerrar notificación" defaultDuration={1000}><Capture /></ToastProvider>, host);
    api.show({ message: "Guardado" });
    await vi.advanceTimersByTimeAsync(0);
    expect(host.querySelector("button")?.getAttribute("aria-label")).toBe("Cerrar notificación");
    await vi.advanceTimersByTimeAsync(1100);
    expect(host.querySelector('[role="status"]')).toBeNull();
  });

  it("pauses toast expiry while the user is reading it", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date", "performance"] });
    let api!: ReturnType<typeof useToast>;
    const Capture = () => { api = useToast(); return null; };
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => <ToastProvider defaultDuration={1000}><Capture /></ToastProvider>, host);
    api.show({ message: "Read this" });
    await vi.advanceTimersByTimeAsync(100);
    host.querySelector(".dds-toast-region")!.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(2000);
    expect(host.querySelector('[role="status"]')?.textContent).toContain("Read this");
    host.querySelector(".dds-toast-region")!.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(1000);
    expect(host.querySelector('[role="status"]')).toBeNull();
  });
});

describe("keyboard lifecycle", () => {
  it("keeps an authorized external retry region in the dialog focus and accessibility scope", async () => {
    const rectangles = vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(() => [new DOMRect(0, 0, 10, 10)] as unknown as DOMRectList);
    const background = document.body.appendChild(document.createElement("div"));
    background.textContent = "Background";
    const opener = background.appendChild(document.createElement("button")); opener.textContent = "Open"; opener.focus();
    const region = document.body.appendChild(document.createElement("div"));
    const retry = region.appendChild(document.createElement("button")); retry.textContent = "Retry";
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => <Dialog defaultOpen title="Retry task" additionalFocusContainers={() => [region]}><button>First</button><button>Last</button></Dialog>, host);
    const buttons = [...host.querySelectorAll<HTMLButtonElement>("button")];
    await vi.waitFor(() => expect(document.activeElement).toBe(buttons[0]));
    await vi.waitFor(() => expect(background.getAttribute("aria-hidden")).toBe("true"));
    expect(region.closest('[aria-hidden="true"]')).toBeNull();
    buttons[1]!.focus(); buttons[1]!.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(document.activeElement).toBe(retry);
    retry.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(document.activeElement).toBe(buttons[0]);
    buttons[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }));
    expect(document.activeElement).toBe(retry);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await vi.waitFor(() => expect(document.activeElement).toBe(opener));
    expect(background.getAttribute("aria-hidden")).toBeNull();
    rectangles.mockRestore();
  });

  it("supports a portalled custom dialog frame, focus targets and cancellable Escape", async () => {
    const rectangles = vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(() => [new DOMRect(0, 0, 10, 10)] as unknown as DOMRectList);
    const host = document.body.appendChild(document.createElement("div"));
    const destination = document.body.appendChild(document.createElement("div"));
    const final = document.body.appendChild(document.createElement("button")); final.textContent = "Fallback";
    let initial!: HTMLInputElement;
    const escape = vi.fn((event: KeyboardEvent) => event.preventDefault());
    dispose = render(() => <Dialog defaultOpen title="Custom task" role="alertdialog" portal portalMount={destination}
      initialFocus={() => initial} finalFocus={() => final} onEscapeKeyDown={escape}
      unstyled class="custom-panel" overlayClass="custom-overlay" titleClass="custom-title"
      frame={(parts) => <><header>{parts.title}</header><main>{parts.children}</main></>}>
      <button>Earlier button</button><input ref={initial} aria-label="First field" />
    </Dialog>, host);
    await vi.waitFor(() => expect(document.activeElement).toBe(initial));
    expect(host.querySelector('[role="alertdialog"]')).toBeNull();
    expect(destination.querySelector('.custom-panel[role="alertdialog"]')).not.toBeNull();
    expect(destination.querySelector("header .custom-title")?.textContent).toBe("Custom task");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await vi.waitFor(() => expect(escape).toHaveBeenCalledTimes(1));
    expect(destination.querySelector('[role="alertdialog"]')).not.toBeNull();
    dispose?.(); dispose = undefined;
    await vi.waitFor(() => expect(document.activeElement).toBe(final));
    rectangles.mockRestore();
  });
  it("inherits RTL tab direction without requiring an Ark provider", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.dir = "rtl";
    dispose = render(() => <Tabs defaultValue="one"><TabList><Tab value="one">One</Tab><Tab value="two">Two</Tab><Tab value="three">Three</Tab></TabList><TabPanel value="one">First</TabPanel><TabPanel value="two">Second</TabPanel><TabPanel value="three">Third</TabPanel></Tabs>, host);
    const tabs = [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    tabs[0]!.focus();
    tabs[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    await vi.waitFor(() => expect(tabs[1]!.getAttribute("aria-selected")).toBe("true"));
  });
  it("does not let ToastProvider steal focus from application keys", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => <ToastProvider><input aria-label="Typing" /></ToastProvider>, host);
    const input = host.querySelector("input")!;
    input.focus();
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "a", code: "KeyA", bubbles: true }));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    expect(document.activeElement).toBe(input);
  });
  it("skips tabs disabled after mount and preserves inactive panel instances", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    let disable!: () => void;
    let mounts = 0;
    const Page = () => { mounts++; return <input value="retained" />; };
    dispose = render(() => {
      const [disabled, setDisabled] = createSignal(false);
      disable = () => setDisabled(true);
      return <Tabs defaultValue="one"><TabList><Tab value="one">One</Tab><Tab value="two" disabled={disabled()}>Two</Tab><Tab value="three">Three</Tab></TabList><TabPanel value="one"><Page /></TabPanel><TabPanel value="three">Third</TabPanel></Tabs>;
    }, host);
    const tabs = [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const input = host.querySelector("input");
    disable();
    tabs[0]!.focus();
    tabs[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await vi.waitFor(() => expect(document.activeElement).toBe(tabs[2]));
    await vi.waitFor(() => expect(tabs[2]!.getAttribute("aria-selected")).toBe("true"));
    tabs[0]!.click();
    expect(host.querySelector("input")).toBe(input);
    expect(mounts).toBe(1);
  });
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
    // jsdom has no layout. Supply visible rectangles for the trap's tabbable scan.
    const rectangles = vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(() => [new DOMRect(0, 0, 10, 10)] as unknown as DOMRectList);
    const host = document.body.appendChild(document.createElement("div"));
    const opener = document.body.appendChild(document.createElement("button"));
    opener.focus();
    dispose = render(() => <Dialog defaultOpen title="Cycle"><button>First</button><button>Last</button></Dialog>, host);
    const buttons = [...host.querySelectorAll<HTMLButtonElement>("button")];
    await vi.waitFor(() => expect(document.activeElement).toBe(buttons[0]));
    buttons[1]?.focus();
    buttons[1]!.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(document.activeElement).toBe(buttons[0]);
    buttons[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }));
    expect(document.activeElement).toBe(buttons[1]);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await vi.waitFor(() => expect(document.activeElement).toBe(opener));
    rectangles.mockRestore();
  });

  it("moves Tabs with arrow keys and exposes linked panels", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => <Tabs defaultValue="one"><TabList><Tab value="one">One</Tab><Tab value="two">Two</Tab></TabList><TabPanel value="one">First</TabPanel><TabPanel value="two">Second</TabPanel></Tabs>, host);
    const tabs = [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    tabs[0]!.focus();
    tabs[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await vi.waitFor(() => expect(tabs[1]!.getAttribute("aria-selected")).toBe("true"));
    await vi.waitFor(() => expect(host.querySelector<HTMLElement>('[role="tabpanel"]:not([hidden])')?.textContent).toBe("Second"));
    tabs[1]!.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await vi.waitFor(() => expect(tabs[0]).toBe(document.activeElement));
    tabs[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await vi.waitFor(() => expect(tabs[1]).toBe(document.activeElement));
  });
});

it("keeps native section dialog presence and ordinary Ark dismissal", async () => {
  const host = document.body.appendChild(document.createElement("div"));
  const [open, setOpen] = createSignal(false);
  dispose = render(() => <>
    <button onClick={() => setOpen(true)}>Open section</button>
    <Dialog contentAs="section" open={open()} onOpenChange={setOpen} title="Native task"><button>Action</button></Dialog>
  </>, host);
  host.querySelector<HTMLButtonElement>("button")!.click();
  await vi.waitFor(() => expect(host.querySelector('section[role="dialog"]')?.getAttribute("aria-labelledby")).toBeTruthy());
  await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
  host.querySelector('section[role="dialog"]')!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  await vi.waitFor(() => expect(host.querySelector('[role="dialog"]')).toBeNull());
  expect(open()).toBe(false);
});

describe("createStatusPill", () => {
  const pill = createStatusPill({
    tones: { key: { active: "success", revoked: "danger" }, role: { owner: "brand" } },
    label: (_domain, value) => (value === "active" ? "Active" : value === "owner" ? "Owner" : undefined),
    openDomains: ["role"],
  });

  it("renders the tone and the injected label", () => {
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => pill({ domain: "key", value: "active", locale: "en" }), host);
    const node = host.querySelector("span");
    expect(node?.className).toContain("dds-badge--success");
    expect(node?.getAttribute("data-status")).toBe("key.active");
    expect(node?.getAttribute("data-tone")).toBe("success");
    expect(node?.textContent).toBe("Active");
  });

  it("throws for an unknown value in a closed domain", () => {
    const host = document.body.appendChild(document.createElement("div"));
    expect(() => render(() => pill({ domain: "key", value: "mystery", locale: "en" }), host)).toThrow();
  });

  it("renders raw text for an unknown value in an open domain", () => {
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => pill({ domain: "role", value: "project.viewer", locale: "en" }), host);
    expect(host.querySelector("code")?.textContent).toBe("project.viewer");
  });
});

describe("ConsoleShell", () => {
  const nav = [{ label: "Build", items: [
    { id: "projects", href: "/dashboard/projects", label: "Projects" },
    { id: "jobs", href: "/dashboard/jobs", label: "Jobs", badge: 3 },
  ] }];
  const labels = { skip: "Skip to content", menuOpen: "Open menu", menuClose: "Close menu", nav: "Dashboard navigation", badge: "{count} pending" };
  const shell = () => (
    <ConsoleShell
      surface="dashboard" activePath="/dashboard/jobs"
      brand={{ href: "/dashboard", name: "VisionLinq", mark: "/brand/mark.svg" }}
      nav={nav} labels={labels} header={{ title: "Jobs" }} foot={<button>Sign out</button>}
    >
      <p data-body>body</p>
    </ConsoleShell>
  );

  it("marks the active item by exact match on an index route and by prefix elsewhere", () => {
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(shell, host);
    const active = host.querySelector('[aria-current="page"]');
    expect(active?.getAttribute("data-nav")).toBe("dashboard.jobs");
  });

  it("renders the badge with the injected label and no words of its own", () => {
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(shell, host);
    const badge = host.querySelector(".dds-console-rail__badge");
    expect(badge?.textContent).toBe("3");
    expect(badge?.getAttribute("aria-label")).toBe("3 pending");
  });

  it("opens and closes the drawer", () => {
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(shell, host);
    const toggle = host.querySelector('[data-action="toggle-rail"]') as HTMLButtonElement;
    toggle.click();
    expect(host.querySelector(".dds-console-rail")?.getAttribute("data-open")).toBe("true");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(host.querySelector(".dds-console-rail")?.getAttribute("data-open")).toBe("false");
  });

  it("renders the foot slot and the children", () => {
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(shell, host);
    expect(host.querySelector(".dds-console-rail__foot button")?.textContent).toBe("Sign out");
    expect(host.querySelector("[data-body]")).not.toBeNull();
  });

  // isActive's two real behaviors, each pinned separately so deleting either
  // branch in `isActive` (packages/dds-solid/src/console-shell.tsx) fails a
  // test: the previous "exact match on an index route and by prefix
  // elsewhere" test used an activePath/href pair that never exercised a
  // one-segment index href or a path deeper than its href, so both branches
  // were dead weight as far as coverage was concerned.
  const render1 = (activePath: string, items: ConsoleNavItem[]) => {
    const host = document.body.appendChild(document.createElement("div"));
    dispose = render(() => (
      <ConsoleShell
        surface="dashboard" activePath={activePath}
        brand={{ href: "/dashboard", name: "VisionLinq", mark: "/brand/mark.svg" }}
        nav={[{ label: "Build", items }]} labels={labels} header={{ title: "Jobs" }}
      >
        <p data-body>body</p>
      </ConsoleShell>
    ), host);
    return host;
  };

  it("matches a one-segment index href only by exact path", () => {
    const items = [{ id: "home", href: "/dashboard", label: "Home" }];
    const exact = render1("/dashboard", items);
    expect(exact.querySelector('[aria-current="page"]')).not.toBeNull();
  });

  it("does not match a one-segment index href by prefix on a deeper activePath", () => {
    const items = [{ id: "home", href: "/dashboard", label: "Home" }];
    const deeper = render1("/dashboard/jobs", items);
    expect(deeper.querySelector('[aria-current="page"]')).toBeNull();
  });

  it("matches a multi-segment href by prefix when activePath goes deeper still", () => {
    const items = [{ id: "jobs", href: "/dashboard/jobs", label: "Jobs" }];
    const host = render1("/dashboard/jobs/42", items);
    expect(host.querySelector('[aria-current="page"]')).not.toBeNull();
  });

  it("lets an explicit active override win over an otherwise-matching href", () => {
    const items = [{ id: "jobs", href: "/dashboard/jobs", label: "Jobs", active: false }];
    const host = render1("/dashboard/jobs", items);
    expect(host.querySelector('[aria-current="page"]')).toBeNull();
  });
});
