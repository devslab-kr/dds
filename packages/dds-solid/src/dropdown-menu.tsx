import {
  createContext,
  useContext,
  onMount,
  onCleanup,
  splitProps,
  createEffect,
  createSignal,
  Show,
  type ComponentProps,
} from "solid-js";
import { Portal } from "solid-js/web";
import {
  Menu as ArkMenu,
  useMenu,
  useMenuContext,
  type UseMenuReturn,
} from "@ark-ui/solid/menu";
export interface DropdownMenuProps
  extends Omit<
    ComponentProps<typeof ArkMenu.Root>,
    "onOpenChange" | "onSelect"
  > {
  onOpenChange?: (open: boolean) => void;
  onSelect?: (value: string) => void;
  dir?: "ltr" | "rtl";
}
export interface DropdownMenuContentProps
  extends ComponentProps<typeof ArkMenu.Content> {
  portal?: boolean;
  portalMount?: HTMLElement;
}
const MenuTree = createContext<UseMenuReturn>();
function Root(props: DropdownMenuProps) {
  const parent = useContext(MenuTree);
  const [local, rest] = splitProps(props, [
    "onOpenChange",
    "onSelect",
    "positioning",
    "children",
    "lazyMount",
    "unmountOnExit",
  ]);
  const menu = useMenu(() => ({
    ...rest,
    positioning: { strategy: "fixed" as const, ...local.positioning },
    onOpenChange: (event: { open: boolean }) =>
      local.onOpenChange?.(event.open),
    onSelect: (event: { value: string }) => local.onSelect?.(event.value),
  }));
  let active = true;
  onCleanup(() => {
    active = false;
  });
  onMount(() =>
    queueMicrotask(() => {
      if (!active || !parent) return;
      parent.api().setChild(menu.service);
      menu.api().setParent(parent.service);
    }),
  );
  return (
    <MenuTree.Provider value={menu}>
      <ArkMenu.RootProvider
        {...props}
        value={menu}
        lazyMount={local.lazyMount ?? false}
        unmountOnExit={local.unmountOnExit ?? false}
      >
        {local.children}
      </ArkMenu.RootProvider>
    </MenuTree.Provider>
  );
}
function Content(props: DropdownMenuContentProps) {
  const [local, rest] = splitProps(props, [
    "portal",
    "portalMount",
    "class",
    "children",
  ]);
  const api = useMenuContext();
  const [mount, setMount] = createSignal<HTMLElement>();
  createEffect(() => {
    if (typeof document === "undefined") return;
    const triggerId = api().getTriggerProps().id;
    const trigger = triggerId ? document.getElementById(triggerId) : null;
    // Keep nested overlays inside the modal isolation subtree.
    setMount(
      local.portalMount ??
        trigger?.closest<HTMLElement>(
          '[role="dialog"], [role="alertdialog"]',
        ) ??
        document.body,
    );
  });
  const content = (
    <ArkMenu.Positioner class="dds-menu-positioner">
      <ArkMenu.Content
        {...rest}
        class={["dds-menu", local.class].filter(Boolean).join(" ")}
      >
        {local.children}
      </ArkMenu.Content>
    </ArkMenu.Positioner>
  );
  return local.portal === false ? (
    content
  ) : (
    <Show when={mount()}>
      {(target) => <Portal mount={target()}>{content}</Portal>}
    </Show>
  );
}
export const DropdownMenu = {
  Root,
  Trigger: ArkMenu.Trigger,
  Content,
  Item: ArkMenu.Item,
  Group: ArkMenu.ItemGroup,
  Label: ArkMenu.ItemGroupLabel,
  Separator: ArkMenu.Separator,
  CheckboxItem: ArkMenu.CheckboxItem,
  RadioGroup: ArkMenu.RadioItemGroup,
  RadioItem: ArkMenu.RadioItem,
  ItemText: ArkMenu.ItemText,
  ItemIndicator: ArkMenu.ItemIndicator,
  Submenu: Root,
  SubmenuTrigger: ArkMenu.TriggerItem,
};
