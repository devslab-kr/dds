import { Toast as ArkToast, Toaster, createToaster } from "@ark-ui/solid/toast";
import { space } from "@devslab/dds-tokens";
import { createContext, createUniqueId, onCleanup, useContext, type JSX } from "solid-js";
import { classes } from "./utils";

export type ToastTone = "success" | "warning" | "danger" | "info" | "loading";
export interface ToastAction { label: string; onClick: () => void }
export interface ToastInput { message: JSX.Element; tone?: ToastTone | undefined; duration?: number | undefined; action?: ToastAction | null | undefined }
export type ToastUpdate = Partial<ToastInput>;
export type ToastLoadingInput = Omit<ToastInput, "tone" | "duration">;
export interface ToastPromiseOptions<T> {
  loading: ToastLoadingInput;
  success: ToastInput | ((value: T) => ToastInput);
  error: ToastInput | ((error: unknown) => ToastInput);
}
export type ToastPromise<T> = Promise<T> & { readonly id: string };
export interface ToastRecord extends ToastInput { id: string }
export interface ToastApi {
  show: (toast: ToastInput) => string;
  loading: (toast: ToastLoadingInput) => string;
  update: (id: string, patch: ToastUpdate) => void;
  promise: <T>(operation: Promise<T> | (() => Promise<T>), options: ToastPromiseOptions<T>) => ToastPromise<T>;
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
  let disposed = false;
  // Record identity is also the pending promise's display token. A manual
  // update replaces it, while removal discards it before Ark can notify us.
  const records = new Map<string, ToastRecord>();
  const current = (record: ToastRecord) => !disposed && records.get(record.id) === record && toaster.isVisible(record.id);
  const remove = (id: string) => {
    records.delete(id);
    toaster.remove(id);
  };
  const optionsFor = (record: ToastRecord) => {
    const duration = record.duration ?? props.defaultDuration ?? 5000;
    return {
      id: record.id, description: record.message,
      type: record.tone === "danger" ? "error" : record.tone ?? "info",
      duration: record.tone === "loading" || duration <= 0 ? Infinity : duration,
      meta: { dds: record },
      action: record.action ? {
        label: record.action.label,
        onClick: () => {
          if (!current(record)) return;
          remove(record.id);
          record.action?.onClick();
        },
      } : undefined,
      onStatusChange: ({ status }: { status: string }) => {
        if (status !== "visible" && records.get(record.id) === record) records.delete(record.id);
      },
    };
  };
  const replace = (record: ToastRecord, input: ToastInput) => {
    if (!current(record)) return;
    const next = { ...input, id: record.id };
    records.set(record.id, next);
    toaster.update(record.id, optionsFor(next));
  };
  const show = (input: ToastInput) => {
    const id = `dds-toast-${prefix}-${++sequence}`;
    if (!disposed) {
      const record = { ...input, id };
      records.set(id, record);
      toaster.create(optionsFor(record));
    }
    return id;
  };
  const api: ToastApi = {
    show,
    loading: input => show({ ...input, tone: "loading" }),
    update(id, patch) {
      const record = records.get(id);
      if (record) replace(record, { ...record, ...patch });
    },
    promise<T>(operation: Promise<T> | (() => Promise<T>), options: ToastPromiseOptions<T>): ToastPromise<T> {
      const id = api.loading(options.loading);
      const record = records.get(id);
      const settle = <T,>(terminal: ToastInput | ((value: T) => ToastInput), value: T, tone: "success" | "danger") => {
        if (!record || !current(record)) return;
        try {
          const input = typeof terminal === "function" ? terminal(value) : terminal;
          // A message factory may itself dismiss or manually update this toast.
          replace(record, { ...record, ...input, tone: input.tone ?? tone });
        } catch {
          if (current(record)) remove(id);
        }
      };
      const result = Promise.resolve().then(() => typeof operation === "function" ? operation() : operation).then(
        value => { settle(options.success, value, "success"); return value; },
        error => { settle(options.error, error, "danger"); throw error; },
      );
      return Object.defineProperty(result, "id", { value: id, enumerable: true }) as ToastPromise<T>;
    },
    dismiss: id => { if (!disposed) remove(id); },
    clear: () => { records.clear(); toaster.remove(); },
  };
  onCleanup(() => { disposed = true; api.clear(); });
  return <ToastContext.Provider value={api}>
    {props.children}
    <Toaster toaster={toaster} ref={region} getRootNode={getRootNode} id={`dds-toast-region-${prefix}`}
      class={classes("dds-toast-region", props.class)}
      role={props.regionLabel ? "region" : "presentation"} aria-label={props.regionLabel ?? ""}
    >{(toast) => {
      const record = () => toast().meta?.dds as ToastRecord;
      return <ArkToast.Root
        class={classes("dds-toast", `dds-toast--${record().tone ?? "info"}`, record().action && "dds-toast--action")}
        role={record().tone === "danger" ? "alert" : "status"}
      >
        {record().tone === "loading" && <span class="dds-spinner" aria-hidden="true" />}
        <ArkToast.Description>{toast().description}</ArkToast.Description>
        {record().action && <ArkToast.ActionTrigger class="dds-btn dds-btn--secondary dds-btn--sm dds-toast__action" type="button">{record().action?.label}</ArkToast.ActionTrigger>}
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
