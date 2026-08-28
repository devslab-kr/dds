import {
  Show,
  createEffect,
  createUniqueId,
  onCleanup,
  type JSX,
} from "solid-js";

import { createControllableSignal } from "./controllable";
import { classes, describedBy } from "./utils";

export const focusable = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
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
  const titleId = () => `${id()}-title`;
  const descriptionId = () => props.description ? `${id()}-description` : undefined;
  const [open, setOpen] = createControllableSignal({
    value: () => props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  });
  let panel: HTMLDivElement | undefined;
  let previouslyFocused: HTMLElement | null = null;

  createEffect(() => {
    if (!open()) return;
    previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    queueMicrotask(() => {
      const first = panel?.querySelector<HTMLElement>(focusable);
      (first ?? panel)?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && props.closeOnEscape !== false) {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const candidates = [...panel.querySelectorAll<HTMLElement>(focusable)]
        .filter((element) => !element.hidden && element.getAttribute("aria-hidden") !== "true");
      if (candidates.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = candidates[0]!;
      const last = candidates[candidates.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => {
      document.removeEventListener("keydown", onKeyDown);
      queueMicrotask(() => previouslyFocused?.focus());
    });
  });

  return (
    <Show when={open()}>
      <div
        class="dds-dialog-overlay"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget && props.closeOnOutside !== false) setOpen(false);
        }}
      >
        <div
          ref={panel}
          id={id()}
          class={classes("dds-dialog", props.class)}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId()}
          aria-describedby={describedBy(descriptionId())}
          tabindex="-1"
        >
          <h2 id={titleId()} class="dds-dialog__title">{props.title}</h2>
          {props.description && <div id={descriptionId()} class="dds-dialog__body">{props.description}</div>}
          {props.children}
          {props.actions && <div class="dds-dialog__actions">{props.actions}</div>}
        </div>
      </div>
    </Show>
  );
}
