<script lang="ts">
export type {
  ConsoleNavItem,
  ConsoleNavGroup,
  ConsoleShellLabels,
  ConsoleHeader,
} from "./console-shell.types";
</script>
<script setup lang="ts">
import { ref } from "vue";
import Layout from "./Layout.vue";
import LeftNav from "./LeftNav.vue";
import type { ConsoleShellProps } from "./console-shell.types";
withDefaults(defineProps<ConsoleShellProps>(), { nav: () => [] });
const emit = defineEmits<{ "update:expandedGroups": [groupIds: string[]] }>();
const layout = ref<InstanceType<typeof Layout>>();
const close = () => layout.value?.close();
</script>
<template>
  <Layout ref="layout" :labels="labels" :surface="surface">
    <template #railStart
      ><a class="dds-console-rail__brand" :href="brand.href"
        ><img :src="brand.mark" alt="" width="20" height="20" /><strong>{{
          brand.name
        }}</strong></a
      >
      <dl v-if="context?.length" class="dds-console-rail__context">
        <div v-for="(row, index) in context" :key="index">
          <dt>{{ row.label }}</dt>
          <dd>{{ row.value }}</dd>
        </div>
      </dl></template
    >
    <template #navigation
      ><slot name="navigation" :close="close"
        ><LeftNav
          :surface="surface"
          :active-path="activePath"
          :nav="nav"
          :labels="labels"
          :expanded-groups="expandedGroups"
          :default-expanded-groups="defaultExpandedGroups"
          @update:expanded-groups="emit('update:expandedGroups', $event)"
          @navigate="close" /></slot
    ></template>
    <template v-if="$slots.foot" #railEnd
      ><div class="dds-console-rail__foot"><slot name="foot" /></div
    ></template>
    <template #header
      ><div class="dds-console-page-header">
        <div class="dds-console-page-header__text">
          <p v-if="header.eyebrow" class="dds-console-page-eyebrow">
            {{ header.eyebrow }}
          </p>
          <h1>{{ header.title }}</h1>
        </div>
        <div
          v-if="$slots['header-actions'] || $slots.actions"
          class="dds-console-page-header__actions"
        >
          <slot name="header-actions"><slot name="actions" /></slot>
        </div></div
    ></template>
    <slot />
  </Layout>
</template>
