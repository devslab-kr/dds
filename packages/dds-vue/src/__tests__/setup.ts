// jsdom lacks layout observers; actual positioning is checked in the desktop browser.
// Mirror the lifecycle-only observer stub used by the React/Solid adapter suites.
if (!globalThis.ResizeObserver) globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// Ark Select scrolls its popup after keyboard selection; jsdom has no scrolling.
if (typeof HTMLElement !== 'undefined' && !HTMLElement.prototype.scrollTo) HTMLElement.prototype.scrollTo = function () {}
