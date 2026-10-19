import { createSignal, getOwner, onCleanup, type Accessor } from "solid-js";

/** Options for one `run` call. */
export interface PendingActionRunOptions {
  /**
   * Start even while another action runs: that one is aborted and this one takes its place, so the
   * latest request wins (a list reload after typing, paging or sorting). Without it a second start
   * while one runs is ignored, which is what a button wants.
   */
  replace?: boolean;
}

/**
 * Which of a screen's actions is running. A screen with several buttons gives each one its own
 * key, so only the button that started the work shows progress, while every other control can
 * still be locked through `busy`. One shared flag for all the buttons spins every one of them.
 */
export interface PendingAction<K extends string = string> {
  /** The key of the action now running, or null. */
  readonly current: Accessor<K | null>;
  /** True while any action runs: lock the other controls with it. */
  readonly busy: Accessor<boolean>;
  /** True while `key` is the running action: give that control its progress state. */
  is(key: K): boolean;
  /**
   * Runs `task` as `key` and clears the state when it settles, whether it resolves or throws (the
   * error reaches the caller). While another action runs it does nothing and resolves to undefined,
   * unless `replace` is set. The task receives a signal that aborts when this run stops counting:
   * `reset()`, a run that replaced it, or the owner going away. Check `signal.aborted` after each
   * await before touching the screen, or pass the signal to `fetch`.
   */
  run<T>(key: K, task: (signal: AbortSignal) => T | Promise<T>, options?: PendingActionRunOptions): Promise<T | undefined>;
  /** Stops tracking the running action and aborts its signal, for example when the screen's data was replaced. */
  reset(): void;
}

/** Tracks the running action of a screen; created in a component, it stops with that component. */
export function createPendingAction<K extends string = string>(): PendingAction<K> {
  const [current, setCurrent] = createSignal<K | null>(null);
  let active: AbortController | null = null;
  let disposed = false;
  const stop = () => {
    active?.abort();
    active = null;
  };
  if (getOwner()) onCleanup(() => { disposed = true; stop(); });
  return {
    current,
    busy: () => current() !== null,
    is: (key) => current() === key,
    async run(key, task, options) {
      if (disposed || (active && !options?.replace)) return undefined;
      stop();
      const controller = new AbortController();
      active = controller;
      setCurrent(() => key);
      try {
        return await task(controller.signal);
      } finally {
        if (active === controller) {
          active = null;
          setCurrent(null);
        }
      }
    },
    reset() {
      stop();
      setCurrent(null);
    },
  };
}
