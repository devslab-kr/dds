import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
const animationFrameTimers = new Set<number>();
afterEach(() => {
  cleanup();
  // This jsdom RAF shim owns its timers; dispose them before document teardown.
  for (const id of animationFrameTimers) window.clearTimeout(id);
  animationFrameTimers.clear();
});
if (!globalThis.ResizeObserver)
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
if (!globalThis.IntersectionObserver)
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
window.requestAnimationFrame = (callback) => {
  const id = window.setTimeout(() => {
    animationFrameTimers.delete(id);
    callback(performance.now());
  }, 16);
  animationFrameTimers.add(id);
  return id;
};
window.cancelAnimationFrame = (id) => {
  animationFrameTimers.delete(id);
  window.clearTimeout(id);
};
