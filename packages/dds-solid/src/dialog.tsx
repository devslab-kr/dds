import { Dialog as ArkDialog } from "@ark-ui/solid/dialog";
import { createUniqueId, type JSX } from "solid-js";
import { classes } from "./utils";

export const focusable = [
  "a[href]", "button:not([disabled])", "input:not([disabled])",
  "select:not([disabled])", "textarea:not([disabled])", "[tabindex]:not([tabindex='-1'])",
].join(",");

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: JSX.Element;
  description?: JSX.Element;
  children: JSX.Element;
  actions?: JSX.Element;
  closeOnEscape?: boolean;
  closeOnOutside?: boolean;
  class?: string;
  id?: string;
}

export function Dialog(props: DialogProps) {
  const generated = createUniqueId();
  const id = () => props.id ?? `dds-dialog-${generated}`;
  return <ArkDialog.Root
    id={id()} open={props.open} defaultOpen={props.defaultOpen}
    onOpenChange={(details) => props.onOpenChange?.(details.open)}
    closeOnEscape={props.closeOnEscape ?? true}
    closeOnInteractOutside={props.closeOnOutside ?? true}
    modal trapFocus preventScroll lazyMount unmountOnExit
    ids={{ content: id(), title: `${id()}-title`, description: `${id()}-description` }}
  >
    <ArkDialog.Positioner class="dds-dialog-overlay">
      <ArkDialog.Content class={classes("dds-dialog", props.class)} aria-describedby={props.description ? `${id()}-description` : undefined}>
        <ArkDialog.Title class="dds-dialog__title">{props.title}</ArkDialog.Title>
        {props.description && <ArkDialog.Description class="dds-dialog__body">{props.description}</ArkDialog.Description>}
        {props.children}
        {props.actions && <div class="dds-dialog__actions">{props.actions}</div>}
      </ArkDialog.Content>
    </ArkDialog.Positioner>
  </ArkDialog.Root>;
}
