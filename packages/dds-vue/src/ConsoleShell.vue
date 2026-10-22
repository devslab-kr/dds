<script setup lang="ts">
import { onMounted, onScopeDispose, ref, useId } from 'vue'
export interface ConsoleNavItem { id: string; href: string; label: string; badge?: number; active?: boolean }
export interface ConsoleNavGroup { label: string; items: readonly ConsoleNavItem[] }
export interface ConsoleShellLabels { skip: string; menuOpen: string; menuClose: string; nav: string; badge: string }
export interface ConsoleHeader { title: string; eyebrow?: string }
const props = defineProps<{ surface: string; activePath: string; brand: { href: string; name: string; mark: string }; context?: readonly { label: string; value: string }[]; nav: readonly ConsoleNavGroup[]; labels: ConsoleShellLabels; header: ConsoleHeader }>()
const open = ref(false); const hydrated = ref(false); const id = `dds-console-${useId()}`
const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') open.value = false }
onMounted(() => { hydrated.value = true; document.addEventListener('keydown', escape) })
onScopeDispose(() => { if (typeof document !== 'undefined') document.removeEventListener('keydown', escape) })
function active(item: ConsoleNavItem) { return item.active ?? (item.href.split('/').filter(Boolean).length <= 1 ? props.activePath === item.href : props.activePath === item.href || props.activePath.startsWith(`${item.href}/`)) }
</script>
<template>
  <div class="dds-console-shell" :data-surface="surface" :data-hydrated="hydrated ? 'true' : undefined">
    <a class="dds-console-skip dds-visually-hidden" :href="`#${id}-main`">{{ labels.skip }}</a>
    <button type="button" class="dds-console-rail__toggle" :aria-controls="`${id}-rail`" :aria-expanded="open" @click="open = !open"><span aria-hidden="true" /><span class="dds-visually-hidden">{{ open ? labels.menuClose : labels.menuOpen }}</span></button>
    <div class="dds-console-rail__scrim" :data-open="String(open)" @click="open = false" />
    <aside :id="`${id}-rail`" class="dds-console-rail" :data-open="String(open)">
      <a class="dds-console-rail__brand" :href="brand.href"><img :src="brand.mark" alt="" /><strong>{{ brand.name }}</strong></a>
      <dl v-if="context?.length" class="dds-console-rail__context"><div v-for="(row, i) in context" :key="i"><dt>{{ row.label }}</dt><dd>{{ row.value }}</dd></div></dl>
      <nav class="dds-console-rail__nav" :aria-label="labels.nav"><section v-for="(group, i) in nav" :key="i" class="dds-console-rail__group" :aria-labelledby="`${id}-group-${i}`"><h2 :id="`${id}-group-${i}`" class="dds-console-rail__group-label">{{ group.label }}</h2><ul><li v-for="item in group.items" :key="item.id"><a class="dds-console-rail__item" :href="item.href" :data-nav="`${surface}.${item.id}`" :aria-current="active(item) ? 'page' : undefined" @click="open = false"><span>{{ item.label }}</span><span v-if="item.badge !== undefined && item.badge > 0" class="dds-console-rail__badge" :aria-label="labels.badge.replace('{count}', String(item.badge))">{{ item.badge }}</span></a></li></ul></section></nav>
      <div v-if="$slots.foot" class="dds-console-rail__foot"><slot name="foot" /></div>
    </aside>
    <main :id="`${id}-main`" class="dds-console-main" tabindex="-1"><header class="dds-console-page-header"><div class="dds-console-page-header__text"><p v-if="header.eyebrow" class="dds-console-page-eyebrow">{{ header.eyebrow }}</p><h1>{{ header.title }}</h1></div><div v-if="$slots.actions" class="dds-console-page-header__actions"><slot name="actions" /></div></header><slot /></main>
  </div>
</template>
