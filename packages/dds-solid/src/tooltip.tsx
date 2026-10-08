import { Tooltip as ArkTooltip, useTooltip } from "@ark-ui/solid/tooltip";
import { createUniqueId, splitProps, type JSX } from "solid-js";
import { classes } from "./utils";
import { createControllableSignal } from "./controllable";

/** Spread all trigger props onto the focusable trigger element. */
export interface TooltipTriggerProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "aria-describedby" | "onFocus" | "onBlur" | "onPointerEnter" | "onPointerLeave"> {
  "aria-describedby": string;
  onFocus: () => void;
  onBlur: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}

export interface TooltipProps {
  content: JSX.Element;
  children: (props: TooltipTriggerProps) => JSX.Element;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  id?: string;
  class?: string;
}

export function Tooltip(props: TooltipProps) {
  const generated = createUniqueId();
  const id = () => props.id ?? `dds-tooltip-${generated}`;
  const [open, setOpen] = createControllableSignal({
    value: () => props.open, defaultValue: props.defaultOpen ?? false,
    onChange: (next) => props.onOpenChange?.(next),
  });
  const api = useTooltip(() => ({
    id: id(), ids: { content: id() }, open: open(),
    onOpenChange: (details) => setOpen(details.open), openDelay: 0, closeDelay: 0,
  }));
  return <ArkTooltip.RootProvider value={api} lazyMount={false} unmountOnExit={false}>
    <span class={classes("dds-tooltip", props.class)}>
      <ArkTooltip.Trigger asChild={(merge) => {
        const [, attributes] = splitProps(merge(), ["onFocusIn", "onFocusOut"]);
        return props.children({
        ...attributes, "aria-describedby": id(),
        // Preserve DDS's established composable, zero-argument callbacks.
        onFocus: () => api().setOpen(true), onBlur: () => api().setOpen(false),
        onPointerEnter: () => api().setOpen(true), onPointerLeave: () => api().setOpen(false),
      }); }} />
      <ArkTooltip.Positioner>
        <ArkTooltip.Content class="dds-tooltip__bubble">{props.content}</ArkTooltip.Content>
      </ArkTooltip.Positioner>
    </span>
  </ArkTooltip.RootProvider>;
}
