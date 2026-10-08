import { vi } from "vitest";

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
window.requestAnimationFrame = (callback) => window.setTimeout(() => callback(performance.now()), 16);
window.cancelAnimationFrame = (id) => window.clearTimeout(id);
vi.stubGlobal("requestAnimationFrame", window.requestAnimationFrame);
vi.stubGlobal("cancelAnimationFrame", window.cancelAnimationFrame);
