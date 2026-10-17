import { renderToString } from "solid-js/web";
import { expect, it } from "vitest";
import { Input, InputGroup } from "../input";
import { Combobox } from "../combobox";
import { SelectPicker } from "../select-picker";
import { Calendar } from "../calendar";
import { DropdownMenu } from "../dropdown-menu";
import { Popover } from "../popover";

import {
  DatePicker,
  Button,
  Checkbox,
  ConsoleShell,
  Dialog,
  Field,
  Icon,
  IconButton,
  Radio,
  RadioGroup,
  Select,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  ToastProvider,
  Tooltip,
} from "../index";
it("server-renders general inputs, choices and inline calendars without browser globals", () => {
  const items = [{ value: "customer-1", label: "Customer One" }];
  const html = renderToString(() => (
    <>
      <InputGroup>
        <Input
          type="email"
          label="Email"
          labelPlacement="inside"
          defaultValue="one@example.test"
          clearable
        />
      </InputGroup>
      <Combobox
        label="Customer"
        items={items}
        defaultValue="customer-1"
        name="customer"
        virtualization={{}}
      />
      <SelectPicker label="Category" items={items} />
      <Calendar
        label="Booking calendar"
        value="2026-10-17"
        onChange={() => {}}
      />
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>Actions</DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item value="edit">Edit</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <Popover.Root>
        <Popover.Trigger>Filters</Popover.Trigger>
        <Popover.Content>
          <Popover.Title>Filters</Popover.Title>
        </Popover.Content>
      </Popover.Root>
    </>
  ));
  expect(html).toContain("one@example.test");
  expect(html).toContain("customer-1");
  expect(html).toContain("Booking calendar");
  expect(html).toContain("Actions");
});

const AllPrimitives = () => (
  <div>
    <Button>Hydrate</Button>
    <DatePicker label="날짜" value="2026-10-12" onChange={() => {}} />
    <IconButton aria-label="Complete">
      <Icon name="check" />
    </IconButton>
    <Field label="Country">
      {(control) => (
        <Select {...control}>
          <option>Korea</option>
        </Select>
      )}
    </Field>
    <Checkbox label="Check" defaultChecked />
    <Radio label="Radio" name="ssr-radio" />
    <RadioGroup
      label="Choice"
      name="ssr-choice"
      defaultValue="a"
      options={[{ value: "a", label: "A" }]}
    />
    <Switch label="Switch" />
    <Dialog defaultOpen title="Dialog">
      <button>Action</button>
    </Dialog>
    <Tabs defaultValue="one">
      <TabList>
        <Tab value="one">One</Tab>
      </TabList>
      <TabPanel value="one">Panel</TabPanel>
    </Tabs>
    <Tooltip content="Tip" defaultOpen>
      {(trigger) => <button {...trigger}>Trigger</button>}
    </Tooltip>
    <ToastProvider dismissLabel="Close">
      <span>Toast host</span>
    </ToastProvider>
  </div>
);

it("server-renders every public primitive", () => {
  const html = renderToString(() => <AllPrimitives />);
  expect(html).toContain("Hydrate");
  expect(html).toContain('aria-label="Complete"');
});

it("does not evaluate browser-only focus targets or additional dialog containers during SSR", () => {
  const browserOnly = () => {
    throw new Error("Browser-only focus getter ran on the server");
  };
  const html = renderToString(() => (
    <Dialog
      defaultOpen
      title="Scoped SSR"
      additionalFocusContainers={browserOnly}
      initialFocus={browserOnly}
      finalFocus={browserOnly}
    >
      <button>SSR action</button>
    </Dialog>
  ));
  expect(html).toContain("Scoped SSR");
});

it("server-renders a requested native section dialog with DDS labels", () => {
  const native = { contentAs: "section" as const };
  const html = renderToString(() => (
    <Dialog {...native} defaultOpen id="native-section" title="Section dialog">
      <button>Action</button>
    </Dialog>
  ));
  expect(html).toMatch(/<section[^>]*role="dialog"[^>]*id="native-section"/);
  expect(html).toContain('aria-labelledby="native-section-title"');
});

it("server-renders ConsoleShell without the client-only hydration claim", () => {
  const nav = [
    {
      label: "Build",
      items: [
        { id: "projects", href: "/dashboard/projects", label: "Projects" },
      ],
    },
  ];
  const labels = {
    skip: "Skip to content",
    menuOpen: "Open menu",
    menuClose: "Close menu",
    nav: "Dashboard navigation",
    badge: "{count} pending",
  };
  const html = renderToString(() => (
    <ConsoleShell
      surface="dashboard"
      activePath="/dashboard/projects"
      brand={{
        href: "/dashboard",
        name: "VisionLinq",
        mark: "/brand/mark.svg",
      }}
      nav={nav}
      labels={labels}
      header={{ title: "Projects" }}
    >
      <p>body</p>
    </ConsoleShell>
  ));
  expect(html).toContain("Projects");
  expect(html).toContain('data-nav="dashboard.projects"');
  expect(html).not.toContain("data-hydrated");
});
