import {
  createContext,
  createUniqueId,
  onCleanup,
  onMount,
  splitProps,
  useContext,
  type Accessor,
  type JSX,
  type ParentProps,
} from "solid-js";

import { createControllableSignal } from "./controllable";
import { classes } from "./utils";

interface RegisteredTab { value: string; element: HTMLButtonElement; disabled: boolean }
interface TabsContextValue {
  value: Accessor<string>;
  setValue: (value: string) => void;
  orientation: "horizontal" | "vertical";
  register: (tab: RegisteredTab) => () => void;
  tabs: () => RegisteredTab[];
  tabId: (value: string) => string;
  panelId: (value: string) => string;
}

const TabsContext = createContext<TabsContextValue>();
const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tab components must be rendered inside <Tabs>");
  return context;
};

export interface TabsProps {
  value?: string;
  defaultValue: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  children: JSX.Element;
  id?: string;
}

export function Tabs(props: TabsProps) {
  const generated = createUniqueId();
  const id = () => props.id ?? `dds-tabs-${generated}`;
  const [value, setValue] = createControllableSignal({
    value: () => props.value,
    defaultValue: props.defaultValue,
    onChange: props.onValueChange,
  });
  const registered: RegisteredTab[] = [];
  const context: TabsContextValue = {
    value,
    setValue,
    orientation: props.orientation ?? "horizontal",
    register(tab) {
      registered.push(tab);
      return () => {
        const index = registered.indexOf(tab);
        if (index >= 0) registered.splice(index, 1);
      };
    },
    tabs: () => registered,
    tabId: (tabValue) => `${id()}-tab-${tabValue}`,
    panelId: (tabValue) => `${id()}-panel-${tabValue}`,
  };
  return <TabsContext.Provider value={context}>{props.children}</TabsContext.Provider>;
}

export function TabList(props: ParentProps<JSX.HTMLAttributes<HTMLDivElement>>) {
  const context = useTabs();
  const [local, rest] = splitProps(props, ["class", "children", "onKeyDown"]);
  const onKeyDown: JSX.EventHandler<HTMLDivElement, KeyboardEvent> = (event) => {
    if (typeof local.onKeyDown === "function") local.onKeyDown(event);
    if (event.defaultPrevented) return;
    const tabs = context.tabs().filter((tab) => !tab.disabled);
    if (!tabs.length) return;
    const current = tabs.findIndex((tab) => tab.element === document.activeElement);
    let next = current;
    const rtl = document.documentElement.dir === "rtl";
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else if (event.key === "ArrowRight" && context.orientation === "horizontal") next = (current + (rtl ? -1 : 1) + tabs.length) % tabs.length;
    else if (event.key === "ArrowLeft" && context.orientation === "horizontal") next = (current + (rtl ? 1 : -1) + tabs.length) % tabs.length;
    else if (event.key === "ArrowDown" && context.orientation === "vertical") next = (current + 1) % tabs.length;
    else if (event.key === "ArrowUp" && context.orientation === "vertical") next = (current - 1 + tabs.length) % tabs.length;
    else return;
    event.preventDefault();
    const target = tabs[next];
    if (target) {
      target.element.focus();
      context.setValue(target.value);
    }
  };
  return <div {...rest} class={classes("dds-tabs", local.class)} role="tablist" aria-orientation={context.orientation} onKeyDown={onKeyDown}>{local.children}</div>;
}

export interface TabProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "value" | "class"> {
  value: string;
  class?: string;
}

export function Tab(props: ParentProps<TabProps>) {
  const context = useTabs();
  const [local, rest] = splitProps(props, ["value", "class", "children", "disabled", "onClick"]);
  let element!: HTMLButtonElement;
  onMount(() => {
    const unregister = context.register({ value: local.value, element, disabled: Boolean(local.disabled) });
    onCleanup(unregister);
  });
  return (
    <button
      {...rest}
      ref={element}
      id={context.tabId(local.value)}
      type="button"
      role="tab"
      class={classes("dds-tab", local.class)}
      aria-selected={context.value() === local.value}
      aria-controls={context.panelId(local.value)}
      tabindex={context.value() === local.value ? 0 : -1}
      disabled={local.disabled}
      onClick={(event) => {
        if (typeof local.onClick === "function") local.onClick(event);
        if (!event.defaultPrevented) context.setValue(local.value);
      }}
    >{local.children}</button>
  );
}

export interface TabPanelProps extends JSX.HTMLAttributes<HTMLDivElement> { value: string }

export function TabPanel(props: ParentProps<TabPanelProps>) {
  const context = useTabs();
  const [local, rest] = splitProps(props, ["value", "class", "children"]);
  return (
    <div
      {...rest}
      id={context.panelId(local.value)}
      role="tabpanel"
      class={local.class}
      aria-labelledby={context.tabId(local.value)}
      hidden={context.value() !== local.value}
      tabindex="0"
    >{local.children}</div>
  );
}
