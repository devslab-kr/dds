import { afterEach, vi } from "vitest";

// Geometry-dependent positioning is verified in a real browser. jsdom lacks
// ResizeObserver; this stub only lets component lifecycle tests mount poppers.
vi.stubGlobal("ResizeObserver", class {
  observe() {}
  unobserve() {}
  disconnect() {}
});

// Browsers run a microtask checkpoint after EACH animation-frame callback.
// jsdom batches the callbacks in one synchronous loop, delaying Zag's queued
// focus event until after its selection callback. Separate tasks preserve the
// browser ordering instead of altering production keyboard behavior.
// The shim owns these timers: clear them after each test so a frame queued by
// the last interaction cannot fire after jsdom has torn the document down.
const animationFrameTimers = new Set<number>();
afterEach(() => {
  for (const id of animationFrameTimers) window.clearTimeout(id);
  animationFrameTimers.clear();
});
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
vi.stubGlobal("requestAnimationFrame", window.requestAnimationFrame);
vi.stubGlobal("cancelAnimationFrame", window.cancelAnimationFrame);
