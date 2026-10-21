<script setup lang="ts">
import { icons, type DdsIconName } from '@devslab/dds-icons'
defineProps<{ name: DdsIconName; label?: string; size?: number }>()
</script>
<template>
  <!-- v-html의 원본은 DDS 패키지의 고정 SVG 자산이며 사용자 입력을 받지 않는다. -->
  <svg class="dds-product-icon" :viewBox="icons[name].viewBox" fill="none" stroke="currentColor"
    :stroke-width="icons[name].strokeWidth" stroke-linecap="round" stroke-linejoin="round" :aria-hidden="label ? undefined : true" :role="label ? 'img' : undefined" :aria-label="label" :style="size ? { width: `${size}px`, height: `${size}px` } : undefined" v-html="icons[name].body"></svg>
</template>
<style scoped>
.dds-product-icon { width: var(--dds-space-20); height: var(--dds-space-20); flex: none; }
</style>
