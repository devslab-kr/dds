import { hydrate, renderToString } from "@solidjs/web";
import { expect, it, vi } from "vitest";

import {
  Button, Checkbox, Dialog, Field, Icon, IconButton, Radio, Select, Switch,
  Tab, TabList, TabPanel, Tabs, ToastProvider, Tooltip,
} from "../index";

const AllPrimitives = () => <div>
  <Button>Hydrate</Button>
  <IconButton aria-label="Complete"><Icon name="check" /></IconButton>
  <Field label="Country">{(control) => <Select {...control}><option>Korea</option></Select>}</Field>
  <Checkbox label="Check" defaultChecked />
  <Radio label="Radio" name="ssr-radio" />
  <Switch label="Switch" />
  <Dialog defaultOpen title="Dialog"><button>Action</button></Dialog>
  <Tabs defaultValue="one"><TabList><Tab value="one">One</Tab></TabList><TabPanel value="one">Panel</TabPanel></Tabs>
  <Tooltip content="Tip" defaultOpen>{(trigger) => <button {...trigger}>Trigger</button>}</Tooltip>
  <ToastProvider dismissLabel="Close"><span>Toast host</span></ToastProvider>
</div>;

it("renders and hydrates the public primitives without warnings", async () => {
  const html = renderToString(() => <AllPrimitives />);
  expect(html).toContain("Hydrate");
  expect(html).toContain("aria-label=\"Complete\"");
  const host = document.body.appendChild(document.createElement("div"));
  host.innerHTML = html;
  const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const dispose = hydrate(() => <AllPrimitives />, host);
  await Promise.resolve();
  expect(warning).not.toHaveBeenCalled();
  expect(error).not.toHaveBeenCalled();
  dispose();
  host.remove();
});
