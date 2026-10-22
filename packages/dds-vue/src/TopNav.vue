<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import type { TopNavProps, ConsoleNavItem } from "./console-shell.types";
const props = defineProps<TopNavProps>();
const emit = defineEmits<{ navigate: [] }>();
const root = ref<HTMLElement>();
function outside(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node))
    root.value
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
function active(item: ConsoleNavItem) {
  return (
    item.active ??
    (props.activePath === item.href ||
      (item.href.split("/").filter(Boolean).length > 1 &&
        props.activePath.startsWith(`${item.href}/`)))
  );
}
function navigate(event: MouseEvent) {
  (event.currentTarget as Element).closest("details")?.removeAttribute("open");
  emit("navigate");
}
onMounted(() => document.addEventListener("pointerdown", outside));
onUnmounted(() => document.removeEventListener("pointerdown", outside));
</script>
<template>
  <nav ref="root" class="dds-top-nav" :aria-label="labels.nav" @keydown="key">
    <details
      v-for="(group, index) in nav"
      :key="group.id ?? index"
      class="dds-top-nav__group"
    >
      <summary class="dds-top-nav__trigger">{{ group.label }}</summary>
      <ul class="dds-top-nav__items">
        <li v-for="item in group.items" :key="item.id">
          <a
            class="dds-top-nav__item"
            :data-nav="`${surface}.${item.id}`"
            :href="item.href"
            :aria-current="active(item) ? 'page' : undefined"
            @click="navigate"
            ><span
              v-if="item.icon"
              class="dds-top-nav__item-icon"
              aria-hidden="true"
              ><component :is="item.icon" /></span
            ><span>{{ item.label }}</span
            ><span
              v-if="item.badge != null && item.badge > 0"
              class="dds-console-rail__badge"
              :aria-label="
                labels.badge.replace('{count}', () => String(item.badge))
              "
              >{{ item.badge }}</span
            ></a
          >
        </li>
      </ul>
    </details>
  </nav>
</template>
