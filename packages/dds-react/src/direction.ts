import { useEffect, useState, type RefObject } from "react";

export type Direction = "ltr" | "rtl";

/** SSR callers may supply direction; clients also inherit their containing DOM. */
export function useDirection(
  element: RefObject<HTMLElement | null>,
  explicit: Direction | undefined,
): Direction {
  const [ambient, setAmbient] = useState<Direction>("ltr");
  useEffect(() => {
    const parent = element.current?.parentElement;
    if (!parent) return;
    const update = () =>
      setAmbient(getComputedStyle(parent).direction === "rtl" ? "rtl" : "ltr");
    update();
    const observer = new MutationObserver(update);
    observer.observe(parent.ownerDocument.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ["dir"],
    });
    return () => observer.disconnect();
  }, [element]);
  return explicit ?? ambient;
}
