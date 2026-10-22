import {
  createSignal,
  createUniqueId,
  onMount,
  onCleanup,
  type JSX,
} from "solid-js";
export interface LayoutProps {
  navigationPosition?: "left" | "top";
  contentWidth?: "workspace" | "form" | "settings" | "full";
  labels: { skip: string; menuOpen: string; menuClose: string };
  surface?: string;
  header?: JSX.Element;
  navigation?: JSX.Element;
  railStart?: JSX.Element;
  railEnd?: JSX.Element;
  footer?: JSX.Element;
  children: JSX.Element;
}
export function Layout(props: LayoutProps): JSX.Element {
  const id = createUniqueId(),
    railId = `dds-console-rail-${id}`,
    mainId = `dds-console-main-${id}`;
  const [open, setOpen] = createSignal(false),
    [hydrated, setHydrated] = createSignal(false);
  let toggle: HTMLButtonElement | undefined, rail: HTMLElement | undefined;
  function close() {
    setOpen(false);
    toggle?.focus();
  }
  function focusables() {
    return [
      toggle,
      ...Array.from(
        rail?.querySelectorAll<HTMLElement>(
          'a[href],button,summary,input,select,textarea,[tabindex="0"]',
        ) ?? [],
      ),
    ].filter(
      (el): el is HTMLElement =>
        !!el &&
        !el.closest("[hidden]") &&
        el.getClientRects().length > 0 &&
        getComputedStyle(el).visibility !== "hidden" &&
        !Array.from(rail?.querySelectorAll("details:not([open])") ?? []).some(
          (details) =>
            details.contains(el) &&
            !details.querySelector("summary")?.contains(el),
        ) &&
        !el.hasAttribute("disabled"),
    );
  }
  onMount(() => {
    setHydrated(true);
    if (typeof window.matchMedia === "function") {
      const media = window.matchMedia("(max-width: 56.25rem)");
      const resize = () => {
        if (!media.matches) setOpen(false);
      };
      media.addEventListener("change", resize);
      onCleanup(() => media.removeEventListener("change", resize));
    }
    function key(event: KeyboardEvent) {
      if (!open()) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      if (event.key === "Tab") {
        const items = focusables(),
          first = items[0],
          last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    onCleanup(() => document.removeEventListener("keydown", key));
  });
  return (
    <div
      class="dds-console-shell dds-layout"
      data-navigation-position={props.navigationPosition ?? "left"}
      data-surface={props.surface}
      data-hydrated={hydrated() ? "true" : undefined}
    >
      <a class="dds-console-skip dds-visually-hidden" href={`#${mainId}`}>
        {props.labels.skip}
      </a>
      <button
        ref={toggle}
        class="dds-console-rail__toggle"
        type="button"
        data-action="toggle-rail"
        aria-controls={railId}
        aria-expanded={open()}
        onClick={() => {
          if (open()) close();
          else {
            setOpen(true);
            queueMicrotask(() => focusables()[1]?.focus());
          }
        }}
      >
        <span aria-hidden="true" />
        <span class="dds-visually-hidden">
          {open() ? props.labels.menuClose : props.labels.menuOpen}
        </span>
      </button>
      <div
        class="dds-console-rail__scrim"
        data-open={String(open())}
        onClick={close}
      />
      <aside
        ref={rail}
        id={railId}
        class="dds-console-rail dds-layout__navigation"
        data-open={String(open())}
        onClick={(event) => {
          if (
            open() &&
            event.target instanceof Element &&
            event.target.closest("a[href]")
          )
            close();
        }}
      >
        {props.railStart}
        {props.navigation}
        {props.railEnd}
      </aside>
      <main id={mainId} class="dds-console-main dds-layout__main" tabIndex={-1}>
        <div
          class="dds-layout__content"
          data-width={props.contentWidth ?? "workspace"}
        >
          {props.header && (
            <header class="dds-layout__header">{props.header}</header>
          )}
          {props.children}
          {props.footer && (
            <footer class="dds-layout__footer">{props.footer}</footer>
          )}
        </div>
      </main>
    </div>
  );
}
