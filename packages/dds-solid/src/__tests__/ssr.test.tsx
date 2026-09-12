import { renderToString } from "solid-js/web";
import { expect, it } from "vitest";

import {
  Button, Checkbox, ConsoleShell, Dialog, Field, Icon, IconButton, Radio, Select, Switch,
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

it("server-renders ConsoleShell without the client-only hydration claim", () => {
  const nav = [{ label: "Build", items: [{ id: "projects", href: "/dashboard/projects", label: "Projects" }] }];
  const labels = { skip: "Skip to content", menuOpen: "Open menu", menuClose: "Close menu", nav: "Dashboard navigation", badge: "{count} pending" };
  const html = renderToString(() => (
    <ConsoleShell
      surface="dashboard" activePath="/dashboard/projects"
      brand={{ href: "/dashboard", name: "VisionLinq", mark: "/brand/mark.svg" }}
      nav={nav} labels={labels} header={{ title: "Projects" }}
    >
      <p>body</p>
    </ConsoleShell>
  ));
  expect(html).toContain("Projects");
  expect(html).toContain("data-nav=\"dashboard.projects\"");
  expect(html).not.toContain("data-hydrated");
});
