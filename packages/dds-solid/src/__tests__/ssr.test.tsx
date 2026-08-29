import { renderToString } from "solid-js/web";
import { expect, it } from "vitest";

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

it("server-renders every public primitive", () => {
  const html = renderToString(() => <AllPrimitives />);
  expect(html).toContain("Hydrate");
  expect(html).toContain("aria-label=\"Complete\"");
});
