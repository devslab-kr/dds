<script lang="ts">
  import {
    Layout,
    LeftNav,
    TopNav,
  } from "../../../packages/dds-svelte/src/lib";
  let { navigationPosition }: { navigationPosition: "left" | "top" } = $props();
  const nav = [
    {
      id: "services",
      label: "Services",
      collapsible: true,
      items: [{ id: "products", href: "#products", label: "Products" }],
    },
    {
      id: "settings",
      label: "Settings",
      collapsible: true,
      items: [{ id: "policies", href: "#policies", label: "Policies" }],
    },
  ];
  const labels = {
    skip: "Skip to content",
    menuOpen: "Open menu",
    menuClose: "Close menu",
    nav: "Navigation",
    badge: "{count} items",
  };
</script>

<Layout {navigationPosition} {labels}
  >{#snippet railStart()}<a class="dds-console-rail__brand" href="#brand"
      ><strong>DevsLab</strong></a
    >{/snippet}{#snippet navigation()}{#if navigationPosition === "left"}<LeftNav
        surface="fixture"
        activePath="#products"
        {nav}
        {labels}
      />{:else}<TopNav
        surface="fixture"
        activePath="#products"
        {nav}
        {labels}
      />{/if}{/snippet}{#snippet header()}<h1>Page title</h1>{/snippet}
  <p>Body text</p>
  <section class="dds-layout__section dds-layout__panel">
    <h2>Section title</h2>
    <div class="dds-layout__fields">
      <label class="dds-field-label"
        >Name<input
          class="dds-input"
          aria-label="Name"
          value="Example"
          readonly
        /></label
      ><span class="dds-chip">진행 대기</span>
    </div>
  </section>
  <p class="dds-layout__caption">Supporting description</p></Layout
>
