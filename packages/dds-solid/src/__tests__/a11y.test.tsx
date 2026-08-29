import axe from "axe-core";
import { render } from "@solidjs/web";
import { afterEach, expect, it } from "vitest";

import {
  Button, Checkbox, Dialog, Field, Icon, IconButton, Radio, Select, Switch,
  Tab, TabList, TabPanel, Tabs, ToastProvider, Tooltip, useToast,
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
