<script setup lang="ts" generic="T = any">
import { AgGridVue } from 'ag-grid-vue3'
import { AllCommunityModule, type ColDef, type GridApi, type GridOptions, type GridReadyEvent } from 'ag-grid-community'
import { computed, onMounted, shallowRef, ref, useAttrs, watch } from 'vue'
import { ddsGridTheme } from './theme'
import type { DataTableGridProps } from './types'
defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{ rows: readonly T[]; columns: ColDef<T>[]; label: string; density?: 'comfortable' | 'dense'; gridProps?: DataTableGridProps<T> }>(), { density: 'comfortable', gridProps: () => ({}) })
const emit = defineEmits<{ gridReady: [event: GridReadyEvent<T>] }>()
const attrs = useAttrs(); const mounted = ref(false); const api = shallowRef<GridApi<T> | null>(null)
const rows = computed(() => [...props.rows])
const options = computed(() => { const { onGridReady: _ready, modules: _modules, ...rest } = props.gridProps; return { ...rest, defaultColDef: { sortable: true, resizable: true, minWidth: 120, ...props.gridProps.defaultColDef }, theme: props.gridProps.theme ?? ddsGridTheme, rowHeight: props.gridProps.rowHeight ?? (props.density === 'dense' ? 32 : 40), headerHeight: props.gridProps.headerHeight ?? (props.density === 'dense' ? 36 : 44) } })
const modules = [AllCommunityModule]
function ready(event: GridReadyEvent<T>) { api.value = event.api; event.api.setGridAriaProperty('label', props.label); props.gridProps.onGridReady?.(event); emit('gridReady', event) }
watch(() => props.label, label => { if (api.value && !api.value.isDestroyed()) api.value.setGridAriaProperty('label', label) })
onMounted(() => mounted.value = true)
defineExpose({ api, getApi: () => api.value })
</script>
<template>
  <div v-bind="attrs" class="dds-data-grid" :data-density="density" role="region" :aria-label="label" :aria-busy="!api || !!gridProps.loading">
    <AgGridVue v-if="mounted" v-bind="options" :modules="gridProps.modules ?? modules" :row-data="rows" :column-defs="columns" @grid-ready="ready" />
    <slot v-else name="placeholder" />
  </div>
</template>
