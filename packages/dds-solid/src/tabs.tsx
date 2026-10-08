import { Tabs as ArkTabs, useTabsContext } from "@ark-ui/solid/tabs";
import { LocaleProvider } from "@ark-ui/solid/locale";
import { createUniqueId, mergeProps, splitProps, type JSX, type ParentProps } from "solid-js";
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
  activationMode?: "automatic" | "manual";
  tabId?: (value: string) => string;
  panelId?: (value: string) => string;
  unstyled?: boolean;
  asChild?: (props: JSX.HTMLAttributes<HTMLDivElement>) => JSX.Element;
}

export function Tabs(props: TabsProps) {
  const generated = createUniqueId();
  const id = () => props.id ?? `dds-tabs-${generated}`;
  let root: HTMLDivElement | undefined;
  const direction = useDirection(() => root, () => props.dir);
  const child = props.asChild ? (merge: unknown) => props.asChild!(mergeProps(
    (merge as (props: JSX.HTMLAttributes<HTMLDivElement>) => JSX.HTMLAttributes<HTMLDivElement>)({}),
    { ref: (element: HTMLDivElement) => { root = element; } },
  )) : undefined;
  return <LocaleProvider locale={direction() === "rtl" ? "ar" : "en"}><ArkTabs.Root ref={root}
    id={id()} value={props.value} defaultValue={props.defaultValue}
    orientation={props.orientation ?? "horizontal"} activationMode={props.activationMode ?? "automatic"}
    onValueChange={(details) => props.onValueChange?.(details.value)}
    lazyMount={false} unmountOnExit={false} class={props.unstyled ? undefined : "dds-tabs-root"}
    {...(child ? { asChild: child } : {})}
    ids={{ trigger: (value) => props.tabId?.(value) ?? `${id()}-tab-${value}`, content: (value) => props.panelId?.(value) ?? `${id()}-panel-${value}` }}
  >{props.children}</ArkTabs.Root></LocaleProvider>;
}

export function TabList(props: ParentProps<JSX.HTMLAttributes<HTMLDivElement> & { unstyled?: boolean }>) {
  const [local, rest] = splitProps(props, ["class", "children", "unstyled"]);
  return <ArkTabs.List {...rest} class={classes(!local.unstyled && "dds-tabs", local.class)}>{local.children}</ArkTabs.List>;
}

export interface TabProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "value" | "class"> {
  value: string;
  class?: string;
  unstyled?: boolean;
  asChild?: (props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => JSX.Element;
}

export function Tab(props: ParentProps<TabProps>) {
  const [local, rest] = splitProps(props, ["class", "children", "value", "unstyled", "asChild"]);
  // Ark's factory supplies a merger; DDS exposes native button attributes.
  const child = local.asChild ? (merge: unknown) => local.asChild!(mergeProps(
    (merge as (props: JSX.ButtonHTMLAttributes<HTMLButtonElement>) => JSX.ButtonHTMLAttributes<HTMLButtonElement>)({}),
    { ref: props.ref },
  )) : undefined;
  return <ArkTabs.Trigger {...rest} value={local.value} class={classes(!local.unstyled && "dds-tab", local.class)} {...(child ? { asChild: child } : {})}>{local.children}</ArkTabs.Trigger>;
}

export interface TabPanelProps extends JSX.HTMLAttributes<HTMLDivElement> { value: string }

export function TabPanel(props: ParentProps<TabPanelProps>) {
  const [local, rest] = splitProps(props, ["value", "children", "style"]);
  const tabs = useTabsContext();
  const inactive = () => tabs().value !== local.value;
  const style = () => !inactive() ? local.style : typeof local.style === "string"
    ? `${local.style.replace(/;+\s*$/, "")};display:none;`
    : { ...local.style, display: "none" };
  return <ArkTabs.Content {...rest} value={local.value} style={style()} hidden={inactive()} inert={inactive()}>{local.children}</ArkTabs.Content>;
}
