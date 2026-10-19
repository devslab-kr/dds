import axe from "axe-core";
import { render } from "solid-js/web";
import { afterEach, expect, it } from "vitest";

import {
  Button, Checkbox, Dialog, Field, Icon, IconButton, Radio, RadioGroup, Select, Switch,
  Tab, TabList, TabPanel, Tabs, TimePicker, ToastProvider, Tooltip, useToast,
  SegmentedControl, NumberInput,
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
    <TimePicker label="Closing time" defaultValue="18:00" clearable />
    <TimePicker aria-label="Opening time" value="25:99" />
    <SegmentedControl label="View" name="view" items={[{ value: "day", label: "Day" }, { value: "week", label: "Week" }, { value: "month", label: "Month", disabled: true }]} defaultValue="day" />
    <SegmentedControl aria-label="Status filter" items={[{ value: "all", label: "All" }, { value: "open", label: "Open" }]} defaultValue="open" size="sm" fullWidth />
    <NumberInput label="Amount" name="amount" locale="en-US" defaultValue={1500} suffix="KRW" min={0} max={2000} />
    <NumberInput aria-label="Quantity" labelPlacement="hidden" stepper={false} />
    <NumberInput label="Hidden quantity" labelPlacement="hidden" invalid required />
    <Dialog defaultOpen title="Confirm" description="Review the action"><button>Continue</button></Dialog>
    <Tabs defaultValue="one"><TabList><Tab value="one">One</Tab><Tab value="two">Two</Tab></TabList><TabPanel value="one">First</TabPanel><TabPanel value="two">Second</TabPanel></Tabs>
    <Tooltip content="More information" defaultOpen>{(trigger) => <button {...trigger}>Help</button>}</Tooltip>
    <ToastProvider dismissLabel="Close notification" defaultDuration={0}><CaptureToast /></ToastProvider>
  </>, host);
  toast.show({ message: "Saved" });
  const result = await axe.run(host, { rules: { "color-contrast": { enabled: false } } });
  expect(result.violations).toEqual([]);
}, 20_000); // axe over every primitive is CPU-heavy under a parallel run.

it("an open TimePicker list has no detectable axe violations", async () => {
  const host = document.body.appendChild(document.createElement("main"));
  dispose = render(() => <TimePicker label="Closing time" defaultValue="10:45" />, host);
  host.querySelector<HTMLButtonElement>(".dds-choice-trigger")!.click();
  await new Promise((resolve) => setTimeout(resolve, 60));
  expect(host.querySelector('[role="combobox"]')!.getAttribute("aria-expanded")).toBe("true");
  expect(document.querySelector('[role="listbox"] [role="option"][data-state="checked"]')?.textContent).toBe("10:45");
  // The list is portaled to <body> beside this page's single <main>; "region" judges that page layout, not the list.
  const result = await axe.run(document.body, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
  expect(result.violations).toEqual([]);
}, 20_000);
