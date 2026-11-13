// The segmented control's sliding face (D-055). One copy of this file lives in dds-react,
// dds-solid and dds-vue; tests/foundation-contracts.test.mjs keeps the three identical.

/**
 * Places the track's `.dds-segmented__indicator` on the chosen item and moves it when the
 * choice changes. Returns the function that stops it.
 *
 * - Without `ResizeObserver` (a server, a test DOM, an old browser) it does nothing: the
 *   indicator stays `hidden` and the chosen item paints its own face. No slide, nothing lost.
 * - The first placement, and a resize of the same choice, put it there without travel; only a
 *   different chosen item slides (the transition itself is in the CSS).
 */
export function attachSegmentIndicator(track: HTMLElement): () => void {
  const view = track.ownerDocument.defaultView;
  const indicator = track.querySelector<HTMLElement>(":scope > .dds-segmented__indicator");
  if (!view || typeof view.ResizeObserver !== "function" || !indicator) return () => {};
  let chosen: HTMLElement | null = null;
  let frame = 0;
  const place = () => {
    const item = track.querySelector<HTMLElement>('.dds-segmented__item[data-state="checked"]');
    if (!item) {
      indicator.hidden = true;
      chosen = null;
      return;
    }
    // A different chosen item slides; the slide is switched off again when it ends, so a later
    // resize moves without travel. A resize during a slide only retargets it.
    if (chosen !== null && chosen !== item) indicator.style.transitionProperty = "left, top, width, height";
    chosen = item;
    indicator.style.setProperty("--left", `${item.offsetLeft}px`);
    indicator.style.setProperty("--top", `${item.offsetTop}px`);
    indicator.style.setProperty("--width", `${item.offsetWidth}px`);
    indicator.style.setProperty("--height", `${item.offsetHeight}px`);
    indicator.hidden = item.offsetWidth === 0 && item.offsetHeight === 0;
  };
  // Measured on the next frame, not inside the observer's callback (that would loop it).
  const later = () => {
    view.cancelAnimationFrame(frame);
    frame = view.requestAnimationFrame(place);
  };
  const settle = (event: TransitionEvent) => {
    if (event.target === indicator) indicator.style.transitionProperty = "none";
  };
  indicator.addEventListener("transitionend", settle);
  indicator.addEventListener("transitioncancel", settle);
  const resize = new view.ResizeObserver(later);
  const observeAll = () => {
    resize.observe(track);
    for (const child of Array.from(track.children)) resize.observe(child);
  };
  const mutation = new view.MutationObserver((records) => {
    if (records.some((record) => record.type === "childList")) observeAll();
    place();
  });
  mutation.observe(track, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-state"] });
  observeAll();
  place();
  return () => {
    indicator.removeEventListener("transitionend", settle);
    indicator.removeEventListener("transitioncancel", settle);
    resize.disconnect();
    mutation.disconnect();
    view.cancelAnimationFrame(frame);
  };
}
