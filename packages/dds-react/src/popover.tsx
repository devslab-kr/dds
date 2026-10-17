import { forwardRef, useEffect, useState, type ComponentProps } from "react";
import {
  Popover as ArkPopover,
  usePopoverContext,
} from "@ark-ui/react/popover";
import { Portal } from "@ark-ui/react/portal";
export interface PopoverProps
  extends Omit<ComponentProps<typeof ArkPopover.Root>, "onOpenChange"> {
  onOpenChange?: (open: boolean) => void;
}
export interface PopoverContentProps
  extends ComponentProps<typeof ArkPopover.Content> {
  portal?: boolean;
  portalMount?: HTMLElement;
}
function Root({
  onOpenChange,
  modal = false,
  positioning,
  ...props
}: PopoverProps) {
  return (
    <ArkPopover.Root
      {...props}
      positioning={{ strategy: "fixed", ...positioning }}
      modal={modal}
      onOpenChange={(event) => onOpenChange?.(event.open)}
    />
  );
}
const Content = forwardRef<HTMLDivElement, PopoverContentProps>(
  function Content(
    { portal = true, portalMount, className, children, ...props },
    ref,
  ) {
    const api = usePopoverContext();
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
      <ArkPopover.Positioner className="dds-popover-positioner">
        <ArkPopover.Content
          {...props}
          aria-labelledby={
            props["aria-labelledby"] ??
            (props["aria-label"] ? undefined : api.getTitleProps().id)
          }
          ref={ref}
          className={["dds-popover", className].filter(Boolean).join(" ")}
        >
          {children}
        </ArkPopover.Content>
      </ArkPopover.Positioner>
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
export const Popover = {
  Root,
  Trigger: ArkPopover.Trigger,
  Content,
  Title: ArkPopover.Title,
  Description: ArkPopover.Description,
  CloseTrigger: ArkPopover.CloseTrigger,
  Anchor: ArkPopover.Anchor,
};
