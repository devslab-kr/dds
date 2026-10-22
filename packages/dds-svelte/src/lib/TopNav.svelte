<script lang="ts">
  import { onMount } from "svelte";
  import type { TopNavProps, ConsoleNavItem } from "./types";
  let { surface, activePath, nav, labels, onNavigate }: TopNavProps = $props();
  let root: HTMLElement;
  function active(item: ConsoleNavItem) {
    return (
      item.active ??
      (activePath === item.href ||
        (item.href.split("/").filter(Boolean).length > 1 &&
          activePath.startsWith(`${item.href}/`)))
    );
  }
  function outside(event: PointerEvent) {
    if (!root?.contains(event.target as Node))
      root
        ?.querySelectorAll("details[open]")
        .forEach((el) => el.removeAttribute("open"));
  }
  function key(event: KeyboardEvent) {
    if (event.key !== "Escape") return;
    const details = (event.target as Element).closest("details");
    if (details?.open) {
      event.preventDefault();
      event.stopPropagation();
      details.open = false;
      details.querySelector("summary")?.focus();
    }
  }
  function navigate(event: MouseEvent) {
    (event.currentTarget as Element)
      .closest("details")
      ?.removeAttribute("open");
    onNavigate?.();
  }
  onMount(() => {
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  });
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<nav
  bind:this={root}
  class="dds-top-nav"
  aria-label={labels.nav}
  onkeydown={key}
>
  {#each nav as group, index (group.id ?? index)}<details
      class="dds-top-nav__group"
    >
      <summary class="dds-top-nav__trigger">{group.label}</summary>
      <ul class="dds-top-nav__items">
        {#each group.items as item (item.id)}<li>
            <a
              class="dds-top-nav__item"
              data-nav={`${surface}.${item.id}`}
              href={item.href}
              aria-current={active(item) ? "page" : undefined}
              onclick={navigate}
              >{#if item.icon}<span
                  class="dds-top-nav__item-icon"
                  aria-hidden="true">{@render item.icon()}</span
                >{/if}<span>{item.label}</span
              >{#if item.badge != null && item.badge > 0}<span
                  class="dds-console-rail__badge"
                  aria-label={labels.badge.replace("{count}", () =>
                    String(item.badge),
                  )}>{item.badge}</span
                >{/if}</a
            >
          </li>{/each}
      </ul>
    </details>{/each}
</nav>
