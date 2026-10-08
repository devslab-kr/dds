import { createSignal, onCleanup, onMount, type Accessor } from "solid-js";

export type Direction = "ltr" | "rtl";

/** SSR callers may supply direction; clients also inherit their containing DOM. */
export function useDirection(element: () => HTMLElement | undefined, explicit: Accessor<Direction | undefined>) {
  const [ambient, setAmbient] = createSignal<Direction>("ltr");
  onMount(() => {
    const parent = element()?.parentElement;
    if (!parent) return;
    const update = () => setAmbient(getComputedStyle(parent).direction === "rtl" ? "rtl" : "ltr");
    update();
    const observer = new MutationObserver(update);
    observer.observe(parent.ownerDocument.documentElement, { attributes: true, subtree: true, attributeFilter: ["dir"] });
    onCleanup(() => observer.disconnect());
  });
  return () => explicit() ?? ambient();
}
