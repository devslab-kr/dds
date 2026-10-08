import { Dialog as ArkDialog, useDialog } from "@ark-ui/solid/dialog";
import { FocusTrap } from "@zag-js/focus-trap";
import { ariaHidden } from "@zag-js/aria-hidden";
import { createEffect, createMemo, createSignal, createUniqueId, onCleanup, Show, type JSX } from "solid-js";
import { isServer, Portal } from "solid-js/web";
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
  role?: "dialog" | "alertdialog";
  portal?: boolean;
  portalMount?: HTMLElement;
  unstyled?: boolean;
  overlayClass?: string;
  titleClass?: string;
  descriptionClass?: string;
  actionsClass?: string;
  contentProps?: Omit<JSX.HTMLAttributes<HTMLDivElement>, "children" | "class" | "id" | "role" | "ref">;
  initialFocus?: () => HTMLElement | null | undefined;
  finalFocus?: () => HTMLElement | null | undefined;
  restoreFocus?: boolean;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  /** Authorized external regions join both the Tab cycle and modal accessibility scope. */
  additionalFocusContainers?: () => readonly (HTMLElement | null | undefined)[];
  /** Customize the inner layout using DDS-owned, already labelled title/description nodes. */
  frame?: (parts: DialogFrameParts) => JSX.Element;
}

export interface DialogFrameParts {
  title: JSX.Element;
  description: JSX.Element;
  children: JSX.Element;
  actions: JSX.Element;
}

export function Dialog(props: DialogProps) {
  const generated = createUniqueId();
  const id = () => props.id ?? `dds-dialog-${generated}`;
  const [panel, setPanel] = createSignal<HTMLDivElement>();
  const api = useDialog(() => ({
    id: id(), open: props.open, defaultOpen: props.defaultOpen,
    onOpenChange: (details) => props.onOpenChange?.(details.open),
    closeOnEscape: props.closeOnEscape ?? true,
    closeOnInteractOutside: props.closeOnOutside ?? true,
    onEscapeKeyDown: props.onEscapeKeyDown,
    initialFocusEl: () => props.initialFocus?.() ?? null,
    finalFocusEl: () => props.finalFocus?.() ?? null,
    restoreFocus: props.restoreFocus ?? true,
    // Ark handles ordinary dialogs. A multi-container modal needs a shared
    // Zag trap and isolation target list instead of Ark's single content node.
    modal: !props.additionalFocusContainers,
    trapFocus: !props.additionalFocusContainers,
    preventScroll: true,
    role: props.role ?? "dialog",
    persistentElements: isServer ? [] : props.additionalFocusContainers?.().filter((element): element is HTMLElement => Boolean(element)).map(element => () => element),
    ids: { content: id(), title: `${id()}-title`, description: `${id()}-description` },
  }));
  const open = createMemo(() => api().open);
  createEffect(() => {
    const content = panel();
    if (!open() || !props.additionalFocusContainers || !content) return;
    const opener = content.ownerDocument.activeElement;
    let trap: FocusTrap | undefined;
    let removeIsolation: (() => void) | undefined;
    const [ready, setReady] = createSignal(false);
    const containers = () => [content, ...props.additionalFocusContainers!().filter((element): element is HTMLElement => Boolean(element?.isConnected && element.ownerDocument === content.ownerDocument))];
    const frame = content.ownerDocument.defaultView!.requestAnimationFrame(() => {
      trap = new FocusTrap(containers(), {
        document: content.ownerDocument,
        escapeDeactivates: false, allowOutsideClick: true, preventScroll: true,
        delayInitialFocus: false, fallbackFocus: content, getShadowRoot: true,
        initialFocus: () => props.initialFocus?.() ?? undefined,
        setReturnFocus: () => props.finalFocus?.() ?? (opener instanceof HTMLElement && opener.isConnected ? opener : false),
      });
      setReady(true);
      trap.activate();
    });
    createEffect(() => {
      if (!ready()) return;
      const targets = containers();
      trap!.updateContainerElements(targets);
      removeIsolation?.();
      removeIsolation = ariaHidden(targets, { defer: false });
    });
    onCleanup(() => {
      content.ownerDocument.defaultView!.cancelAnimationFrame(frame);
      removeIsolation?.();
      trap?.deactivate({ returnFocus: props.restoreFocus !== false });
    });
  });
  const cls = (base: string, extra?: string) => classes(props.unstyled ? undefined : base, extra);
  const Content = () => <ArkDialog.Positioner class={cls("dds-dialog-overlay", props.overlayClass)}>
    <ArkDialog.Content {...props.contentProps} ref={setPanel} class={cls("dds-dialog", props.class)}
      role={props.role ?? "dialog"} aria-modal="true" aria-describedby={props.description ? `${id()}-description` : undefined}>
      {(() => {
        const parts: DialogFrameParts = {
          get title() { return <ArkDialog.Title class={cls("dds-dialog__title", props.titleClass)}>{props.title}</ArkDialog.Title>; },
          get description() { return props.description && <ArkDialog.Description class={cls("dds-dialog__body", props.descriptionClass)}>{props.description}</ArkDialog.Description>; },
          get children() { return props.children; },
          get actions() { return props.actions && <div class={cls("dds-dialog__actions", props.actionsClass)}>{props.actions}</div>; },
        };
        return props.frame ? props.frame(parts) : <>{parts.title}{parts.description}{parts.children}{parts.actions}</>;
      })()}
    </ArkDialog.Content>
  </ArkDialog.Positioner>;
  return <ArkDialog.RootProvider value={api} lazyMount unmountOnExit>
    <Show when={props.portal} fallback={<Content />}><Portal {...(props.portalMount ? { mount: props.portalMount } : {})}><Content /></Portal></Show>
  </ArkDialog.RootProvider>;
}
