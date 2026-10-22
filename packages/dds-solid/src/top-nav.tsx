import { For, onMount, onCleanup, type JSX } from "solid-js";
import type { LeftNavProps } from "./left-nav";
export type TopNavProps = Pick<
  LeftNavProps,
  "surface" | "activePath" | "nav" | "labels" | "onNavigate"
>;
export function TopNav(props: TopNavProps): JSX.Element {
  let root: HTMLElement | undefined;
  onMount(() => {
    const outside = (event: PointerEvent) => {
      if (!root?.contains(event.target as Node))
        root
          ?.querySelectorAll("details[open]")
          .forEach((el) => el.removeAttribute("open"));
    };
    document.addEventListener("pointerdown", outside);
    onCleanup(() => document.removeEventListener("pointerdown", outside));
  });
  return (
    <nav
      ref={root}
      class="dds-top-nav"
      aria-label={props.labels.nav}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        const details = (event.target as Element).closest("details");
        if (details?.open) {
          event.preventDefault();
          event.stopPropagation();
          details.open = false;
          details.querySelector("summary")?.focus();
        }
      }}
    >
      <For each={props.nav}>
        {(group) => (
          <details class="dds-top-nav__group">
            <summary class="dds-top-nav__trigger">{group.label}</summary>
            <ul class="dds-top-nav__items">
              <For each={group.items}>
                {(item) => (
                  <li>
                    <a
                      class="dds-top-nav__item"
                      data-nav={`${props.surface}.${item.id}`}
                      href={item.href}
                      aria-current={
                        (item.active ??
                        (props.activePath === item.href ||
                          (item.href.split("/").filter(Boolean).length > 1 &&
                            props.activePath.startsWith(`${item.href}/`))))
                          ? "page"
                          : undefined
                      }
                      onClick={(event) => {
                        event.currentTarget
                          .closest("details")
                          ?.removeAttribute("open");
                        props.onNavigate?.();
                      }}
                    >
                      {item.icon != null && (
                        <span class="dds-top-nav__item-icon" aria-hidden="true">
                          {item.icon}
                        </span>
                      )}
                      <span>{item.label}</span>
                      {item.badge != null && item.badge > 0 && (
                        <span
                          class="dds-console-rail__badge"
                          aria-label={props.labels.badge.replace(
                            "{count}",
                            () => String(item.badge),
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </a>
                  </li>
                )}
              </For>
            </ul>
          </details>
        )}
      </For>
    </nav>
  );
}
