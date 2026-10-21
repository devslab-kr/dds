<script setup lang="ts">
/** DDS 공식 CSS Button의 Vue 전달 어댑터. 스타일·상태 규칙은 패키지에서 소비한다. */
withDefaults(defineProps<{
  tone?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  loading?: boolean
  disabled?: boolean
}>(), { tone: 'primary', size: 'md', type: 'button', loading: false, disabled: false })
</script>

<template>
  <button :type="type" class="dds-btn" :class="[`dds-btn--${tone}`, size === 'md' ? '' : `dds-btn--${size}`]"
    :disabled="disabled || loading" :aria-busy="loading || undefined">
    <slot /><span v-if="loading" class="dds-spinner" aria-hidden="true"></span>
  </button>
</template>
