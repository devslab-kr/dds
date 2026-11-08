import {
  createContext,
  useContext,
  useEffect,
  useId,
  useInsertionEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { Toast as ArkToast, Toaster, createToaster } from "@ark-ui/react/toast";
import { classes } from "./controls";
export type ToastTone = "success" | "warning" | "danger" | "info" | "loading";
export interface ToastAction {
  label: string;
  onClick: () => void;
}
export interface ToastInput {
  message: ReactNode;
  tone?: ToastTone | undefined;
  duration?: number | undefined;
  action?: ToastAction | null | undefined;
}
export type ToastUpdate = Partial<ToastInput>;
export type ToastLoadingInput = Omit<ToastInput, "tone" | "duration">;
export interface ToastPromiseOptions<T> {
  loading: ToastLoadingInput;
  success: ToastInput | ((value: T) => ToastInput);
  error: ToastInput | ((reason: unknown) => ToastInput);
}
export type ToastPromise<T> = Promise<T> & { readonly id: string };
export interface ToastRecord extends ToastInput {
  id: string;
}
export interface ToastApi {
  show: (toast: ToastInput) => string;
  loading: (toast: ToastLoadingInput) => string;
  update: (id: string, patch: ToastUpdate) => void;
  promise: <T>(
    operation: Promise<T> | (() => Promise<T>),
    options: ToastPromiseOptions<T>,
  ) => ToastPromise<T>;
  dismiss: (id: string) => void;
  clear: () => void;
}
export interface ToastProviderProps {
  children: ReactNode;
  defaultDuration?: number;
  dismissLabel?: string | ((toast: ToastRecord) => string);
  regionLabel?: string;
  className?: string;
}
const ToastContext = createContext<ToastApi | null>(null);
export function ToastProvider({
  children,
  defaultDuration = 5000,
  dismissLabel,
  regionLabel,
  className,
}: ToastProviderProps) {
  const prefix = useId();
  const sequence = useRef(0);
  const region = useRef<HTMLDivElement>(null);
  const getRootNode = useMemo(() => {
    let scopedDocument: Document | undefined;
    // Match Solid's provider-local lookup while preserving the real document's
    // native method receivers. Zag otherwise locates the first bottom-end group.
    return () =>
      (scopedDocument ??= new Proxy(region.current?.ownerDocument ?? document, {
        get(target, property) {
          if (property === "getElementById")
            return (id: string) =>
              id === "toast-group:bottom-end"
                ? region.current
                : target.getElementById(id);
          const value = Reflect.get(target, property, target);
          return typeof value === "function" ? value.bind(target) : value;
        },
      }));
  }, []);
  const toaster = useMemo(
    () =>
      createToaster({
        placement: "bottom-end",
        overlap: false,
        gap: 8,
        offsets: "var(--dds-space-16)",
        removeDelay: 0,
        hotkey: ["DDS_NO_HOTKEY"],
        max: Number.MAX_SAFE_INTEGER,
      }),
    [],
  );
  const state = useMemo(
    () => ({
      disposed: false,
      defaultDuration,
      records: new Map<string, { input: ToastRecord; revision: number }>(),
    }),
    [toaster],
  );
  // Only mutate lifecycle flags here, never the Ark store. Insertion effects
  // distinguish actual unmount from StrictMode's passive-effect replay, so
  // child effects can create notices during both setups without resurrecting
  // a genuinely disposed provider through a captured API.
  useInsertionEffect(() => {
    state.disposed = false;
    return () => {
      state.disposed = true;
    };
  }, [state]);
  useInsertionEffect(() => {
    state.defaultDuration = defaultDuration;
  }, [state, defaultDuration]);
  const api = useMemo<ToastApi>(() => {
    const current = (id: string) =>
      state.disposed ? undefined : state.records.get(id);
    const write = (
      entry: { input: ToastRecord; revision: number },
      update = false,
    ) => {
      const record = entry.input;
      const duration = record.duration ?? state.defaultDuration;
      const action = record.action;
      const options = {
        id: record.id,
        description: record.message,
        type: record.tone === "danger" ? "error" : (record.tone ?? "info"),
        duration:
          record.tone === "loading" || duration <= 0 ? Infinity : duration,
        action: action
          ? {
              label: action.label,
              onClick: () => {
                if (
                  current(record.id) !== entry ||
                  entry.input.action !== action ||
                  !toaster.isVisible(record.id)
                )
                  return;
                api.dismiss(record.id);
                action.onClick();
              },
            }
          : undefined,
        meta: { dds: record },
        onStatusChange: ({ status }: { status: string }) => {
          if (status !== "visible" && state.records.get(record.id) === entry)
            state.records.delete(record.id);
        },
      };
      if (update) toaster.update(record.id, options);
      else toaster.create(options);
    };
    const api: ToastApi = {
      show(input) {
        const id = `dds-toast-${prefix}-${++sequence.current}`;
        if (state.disposed) return id;
        const entry = { input: { ...input, id }, revision: 0 };
        state.records.set(id, entry);
        write(entry);
        return id;
      },
      loading: (input) => api.show({ ...input, tone: "loading" }),
      update(id, patch) {
        const entry = current(id);
        // Ark update is an upsert; DDS update must never recreate an old ID.
        if (!entry || !toaster.isVisible(id)) return;
        entry.input = { ...entry.input, ...patch, id };
        entry.revision++;
        write(entry, true);
      },
      promise<T>(
        operation: Promise<T> | (() => Promise<T>),
        options: ToastPromiseOptions<T>,
      ) {
        const id = api.loading(options.loading);
        const entry = current(id);
        const revision = entry?.revision;
        const owns = () =>
          !!entry &&
          current(id) === entry &&
          entry.revision === revision &&
          toaster.isVisible(id);
        const present = <T,>(
          setting: ToastInput | ((value: T) => ToastInput),
          value: T,
          tone: "success" | "danger",
        ) => {
          if (!owns()) return;
          try {
            const input =
              typeof setting === "function" ? setting(value) : setting;
            const patch = { ...input, tone: input.tone ?? tone };
            if (owns()) api.update(id, patch);
          } catch {
            // Presentation must not change the actual task's outcome.
            if (owns()) api.dismiss(id);
          }
        };
        const pending = Promise.resolve()
          .then(() =>
            typeof operation === "function" ? operation() : operation,
          )
          .then(
            (value) => {
              present(options.success, value, "success");
              return value;
            },
            (reason: unknown) => {
              present(options.error, reason, "danger");
              throw reason;
            },
          );
        return Object.defineProperty(pending, "id", {
          value: id,
          enumerable: true,
        }) as ToastPromise<T>;
      },
      dismiss(id) {
        state.records.delete(id);
        if (!state.disposed) toaster.remove(id);
      },
      clear() {
        state.records.clear();
        if (!state.disposed) toaster.remove();
      },
    };
    return api;
  }, [toaster, prefix, state]);
  useEffect(
    () => () => {
      state.records.clear();
      toaster.remove();
    },
    [toaster, state],
  );
  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toaster
        toaster={toaster}
        ref={region}
        getRootNode={getRootNode}
        id={`dds-toast-region-${prefix}`}
        label={regionLabel ?? ""}
        aria-label={regionLabel ?? ""}
        role={regionLabel ? "region" : "presentation"}
        className={classes("dds-toast-region", className)}
      >
        {(toast) => {
          const record = toast.meta?.dds as ToastRecord;
          return (
            <ArkToast.Root
              className={classes(
                "dds-toast",
                `dds-toast--${record.tone ?? "info"}`,
                !!record.action && "dds-toast--action",
              )}
              role={record.tone === "danger" ? "alert" : "status"}
            >
              {record.tone === "loading" && (
                <span className="dds-spinner" aria-hidden="true" />
              )}
              <ArkToast.Description>{toast.description}</ArkToast.Description>
              {record.action && (
                <ArkToast.ActionTrigger className="dds-btn dds-btn--secondary dds-btn--sm dds-toast__action">
                  {record.action.label}
                </ArkToast.ActionTrigger>
              )}
              {dismissLabel && (
                <ArkToast.CloseTrigger
                  className="dds-iconbtn dds-iconbtn--sm"
                  aria-label={
                    typeof dismissLabel === "function"
                      ? dismissLabel(record)
                      : dismissLabel
                  }
                >
                  ×
                </ArkToast.CloseTrigger>
              )}
            </ArkToast.Root>
          );
        }}
      </Toaster>
    </ToastContext.Provider>
  );
}
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast must be called inside <ToastProvider>");
  return api;
}
