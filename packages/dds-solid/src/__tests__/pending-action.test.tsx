import { createRoot } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button, createPendingAction } from "../index";

let dispose: (() => void) | undefined;
afterEach(() => { dispose?.(); dispose = undefined; document.body.replaceChildren(); });

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => { resolve = yes; });
  return { promise, resolve };
}

describe("createPendingAction", () => {
  it("marks only the running key and clears it when the task settles", async () => {
    const action = createPendingAction<"approve" | "reject">();
    const work = deferred<string>();
    const result = action.run("reject", () => work.promise);
    expect(action.current()).toBe("reject");
    expect(action.is("reject")).toBe(true);
    expect(action.is("approve")).toBe(false);
    expect(action.busy()).toBe(true);
    work.resolve("saved");
    await expect(result).resolves.toBe("saved");
    expect(action.current()).toBeNull();
    expect(action.busy()).toBe(false);
  });

  it("ignores a second start while one runs", async () => {
    const action = createPendingAction<"approve" | "reject">();
    const work = deferred();
    let firstSignal!: AbortSignal;
    const first = action.run("approve", (signal) => { firstSignal = signal; return work.promise; });
    const second = vi.fn();
    await expect(action.run("reject", second)).resolves.toBeUndefined();
    await expect(action.run("approve", second)).resolves.toBeUndefined();
    expect(second).not.toHaveBeenCalled();
    expect(firstSignal.aborted).toBe(false);
    expect(action.is("approve")).toBe(true);
    work.resolve();
    await first;
    expect(action.busy()).toBe(false);
  });

  it("with replace, aborts the running action and lets the latest one win", async () => {
    const action = createPendingAction<"list" | "dates">();
    const old = deferred();
    const fresh = deferred();
    let oldSignal!: AbortSignal;
    let freshSignal!: AbortSignal;
    const stale = action.run("list", (signal) => { oldSignal = signal; return old.promise; });
    const latest = action.run("dates", (signal) => { freshSignal = signal; return fresh.promise; }, { replace: true });
    expect(oldSignal.aborted).toBe(true);
    expect(action.is("dates")).toBe(true);
    old.resolve();
    await stale;
    expect(action.is("dates")).toBe(true);
    expect(freshSignal.aborted).toBe(false);
    fresh.resolve();
    await latest;
    expect(action.busy()).toBe(false);
  });

  it("clears the state and passes the error on when the task fails", async () => {
    const action = createPendingAction();
    await expect(action.run("save", async () => { throw new Error("failed"); })).rejects.toThrow("failed");
    expect(action.busy()).toBe(false);
    await expect(action.run("save", () => { throw new Error("sync"); })).rejects.toThrow("sync");
    expect(action.busy()).toBe(false);
  });

  it("reset aborts the running action and its late completion cannot clear a newer one", async () => {
    const action = createPendingAction<"old" | "new">();
    const old = deferred();
    let oldSignal!: AbortSignal;
    const stale = action.run("old", (signal) => { oldSignal = signal; return old.promise; });
    action.reset();
    expect(oldSignal.aborted).toBe(true);
    expect(action.busy()).toBe(false);
    const fresh = deferred();
    const current = action.run("new", () => fresh.promise);
    old.resolve();
    await stale;
    expect(action.is("new")).toBe(true);
    fresh.resolve();
    await current;
    expect(action.busy()).toBe(false);
  });

  it("aborts with its owner and starts nothing afterwards", async () => {
    const work = deferred();
    const action = createRoot((stop) => { dispose = stop; return createPendingAction(); });
    let signal!: AbortSignal;
    const running = action.run("save", (next) => { signal = next; return work.promise; });
    dispose?.(); dispose = undefined;
    expect(signal.aborted).toBe(true);
    work.resolve();
    await running;
    const late = vi.fn();
    await expect(action.run("again", late)).resolves.toBeUndefined();
    expect(late).not.toHaveBeenCalled();
  });

  it("spins only the clicked button and locks the other one", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const work = deferred();
    dispose = render(() => {
      const action = createPendingAction<"approve" | "reject">();
      return <>
        <Button tone="danger" loading={action.is("reject")} disabled={action.busy()}
          onClick={() => void action.run("reject", () => work.promise)}>반려</Button>
        <Button loading={action.is("approve")} disabled={action.busy()}
          onClick={() => void action.run("approve", () => work.promise)}>승인</Button>
      </>;
    }, host);
    const [reject, approve] = host.querySelectorAll("button");
    reject!.click();
    expect(reject!.getAttribute("aria-busy")).toBe("true");
    expect(approve!.hasAttribute("aria-busy")).toBe(false);
    expect(approve!.disabled).toBe(true);
    expect(approve!.querySelector(".dds-spinner")).toBeNull();
    work.resolve();
    await work.promise;
    await Promise.resolve();
    expect(reject!.hasAttribute("aria-busy")).toBe(false);
    expect(approve!.disabled).toBe(false);
  });
});
