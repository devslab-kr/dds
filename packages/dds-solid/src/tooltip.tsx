import { createUniqueId, type JSX } from "solid-js";

import { createControllableSignal } from "./controllable";
import { classes } from "./utils";

export interface TooltipTriggerProps {
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
    value: () => props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  });
  const trigger: TooltipTriggerProps = {
    "aria-describedby": id(),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
    onPointerEnter: () => setOpen(true),
    onPointerLeave: () => setOpen(false),
  };
  return (
    <span class={classes("dds-tooltip", props.class)}>
      {props.children(trigger)}
      <span id={id()} class="dds-tooltip__bubble" role="tooltip" hidden={!open()}>{props.content}</span>
    </span>
  );
}
