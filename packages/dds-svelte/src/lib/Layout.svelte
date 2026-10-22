<script lang="ts">
  import { onMount, tick } from "svelte";
  import type { LayoutProps } from "./types";
  let {
    navigationPosition = "left",
    contentWidth = "workspace",
    labels,
    surface,
    header,
    navigation,
    railStart,
    railEnd,
    footer,
    children,
  }: LayoutProps = $props();
  const id = $props.id(),
    railId = `dds-console-rail-${id}`,
    mainId = `dds-console-main-${id}`;
  let open = $state(false),
    hydrated = $state(false),
    opener: HTMLButtonElement,
    rail: HTMLElement;
  function close() {
    open = false;
    opener?.focus();
  }
  function focusables() {
    return [
      opener,
      ...Array.from(
        rail?.querySelectorAll<HTMLElement>(
          'a[href],button,summary,input,select,textarea,[tabindex="0"]',
        ) ?? [],
      ),
    ].filter(
      (el) =>
        el &&
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
  async function toggle() {
    if (open) close();
    else {
      open = true;
      await tick();
      focusables()[1]?.focus();
    }
  }
  function key(event: KeyboardEvent) {
    if (!open) return;
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
  function navigate(event: MouseEvent) {
    if (
      open &&
      event.target instanceof Element &&
      event.target.closest("a[href]")
    )
      close();
  }
  onMount(() => {
    hydrated = true;
    const media =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(max-width: 56.25rem)")
        : undefined;
    const resize = () => {
      if (!media?.matches) open = false;
    };
    media?.addEventListener("change", resize);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      media?.removeEventListener("change", resize);
    };
  });
</script>

<div
  class="dds-console-shell dds-layout"
  data-navigation-position={navigationPosition}
  data-surface={surface}
  data-hydrated={hydrated ? "true" : undefined}
>
  <a class="dds-console-skip dds-visually-hidden" href={`#${mainId}`}
    >{labels.skip}</a
  >
  <button
    bind:this={opener}
    class="dds-console-rail__toggle"
    type="button"
    data-action="toggle-rail"
    aria-controls={railId}
    aria-expanded={open}
    onclick={toggle}
    ><span aria-hidden="true"></span><span class="dds-visually-hidden"
      >{open ? labels.menuClose : labels.menuOpen}</span
    ></button
  >
  <button
    type="button"
    tabindex="-1"
    aria-label={labels.menuClose}
    class="dds-console-rail__scrim"
    data-open={String(open)}
    onclick={close}
  ></button>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_click_events_have_key_events -->
  <aside
    bind:this={rail}
    id={railId}
    class="dds-console-rail dds-layout__navigation"
    data-open={String(open)}
    onclick={navigate}
  >
    {@render railStart?.()}{@render navigation?.()}{@render railEnd?.()}
  </aside>
  <main id={mainId} class="dds-console-main dds-layout__main" tabindex="-1">
    <div class="dds-layout__content" data-width={contentWidth}>
      {#if header}<header class="dds-layout__header">
          {@render header()}
        </header>{/if}{@render children?.()}{#if footer}<footer
          class="dds-layout__footer"
        >
          {@render footer()}
        </footer>{/if}
    </div>
  </main>
</div>
