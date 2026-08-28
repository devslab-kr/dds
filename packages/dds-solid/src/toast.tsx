import {
  For,
  createContext,
  createSignal,
  onCleanup,
  useContext,
  type JSX,
} from "solid-js";

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
  class?: string;
}

export function ToastProvider(props: ToastProviderProps) {
  const [toasts, setToasts] = createSignal<ToastRecord[]>([]);
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  let sequence = 0;
  const dismiss = (id: string) => {
    const timer = timers.get(id);
    if (timer) clearTimeout(timer);
    timers.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };
  const api: ToastApi = {
    show(input) {
      const id = `dds-toast-${++sequence}`;
      setToasts((current) => [...current, { ...input, id }]);
      const duration = input.duration ?? props.defaultDuration ?? 5000;
      if (duration > 0) timers.set(id, setTimeout(() => dismiss(id), duration));
      return id;
    },
    dismiss,
    clear() {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
      setToasts([]);
    },
  };
  onCleanup(api.clear);
  return (
    <ToastContext.Provider value={api}>
      {props.children}
      <div class={classes("dds-toast-region", props.class)} aria-live="polite" aria-relevant="additions removals">
        <For each={toasts()}>{(toast) => (
          <div class={classes("dds-toast", `dds-toast--${toast.tone ?? "info"}`)} role={toast.tone === "danger" ? "alert" : "status"}>
            <span>{toast.message}</span>
            <button type="button" class="dds-iconbtn dds-iconbtn--sm" aria-label="Dismiss notification" onClick={() => dismiss(toast.id)}>×</button>
          </div>
        )}</For>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be called inside <ToastProvider>");
  return context;
}
