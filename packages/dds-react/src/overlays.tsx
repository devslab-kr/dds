import {
  forwardRef,
  type ComponentProps,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { Dialog as ArkDialog } from "@ark-ui/react/dialog";
import { Tooltip as ArkTooltip } from "@ark-ui/react/tooltip";
import { Portal } from "@ark-ui/react/portal";
import { classes } from "./controls";
import { Icon } from "./icon";
export interface DialogFrameParts {
  /** The corner close button when closeLabel is set, else null. */
  close: ReactNode;
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  actions: ReactNode;
}
export interface DialogProps
  extends Omit<
    ComponentProps<typeof ArkDialog.Root>,
    "children" | "onOpenChange"
  > {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  onOpenChange?: (open: boolean) => void;
  closeOnOutside?: boolean;
  portal?: boolean;
  className?: string;
  overlayClassName?: string;
  contentProps?: ComponentProps<typeof ArkDialog.Content>;
  initialFocus?: () => HTMLElement | null | undefined;
  finalFocus?: () => HTMLElement | null | undefined;
  frame?: (parts: DialogFrameParts) => ReactNode;
  unstyled?: boolean;
  /** Accessible name of a close (X) button in the top inline-end corner. Omit for no button. */
  closeLabel?: string;
}
export const Dialog = forwardRef<HTMLDivElement, DialogProps>(function Dialog(
  {
    title,
    description,
    children,
    actions,
    onOpenChange,
    closeOnOutside,
    portal = true,
    className,
    overlayClassName,
    contentProps,
    initialFocus,
    finalFocus,
    frame,
    unstyled,
    closeLabel,
    ...rest
  },
  ref
) {
  const parts: DialogFrameParts = {
    close: closeLabel ? (
      <ArkDialog.CloseTrigger
        aria-label={closeLabel}
        className={unstyled ? undefined : "dds-iconbtn dds-iconbtn--sm dds-dialog__close"}
      >
        <Icon name="close" size={20} />
      </ArkDialog.CloseTrigger>
    ) : null,
    title: (
      <ArkDialog.Title className={unstyled ? undefined : "dds-dialog__title"}>
        {title}
      </ArkDialog.Title>
    ),
    description: description && (
      <ArkDialog.Description
        className={unstyled ? undefined : "dds-dialog__body"}
      >
        {description}
      </ArkDialog.Description>
    ),
    children,
    actions: actions && (
      <div className={unstyled ? undefined : "dds-dialog__actions"}>
        {actions}
      </div>
    ),
  };
  const content = (
    <ArkDialog.Positioner
      className={classes(!unstyled && "dds-dialog-overlay", overlayClassName)}
    >
      <ArkDialog.Content
        {...contentProps}
        ref={ref}
        aria-describedby={
          description ? contentProps?.["aria-describedby"] : undefined
        }
        className={classes(
          !unstyled && "dds-dialog",
          className,
          contentProps?.className
        )}
      >
        {frame ? (
          frame(parts)
        ) : (
          <>
            {parts.close}
            {parts.title}
            {parts.description}
            {children}
            {parts.actions}
          </>
        )}
      </ArkDialog.Content>
    </ArkDialog.Positioner>
  );
  return (
    <ArkDialog.Root
      {...rest}
      onOpenChange={(details) => onOpenChange?.(details.open)}
      closeOnInteractOutside={closeOnOutside ?? rest.closeOnInteractOutside}
      initialFocusEl={
        initialFocus ? () => initialFocus() ?? null : rest.initialFocusEl
      }
      finalFocusEl={finalFocus ? () => finalFocus() ?? null : rest.finalFocusEl}
      lazyMount
      unmountOnExit
    >
      {portal ? <Portal>{content}</Portal> : content}
    </ArkDialog.Root>
  );
});
export type TooltipTriggerProps = ButtonHTMLAttributes<HTMLButtonElement>;
export interface TooltipProps
  extends Omit<
    ComponentProps<typeof ArkTooltip.Root>,
    "children" | "onOpenChange"
  > {
  content: ReactNode;
  children: ReactNode | ((props: TooltipTriggerProps) => ReactNode);
  onOpenChange?: (open: boolean) => void;
  className?: string;
  contentProps?: ComponentProps<typeof ArkTooltip.Content>;
}
export function Tooltip({
  content,
  children,
  onOpenChange,
  className,
  contentProps,
  ...rest
}: TooltipProps) {
  return (
    <ArkTooltip.Root
      openDelay={0}
      closeDelay={0}
      {...rest}
      onOpenChange={(details) => onOpenChange?.(details.open)}
    >
      <span className={classes("dds-tooltip", className)}>
        {typeof children === "function" ? (
          <ArkTooltip.Context>
            {(api) => children(api.getTriggerProps())}
          </ArkTooltip.Context>
        ) : (
          <ArkTooltip.Trigger asChild>{children}</ArkTooltip.Trigger>
        )}
        <Portal>
          <ArkTooltip.Positioner>
            <ArkTooltip.Content
              {...contentProps}
              className={classes(
                "dds-tooltip__bubble",
                contentProps?.className
              )}
            >
              {content}
            </ArkTooltip.Content>
          </ArkTooltip.Positioner>
        </Portal>
      </span>
    </ArkTooltip.Root>
  );
}
