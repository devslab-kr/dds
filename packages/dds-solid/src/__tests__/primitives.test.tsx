import { render } from "solid-js/web";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Button, Checkbox, Dialog, Field, Icon, IconButton, Radio, Select, Switch,
  Tab, TabList, TabPanel, Tabs, ToastProvider, Tooltip, useToast,
} from "../index";
import { createStatusPill } from "../status-pill";
import { ConsoleShell, type ConsoleNavItem } from "../console-shell";

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
    const visibleTooltips = host.querySelectorAll('[role="tooltip"]:not([hidden])');
    expect(visibleTooltips).toHaveLength(1);
    expect(visibleTooltips[0]?.textContent).toBe("Controlled help");
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
