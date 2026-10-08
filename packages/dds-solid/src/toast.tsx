import { Toast as ArkToast, Toaster, createToaster } from "@ark-ui/solid/toast";
import { space } from "@devslab/dds-tokens";
import { createContext, createUniqueId, onCleanup, useContext, type JSX } from "solid-js";
import { classes } from "./utils";

export type ToastTone = "success" | "warning" | "danger" | "info";
export interface ToastInput { message: JSX.Element; tone?: ToastTone; duration?: number }
export interface ToastRecord extends ToastInput { id: string }
export interface ToastApi {
  show: (toast: ToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}
const ToastContext = createContext<ToastApi>();

export interface ToastProviderProps {
  children: JSX.Element;
  defaultDuration?: number;
  dismissLabel?: string | ((toast: ToastRecord) => string);
  /** Optional localized label for the notification region. */
  regionLabel?: string;
  class?: string;
}

export function ToastProvider(props: ToastProviderProps) {
  const prefix = createUniqueId();
  let region: HTMLDivElement | undefined;
  let scopedDocument: Document | undefined;
  // Zag derives group IDs from placement rather than provider identity. Keep
  // each provider's physical ID unique, and scope that one logical lookup.
  const getRootNode = () => scopedDocument ??= new Proxy(region?.ownerDocument ?? document, {
    get(target, property) {
      if (property === "getElementById") return (id: string) => id === "toast-group:bottom-end" ? region ?? null : target.getElementById(id);
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  const toaster = createToaster({
    placement: "bottom-end", overlap: false, gap: space[8],
    // An empty array matches EVERY key in Zag. An impossible physical code
    // disables the global shortcut without stealing application focus.
    offsets: "var(--dds-space-16)", removeDelay: 0, hotkey: ["DDS_NO_HOTKEY"],
    max: Number.MAX_SAFE_INTEGER, pauseOnPageIdle: true,
  });
  let sequence = 0;
  const api: ToastApi = {
    show(input) {
      const id = `dds-toast-${prefix}-${++sequence}`;
      const duration = input.duration ?? props.defaultDuration ?? 5000;
      toaster.create({
        id, description: input.message, type: input.tone === "danger" ? "error" : input.tone ?? "info",
        duration: duration > 0 ? duration : Infinity,
        meta: { dds: { ...input, id } satisfies ToastRecord },
      });
      return id;
    },
    dismiss: (id) => toaster.remove(id),
    clear: () => toaster.remove(),
  };
  onCleanup(api.clear);
  return <ToastContext.Provider value={api}>
    {props.children}
    <Toaster toaster={toaster} ref={region} getRootNode={getRootNode} id={`dds-toast-region-${prefix}`}
      class={classes("dds-toast-region", props.class)}
      role={props.regionLabel ? "region" : "presentation"} aria-label={props.regionLabel ?? ""}
    >{(toast) => {
      const record = () => toast().meta?.dds as ToastRecord;
      return <ArkToast.Root
        class={classes("dds-toast", `dds-toast--${record().tone ?? "info"}`)}
        role={record().tone === "danger" ? "alert" : "status"}
      >
        <ArkToast.Description>{toast().description}</ArkToast.Description>
        {props.dismissLabel && <ArkToast.CloseTrigger
          class="dds-iconbtn dds-iconbtn--sm"
          aria-label={typeof props.dismissLabel === "function" ? props.dismissLabel(record()) : props.dismissLabel}
        >×</ArkToast.CloseTrigger>}
      </ArkToast.Root>;
    }}</Toaster>
  </ToastContext.Provider>;
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be called inside <ToastProvider>");
  return context;
}
