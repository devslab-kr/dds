import { StrictMode } from "react";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button, usePendingAction } from "../index";

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => { resolve = yes; });
  return { promise, resolve };
}

describe("usePendingAction", () => {
  it("marks only the running key and clears it when the task settles", async () => {
    const { result } = renderHook(() => usePendingAction<"approve" | "reject">());
    const work = deferred<string>();
    let outcome!: Promise<string | undefined>;
    act(() => { outcome = result.current.run("reject", () => work.promise); });
    expect(result.current.current).toBe("reject");
    expect(result.current.is("reject")).toBe(true);
    expect(result.current.is("approve")).toBe(false);
    expect(result.current.busy).toBe(true);
    await act(async () => { work.resolve("saved"); await outcome; });
    await expect(outcome).resolves.toBe("saved");
    expect(result.current.busy).toBe(false);
  });

  it("ignores a second start, even in the same event loop turn", async () => {
    const { result } = renderHook(() => usePendingAction<"approve" | "reject">());
    const work = deferred();
    const second = vi.fn();
    let first!: Promise<void | undefined>;
    let skipped!: Promise<unknown>;
    act(() => {
      first = result.current.run("approve", () => work.promise);
      // Same render: the state has not landed yet, the guard still holds.
      skipped = result.current.run("reject", second);
    });
    await expect(skipped).resolves.toBeUndefined();
    expect(second).not.toHaveBeenCalled();
    expect(result.current.is("approve")).toBe(true);
    await act(async () => { work.resolve(); await first; });
    expect(result.current.busy).toBe(false);
  });

  it("with replace, aborts the running action and lets the latest one win", async () => {
    const { result } = renderHook(() => usePendingAction<"list" | "dates">());
    const old = deferred();
    const fresh = deferred();
    let oldSignal!: AbortSignal;
    let stale!: Promise<unknown>;
    let latest!: Promise<unknown>;
    act(() => { stale = result.current.run("list", (signal) => { oldSignal = signal; return old.promise; }); });
    act(() => { latest = result.current.run("dates", () => fresh.promise, { replace: true }); });
    expect(oldSignal.aborted).toBe(true);
    expect(result.current.is("dates")).toBe(true);
    await act(async () => { old.resolve(); await stale; });
    expect(result.current.is("dates")).toBe(true);
    await act(async () => { fresh.resolve(); await latest; });
    expect(result.current.busy).toBe(false);
  });

  it("clears the state and passes the error on when the task fails", async () => {
    const { result } = renderHook(() => usePendingAction());
    await act(async () => {
      await expect(result.current.run("save", async () => { throw new Error("failed"); })).rejects.toThrow("failed");
    });
    expect(result.current.busy).toBe(false);
    await act(async () => {
      await expect(result.current.run("save", () => { throw new Error("sync"); })).rejects.toThrow("sync");
    });
    expect(result.current.busy).toBe(false);
  });

  it("reset aborts the running action and its late completion cannot clear a newer one", async () => {
    const { result } = renderHook(() => usePendingAction<"old" | "new">());
    const old = deferred();
    const fresh = deferred();
    let oldSignal!: AbortSignal;
    let stale!: Promise<unknown>;
    let current!: Promise<unknown>;
    act(() => { stale = result.current.run("old", (signal) => { oldSignal = signal; return old.promise; }); });
    act(() => { result.current.reset(); });
    expect(oldSignal.aborted).toBe(true);
    expect(result.current.busy).toBe(false);
    act(() => { current = result.current.run("new", () => fresh.promise); });
    await act(async () => { old.resolve(); await stale; });
    expect(result.current.is("new")).toBe(true);
    await act(async () => { fresh.resolve(); await current; });
    expect(result.current.busy).toBe(false);
  });

  it("aborts the running action when the component unmounts", async () => {
    const { result, unmount } = renderHook(() => usePendingAction());
    const work = deferred();
    let signal!: AbortSignal;
    let running!: Promise<unknown>;
    act(() => { running = result.current.run("save", (next) => { signal = next; return work.promise; }); });
    unmount();
    expect(signal.aborted).toBe(true);
    work.resolve();
    await running;
  });

  it("spins only the clicked button and locks the other one, in StrictMode too", async () => {
    const work = deferred();
    function Decision() {
      const action = usePendingAction<"approve" | "reject">();
      return <>
        <Button tone="danger" loading={action.is("reject")} disabled={action.busy}
          onClick={() => void action.run("reject", () => work.promise)}>반려</Button>
        <Button loading={action.is("approve")} disabled={action.busy}
          onClick={() => void action.run("approve", () => work.promise)}>승인</Button>
      </>;
    }
    render(<StrictMode><Decision /></StrictMode>);
    await userEvent.click(screen.getByRole("button", { name: "반려" }));
    const reject = screen.getByRole("button", { name: "반려" });
    const approve = screen.getByRole("button", { name: "승인" });
    expect(reject.getAttribute("aria-busy")).toBe("true");
    expect(approve.hasAttribute("aria-busy")).toBe(false);
    expect(approve).toBeDisabled();
    expect(approve.querySelector(".dds-spinner")).toBeNull();
    await act(async () => { work.resolve(); await work.promise; });
    await waitFor(() => expect(reject.hasAttribute("aria-busy")).toBe(false));
    expect(approve).not.toBeDisabled();
  });
});
