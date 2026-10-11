import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { Toast as ArkToast, Toaster, createToaster } from "@ark-ui/react/toast";
import { classes } from "./controls";
export type ToastTone = "success" | "warning" | "danger" | "info";
export interface ToastInput {
  message: ReactNode;
  tone?: ToastTone;
  duration?: number;
}
export interface ToastRecord extends ToastInput {
  id: string;
}
export interface ToastApi {
  show: (toast: ToastInput) => string;
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
  const toaster = useMemo(
    () =>
      createToaster({
        placement: "bottom-end",
        overlap: false,
        gap: 8,
        offsets: "var(--dds-space-16)",
        removeDelay: 0,
        hotkey: ["DDS_NO_HOTKEY"],
      }),
    []
  );
  const api = useMemo<ToastApi>(() => {
    return {
      show(input) {
        const id = `dds-toast-${prefix}-${++sequence.current}`;
        const duration = input.duration ?? defaultDuration;
        toaster.create({
          id,
          description: input.message,
          type: input.tone === "danger" ? "error" : input.tone ?? "info",
          duration: duration > 0 ? duration : Infinity,
          meta: { dds: { ...input, id } },
        });
        return id;
      },
      dismiss: (id) => toaster.remove(id),
      clear: () => toaster.remove(),
    };
  }, [toaster, prefix, defaultDuration]);
  useEffect(() => () => toaster.remove(), [toaster]);
  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toaster
        toaster={toaster}
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
                `dds-toast--${record.tone ?? "info"}`
              )}
              role={record.tone === "danger" ? "alert" : "status"}
            >
              <ArkToast.Description>{toast.description}</ArkToast.Description>
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
