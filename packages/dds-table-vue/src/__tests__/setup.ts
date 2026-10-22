// jsdom lacks layout observers; actual positioning is checked in the desktop browser.
// Mirror the lifecycle-only observer stub used by the React/Solid adapter suites.
if (!globalThis.ResizeObserver) globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
