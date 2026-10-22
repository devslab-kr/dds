<script setup lang="ts">
import {
  Layout,
  LeftNav,
  TopNav,
} from "../../../packages/dds-vue/dist/index.js";
defineProps<{ navigationPosition: "left" | "top" }>();
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
<template>
  <Layout :navigation-position="navigationPosition" :labels="labels"
    ><template #railStart
      ><a class="dds-console-rail__brand" href="#brand"
        ><strong>DevsLab</strong></a
      ></template
    ><template #navigation
      ><component
        :is="navigationPosition === 'left' ? LeftNav : TopNav"
        surface="fixture"
        active-path="#products"
        :nav="nav"
        :labels="labels" /></template
    ><template #header><h1>Page title</h1></template>
    <p>Body text</p>
    <section class="dds-layout__section dds-layout__panel">
      <h2>Section title</h2>
      <div class="dds-layout__fields">
        <label class="dds-field-label"
          >Name<input
            class="dds-input"
            aria-label="Name"
            value="Example"
            readonly /></label
        ><span class="dds-chip">진행 대기</span>
      </div>
    </section>
    <p class="dds-layout__caption">Supporting description</p></Layout
  >
</template>
