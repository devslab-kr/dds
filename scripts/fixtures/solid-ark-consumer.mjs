import { createComponent, createSignal, mergeProps } from "solid-js";
import { Button, Checkbox, Dialog, Field, RadioGroup, Select, Switch, Tabs, TabList, Tab, TabPanel, ToastProvider, Tooltip } from "@devslab/dds-solid";

export const events = [];

export function App() {
  const [open, setOpen] = createSignal(false);
  return createComponent(ToastProvider, {
    dismissLabel: "Close notice", defaultDuration: 0,
    get children() { return [
      createComponent(Field, { label: "Country", children: (control) => createComponent(Select, mergeProps(control, {
        name: "country",
      })) }),
      createComponent(Checkbox, { label: "Agree", name: "agree", defaultChecked: true, onCheckedChange: value => events.push(["checked", value]) }),
      createComponent(Switch, { label: "Enabled", name: "enabled" }),
      createComponent(RadioGroup, { label: "Choice", name: "choice", defaultValue: "a", options: [{ value: "a", label: "A" }, { value: "b", label: "B" }] }),
      createComponent(Tabs, { defaultValue: "one", onValueChange: value => events.push(["tab", value]), get children() { return [
        createComponent(TabList, { get children() { return [createComponent(Tab, { value: "one", children: "One" }), createComponent(Tab, { value: "two", children: "Two" })]; } }),
        createComponent(TabPanel, { value: "one", children: "First" }),
        createComponent(TabPanel, { value: "two", children: "Second" }),
      ]; } }),
      createComponent(Tooltip, { content: "Help", children: trigger => createComponent(Button, mergeProps(trigger, { children: "Help trigger" })) }),
      createComponent(Button, { children: "Open confirmation", onClick: () => setOpen(true) }),
      createComponent(Dialog, { get open() { return open(); }, onOpenChange: setOpen, title: "Confirmation", get children() { return createComponent(Button, { children: "Close confirmation", onClick: () => setOpen(false) }); } }),
    ]; },
  });
}
