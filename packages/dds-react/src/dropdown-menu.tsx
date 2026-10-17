import {
  createContext,
  useContext,
  forwardRef,
  useEffect,
  useState,
  type ComponentProps,
} from "react";
import {
  Menu as ArkMenu,
  useMenu,
  useMenuContext,
  type UseMenuReturn,
} from "@ark-ui/react/menu";
import { Portal } from "@ark-ui/react/portal";

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
const MenuTree = createContext<UseMenuReturn | null>(null);
function Root({
  onOpenChange,
  onSelect,
  positioning,
  children,
  ...props
}: DropdownMenuProps) {
  const parent = useContext(MenuTree);
  const options = {
    ...props,
    positioning: { strategy: "fixed" as const, ...positioning },
    onOpenChange: (event: { open: boolean }) => onOpenChange?.(event.open),
    onSelect: (event: { value: string }) => onSelect?.(event.value),
  };
  const menu = useMenu(options);
  useEffect(() => {
    // Register after every machine mount, including StrictMode's effect replay.
    // Ark's once-only registration can precede the parent's machine restart.
    let active = true;
    queueMicrotask(() => {
      if (!active || !parent) return;
      parent.api.setChild(menu.service);
      menu.api.setParent(parent.service);
    });
    return () => {
      active = false;
    };
  }, [parent?.service, menu.service]);
  return (
    <MenuTree.Provider value={menu}>
      <ArkMenu.RootProvider
        {...props}
        value={menu}
        lazyMount={props.lazyMount}
        unmountOnExit={props.unmountOnExit}
      >
        {children}
      </ArkMenu.RootProvider>
    </MenuTree.Provider>
  );
}
const Content = forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  function Content(
    { portal = true, portalMount, className, children, ...props },
    ref,
  ) {
    const api = useMenuContext();
    const triggerId = api.getTriggerProps().id;
    const [mount, setMount] = useState<HTMLElement | null>(null);
    useEffect(() => {
      // Keep nested overlays inside the modal isolation subtree.
      const trigger = triggerId ? document.getElementById(triggerId) : null;
      setMount(
        portalMount ??
          trigger?.closest<HTMLElement>(
            '[role="dialog"], [role="alertdialog"]',
          ) ??
          document.body,
      );
    }, [portalMount, triggerId]);
    const content = (
      <ArkMenu.Positioner className="dds-menu-positioner">
        <ArkMenu.Content
          {...props}
          ref={ref}
          className={["dds-menu", className].filter(Boolean).join(" ")}
        >
          {children}
        </ArkMenu.Content>
      </ArkMenu.Positioner>
    );
    return portal ? (
      mount ? (
        <Portal container={{ current: mount }}>{content}</Portal>
      ) : null
    ) : (
      content
    );
  },
);
/** Item.onSelect is an action callback; Root callbacks expose DDS scalar values. */
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
