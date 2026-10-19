import axe from "axe-core";
import { render } from "solid-js/web";
import { afterEach, expect, it, vi } from "vitest";

import {
  Button, Checkbox, Dialog, Field, Icon, IconButton, Radio, RadioGroup, Select, Switch,
  Tab, TabList, TabPanel, Tabs, ToastProvider, Tooltip, useToast,
  DateRangePicker, MonthPicker,
} from "../index";

let dispose: (() => void) | undefined;
afterEach(() => { dispose?.(); dispose = undefined; document.body.replaceChildren(); });

it("common form primitives have no detectable axe violations", async () => {
  let toast!: ReturnType<typeof useToast>;
  const CaptureToast = () => { toast = useToast(); return null; };
  const host = document.body.appendChild(document.createElement("main"));
  dispose = render(() => <>
    <Button>Save</Button>
    <IconButton aria-label="Settings"><Icon name="tool" /></IconButton>
    <Field label="Country" helpText="Choose one">{(control) => <Select {...control}><option>Korea</option></Select>}</Field>
    <Checkbox label="Accept terms" />
    <Radio label="Email" name="contact" defaultChecked />
    <RadioGroup label="Choice" name="choice" options={[{ value: "a", label: "Choice A" }, { value: "b", label: "Choice B" }]} defaultValue="a" />
    <Switch label="Notifications" />
    <Dialog defaultOpen title="Confirm" description="Review the action"><button>Continue</button></Dialog>
    <Tabs defaultValue="one"><TabList><Tab value="one">One</Tab><Tab value="two">Two</Tab></TabList><TabPanel value="one">First</TabPanel><TabPanel value="two">Second</TabPanel></Tabs>
    <Tooltip content="More information" defaultOpen>{(trigger) => <button {...trigger}>Help</button>}</Tooltip>
    <ToastProvider dismissLabel="Close notification" defaultDuration={0}><CaptureToast /></ToastProvider>
  </>, host);
  toast.show({ message: "Saved" });
  const result = await axe.run(host, { rules: { "color-contrast": { enabled: false } } });
  expect(result.violations).toEqual([]);
});

it("DateRangePicker and MonthPicker fields and open calendars have no detectable axe violations", async () => {
  const host = document.body.appendChild(document.createElement("main"));
  dispose = render(() => <>
    <DateRangePicker label="조회 기간" required startName="from" endName="to"
      defaultValue={{ start: "2026-10-01", end: "2026-10-20" }}
      presets={[{ label: "이번 달", value: { start: "2026-10-01", end: "2026-10-31" } }]} />
    <DateRangePicker aria-label="Hidden label period" labelPlacement="hidden" locale="en-US" />
    <MonthPicker label="청구 월" name="month" defaultValue="2026-10" />
    <MonthPicker label="Billing month" locale="en-US" labelPlacement="inside" invalid />
  </>, host);
  const rules = { rules: { "color-contrast": { enabled: false } } };
  expect((await axe.run(host, rules)).violations).toEqual([]);
  const triggers = host.querySelectorAll<HTMLButtonElement>('[data-part="trigger"]');
  triggers[0]!.click();
  await vi.waitFor(() => expect(document.querySelector('.dds-date-range-content[data-state="open"]')).not.toBeNull());
  expect((await axe.run(document.querySelector<HTMLElement>('.dds-date-range-content[data-state="open"]')!, rules)).violations).toEqual([]);
  triggers[2]!.click();
  await vi.waitFor(() => expect(document.querySelector('.dds-month-picker-content[data-state="open"]')).not.toBeNull());
  expect((await axe.run(document.querySelector<HTMLElement>('.dds-month-picker-content[data-state="open"]')!, rules)).violations).toEqual([]);
});
