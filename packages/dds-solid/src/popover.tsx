import {
  splitProps,
  createEffect,
  createSignal,
  Show,
  type ComponentProps,
} from "solid-js";
import { Portal } from "solid-js/web";
import {
  Popover as ArkPopover,
  usePopoverContext,
} from "@ark-ui/solid/popover";
export interface PopoverProps
  extends Omit<ComponentProps<typeof ArkPopover.Root>, "onOpenChange"> {
  onOpenChange?: (open: boolean) => void;
}
export interface PopoverContentProps
  extends ComponentProps<typeof ArkPopover.Content> {
  portal?: boolean;
  portalMount?: HTMLElement;
}
function Root(props: PopoverProps) {
  const [local, rest] = splitProps(props, [
    "onOpenChange",
    "modal",
    "positioning",
  ]);
  return (
    <ArkPopover.Root
      {...rest}
      positioning={{ strategy: "fixed", ...local.positioning }}
      modal={local.modal ?? false}
      onOpenChange={(event) => local.onOpenChange?.(event.open)}
    />
  );
}
function Content(props: PopoverContentProps) {
  const [local, rest] = splitProps(props, [
    "portal",
    "portalMount",
    "class",
    "children",
  ]);
  const api = usePopoverContext();
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
    <ArkPopover.Positioner class="dds-popover-positioner">
      <ArkPopover.Content
        {...rest}
        aria-labelledby={
          rest["aria-labelledby"] ??
          (rest["aria-label"] ? undefined : api().getTitleProps().id)
        }
        class={["dds-popover", local.class].filter(Boolean).join(" ")}
      >
        {local.children}
      </ArkPopover.Content>
    </ArkPopover.Positioner>
  );
  return local.portal === false ? (
    content
  ) : (
    <Show when={mount()}>
      {(target) => <Portal mount={target()}>{content}</Portal>}
    </Show>
  );
}
export const Popover = {
  Root,
  Trigger: ArkPopover.Trigger,
  Content,
  Title: ArkPopover.Title,
  Description: ArkPopover.Description,
  CloseTrigger: ArkPopover.CloseTrigger,
  Anchor: ArkPopover.Anchor,
};
