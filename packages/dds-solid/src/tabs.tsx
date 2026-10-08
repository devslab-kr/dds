import { Tabs as ArkTabs } from "@ark-ui/solid/tabs";
import { LocaleProvider } from "@ark-ui/solid/locale";
import { createUniqueId, splitProps, type JSX, type ParentProps } from "solid-js";
import { classes } from "./utils";
import { useDirection, type Direction } from "./direction";

export interface TabsProps {
  value?: string;
  defaultValue: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  children: JSX.Element;
  id?: string;
  dir?: Direction;
}

export function Tabs(props: TabsProps) {
  const generated = createUniqueId();
  const id = () => props.id ?? `dds-tabs-${generated}`;
  let root: HTMLDivElement | undefined;
  const direction = useDirection(() => root, () => props.dir);
  return <LocaleProvider locale={direction() === "rtl" ? "ar" : "en"}><ArkTabs.Root ref={root}
    id={id()} value={props.value} defaultValue={props.defaultValue}
    orientation={props.orientation ?? "horizontal"} activationMode="automatic"
    onValueChange={(details) => props.onValueChange?.(details.value)}
    lazyMount={false} unmountOnExit={false} class="dds-tabs-root"
    ids={{ trigger: (value) => `${id()}-tab-${value}`, content: (value) => `${id()}-panel-${value}` }}
  >{props.children}</ArkTabs.Root></LocaleProvider>;
}

export function TabList(props: ParentProps<JSX.HTMLAttributes<HTMLDivElement>>) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return <ArkTabs.List {...rest} class={classes("dds-tabs", local.class)}>{local.children}</ArkTabs.List>;
}

export interface TabProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "value" | "class"> {
  value: string;
  class?: string;
}

export function Tab(props: ParentProps<TabProps>) {
  const [local, rest] = splitProps(props, ["class", "children", "value"]);
  return <ArkTabs.Trigger {...rest} value={local.value} class={classes("dds-tab", local.class)}>{local.children}</ArkTabs.Trigger>;
}

export interface TabPanelProps extends JSX.HTMLAttributes<HTMLDivElement> { value: string }

export function TabPanel(props: ParentProps<TabPanelProps>) {
  const [local, rest] = splitProps(props, ["value", "children"]);
  return <ArkTabs.Content {...rest} value={local.value}>{local.children}</ArkTabs.Content>;
}
