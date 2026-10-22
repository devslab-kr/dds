<script setup lang="ts">
import { computed, ref, useId } from "vue";
import type { ConsoleNavItem, LeftNavProps } from "./console-shell.types";
const props = defineProps<LeftNavProps>();
const emit = defineEmits<{
  "update:expandedGroups": [groupIds: string[]];
  navigate: [];
}>();
const id = useId();
function isActive(item: ConsoleNavItem) {
  return (
    item.active ??
    (item.href.split("/").filter(Boolean).length <= 1
      ? props.activePath === item.href
      : props.activePath === item.href ||
        props.activePath.startsWith(`${item.href}/`))
  );
}
const internalExpandedGroups = ref<readonly string[]>(
  props.defaultExpandedGroups ??
    props.nav.flatMap((group, index) =>
      group.collapsible && group.items.some(isActive)
        ? [group.id ?? `group-${index}`]
        : [],
    ),
);
const expanded = computed(
  () => props.expandedGroups ?? internalExpandedGroups.value,
);
function toggleGroup(groupId: string) {
  const next = expanded.value.includes(groupId)
    ? expanded.value.filter((value) => value !== groupId)
    : [...expanded.value, groupId];
  if (props.expandedGroups === undefined) internalExpandedGroups.value = next;
  emit("update:expandedGroups", next);
}
</script>

<template>
  <nav class="dds-console-rail__nav" :aria-label="labels.nav">
    <section
      v-for="(group, index) in nav"
      :key="group.id ?? index"
      class="dds-console-rail__group"
      :data-collapsible="group.collapsible ? 'true' : undefined"
      :aria-labelledby="`${id}-group-${index}`"
    >
      <h2 :id="`${id}-group-${index}`" class="dds-console-rail__group-label">
        <button
          v-if="group.collapsible"
          type="button"
          class="dds-console-rail__group-toggle"
          :aria-expanded="expanded.includes(group.id ?? `group-${index}`)"
          :aria-controls="`${id}-group-items-${index}`"
          @click="toggleGroup(group.id ?? `group-${index}`)"
        >
          <span>{{ group.label }}</span
          ><span class="dds-console-rail__chevron" aria-hidden="true"></span>
        </button>
        <template v-else>{{ group.label }}</template>
      </h2>
      <ul
        :id="`${id}-group-items-${index}`"
        :hidden="
          group.collapsible && !expanded.includes(group.id ?? `group-${index}`)
        "
      >
        <li v-for="item in group.items" :key="item.id">
          <a
            class="dds-console-rail__item"
            :data-nav="`${surface}.${item.id}`"
            :href="item.href"
            :aria-current="isActive(item) ? 'page' : undefined"
            @click="emit('navigate')"
          >
            <span v-if="item.icon" class="dds-console-rail__item-content">
              <span class="dds-console-rail__item-icon" aria-hidden="true"
                ><component :is="item.icon"
              /></span>
              <span>{{ item.label }}</span>
            </span>
            <span v-else>{{ item.label }}</span>
            <span
              v-if="item.badge !== undefined && item.badge > 0"
              class="dds-console-rail__badge"
              :aria-label="labels.badge.replace('{count}', String(item.badge))"
              >{{ item.badge }}</span
            >
          </a>
        </li>
      </ul>
    </section>
  </nav>
</template>
